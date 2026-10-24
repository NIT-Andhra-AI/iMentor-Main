use std::collections::{HashMap, HashSet};
use std::env;
use std::io::{self, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::thread;
use std::time::Instant;

// Deterministic Xorshift64 PRNG for reproducible tie-breaking & sampling
struct Xorshift64 {
    state: u64,
}
impl Xorshift64 {
    fn new(seed: u64) -> Self {
        Self { state: if seed == 0 { 0x853c49e6748fea9b } else { seed } }
    }
    fn next_u64(&mut self) -> u64 {
        let mut x = self.state;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        self.state = x;
        x
    }
}

fn json_escape(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 16);
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => out.push(' '),
            c => out.push(c),
        }
    }
    out
}

fn tokenize(text: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut cur = String::new();
    for c in text.chars() {
        if c.is_alphanumeric() || c == '-' {
            cur.push(c.to_ascii_lowercase());
        } else if !cur.is_empty() {
            if cur.len() >= 2 {
                tokens.push(std::mem::take(&mut cur));
            } else {
                cur.clear();
            }
        }
    }
    if cur.len() >= 2 {
        tokens.push(cur);
    }
    tokens
}

// 1. Academic Section, Metric & Entity Extractor (Multi-threaded ready)
struct ParsedPaperResult {
    methodology: String,
    datasets: String,
    results: String,
    limitations: String,
    metrics: Vec<String>,
    entities: Vec<String>,
    bm25_score: f64,
}

fn extract_window(body: &str, body_lower: &str, headers: &[&str], fallback_ratio: f64, max_len: usize) -> String {
    for h in headers {
        if let Some(pos) = body_lower.find(h) {
            let start = pos;
            let end = (start + max_len).min(body.len());
            let mut s = start;
            while s < body.len() && !body.is_char_boundary(s) { s += 1; }
            let mut e = end;
            while e > s && !body.is_char_boundary(e) { e -= 1; }
            return body[s..e].trim().to_string();
        }
    }
    let start = ((body.len() as f64) * fallback_ratio) as usize;
    let mut s = start.min(body.len());
    while s < body.len() && !body.is_char_boundary(s) { s += 1; }
    let mut e = (s + max_len).min(body.len());
    while e > s && !body.is_char_boundary(e) { e -= 1; }
    body[s..e].trim().to_string()
}

fn parse_academic_text(raw_text: &str, query_tokens: &[String]) -> ParsedPaperResult {
    let mut clean = String::with_capacity(raw_text.len());
    let mut space_run = 0;
    for c in raw_text.chars() {
        if c == ' ' || c == '\t' {
            space_run += 1;
            if space_run == 1 {
                clean.push(' ');
            }
        } else {
            space_run = 0;
            clean.push(c);
        }
    }

    let lower = clean.to_ascii_lowercase();
    let body_end = if let Some(idx) = lower.rfind("\nreferences") {
        if idx > clean.len() / 2 { idx } else { clean.len() }
    } else {
        clean.len()
    };
    let body = &clean[..body_end];
    let body_lower = &lower[..body_end];

    let methodology = extract_window(
        body,
        body_lower,
        &["\nmethodology", "\nproposed method", "\nsystem architecture", "\n3. method", "\nii. method", "\niii. method", "\nalgorithm"],
        0.22,
        1100,
    );
    let datasets = extract_window(
        body,
        body_lower,
        &["\nexperimental setup", "\ndataset", "\nimplementation details", "\nsimulation setup", "\ntestbed", "\nbenchmark"],
        0.48,
        900,
    );
    let results = extract_window(
        body,
        body_lower,
        &["\nexperimental results", "\nresults and discussion", "\nperformance evaluation", "\nablation study", "\ntable i", "\ntable 1"],
        0.65,
        1100,
    );
    let limitations = extract_window(
        body,
        body_lower,
        &["\nlimitations", "\nconclusion and future work", "\ndiscussion", "\nfuture work", "\nconclusion"],
        0.84,
        800,
    );

    // Extract quantitative sentences containing numbers + scientific units/metrics
    let unit_keywords = ["%", "db", "mhz", "ghz", "ms", "us", "ns", "rmse", "mae", "f1", "auc", "psnr", "ssim", "flops", "tops", "watt", "mv", "kv", "accuracy", "precision", "speedup"];
    let mut metrics = Vec::new();
    for line in body.split(|c| c == '.' || c == '\n') {
        let trimmed = line.trim();
        if trimmed.len() < 25 || trimmed.len() > 240 { continue; }
        let has_digit = trimmed.chars().any(|c| c.is_ascii_digit());
        if !has_digit { continue; }
        let l_low = trimmed.to_ascii_lowercase();
        if unit_keywords.iter().any(|u| l_low.contains(u)) {
            metrics.push(trimmed.to_string());
            if metrics.len() >= 8 { break; }
        }
    }

    // Extract high-value technical entities (acronyms 3-10 chars & hyphenated/CamelCase terms)
    let stop_acronyms: HashSet<&str> = ["THE", "AND", "FOR", "WITH", "FROM", "THIS", "THAT", "IEEE", "ACM", "PDF", "DOI", "URL", "FIG", "TAB", "SEC", "EQN", "ET", "AL", "USA", "ISSN", "ISBN"].into_iter().collect();
    let mut entity_counts: HashMap<String, usize> = HashMap::new();
    for word in body.split(|c: char| c.is_whitespace() || c == ',' || c == ';' || c == '(' || c == ')' || c == '[' || c == ']') {
        let w = word.trim_matches(|c: char| !c.is_alphanumeric() && c != '-');
        if w.len() >= 3 && w.len() <= 14 {
            let starts_upper = w.chars().next().map_or(false, |c| c.is_ascii_uppercase());
            let is_acro = starts_upper && w.chars().all(|c| c.is_ascii_uppercase() || c.is_ascii_digit() || c == '-') && w.chars().filter(|c| c.is_ascii_uppercase()).count() >= 2;
            let has_inner_cap = starts_upper && w.chars().skip(1).any(|c| c.is_ascii_uppercase()) && w.chars().any(|c| c.is_ascii_lowercase());
            if (is_acro && !stop_acronyms.contains(w)) || has_inner_cap {
                *entity_counts.entry(w.to_string()).or_insert(0) += 1;
            }
        }
    }
    let mut sorted_entities: Vec<(String, usize)> = entity_counts.into_iter().collect();
    sorted_entities.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
    let entities: Vec<String> = sorted_entities.into_iter().take(10).map(|(k, _)| k).collect();

    // Compute Okapi BM25 relevance score against query_tokens
    let doc_tokens = tokenize(body);
    let doc_len = doc_tokens.len().max(1) as f64;
    let avg_dl = 2500.0;
    let k1 = 1.5;
    let b = 0.75;
    let mut tf_map: HashMap<String, usize> = HashMap::new();
    for t in doc_tokens {
        *tf_map.entry(t).or_insert(0) += 1;
    }
    let mut bm25 = 0.0;
    for qt in query_tokens {
        let tf = *tf_map.get(qt).unwrap_or(&0) as f64;
        if tf > 0.0 {
            let num = tf * (k1 + 1.0);
            let den = tf + k1 * (1.0 - b + b * (doc_len / avg_dl));
            bm25 += (num / den) * 2.2;
        }
    }

    ParsedPaperResult {
        methodology,
        datasets,
        results,
        limitations,
        metrics,
        entities,
        bm25_score: (bm25 * 100.0).round() / 100.0,
    }
}

// 2. Academic Integrity & N-Gram Shingle + Burstiness Analyzer
fn analyze_integrity(text_a: &str, text_b: &str) -> String {
    let t0 = Instant::now();
    let toks_a = tokenize(text_a);
    let toks_b = tokenize(text_b);

    // 3-gram Jaccard Shingle Overlap
    let mut shingles_a = HashSet::new();
    let mut shingles_b = HashSet::new();
    if toks_a.len() >= 3 {
        for w in toks_a.windows(3) {
            shingles_a.insert(format!("{} {} {}", w[0], w[1], w[2]));
        }
    }
    if toks_b.len() >= 3 {
        for w in toks_b.windows(3) {
            shingles_b.insert(format!("{} {} {}", w[0], w[1], w[2]));
        }
    }
    let inter = shingles_a.intersection(&shingles_b).count() as f64;
    let union = shingles_a.union(&shingles_b).count().max(1) as f64;
    let jaccard_3gram = inter / union;

    // Sentence burstiness (coefficient of variation of sentence lengths in text_a)
    let sent_lengths: Vec<f64> = text_a
        .split(|c| c == '.' || c == '!' || c == '?')
        .map(|s| s.split_whitespace().count() as f64)
        .filter(|&n| n >= 3.0)
        .collect();
    let mean_len = if sent_lengths.is_empty() { 15.0 } else { sent_lengths.iter().sum::<f64>() / (sent_lengths.len() as f64) };
    let variance = if sent_lengths.len() <= 1 {
        0.0
    } else {
        sent_lengths.iter().map(|&x| (x - mean_len).powi(2)).sum::<f64>() / (sent_lengths.len() as f64)
    };
    let burstiness = variance.sqrt() / mean_len.max(1.0);
    let elapsed_us = t0.elapsed().as_micros();

    format!(
        "{{\"jaccard3Gram\": {:.4}, \"burstiness\": {:.4}, \"meanSentenceWords\": {:.2}, \"tokenCount\": {}, \"computeMicros\": {}}}",
        jaccard_3gram, burstiness, mean_len, toks_a.len(), elapsed_us
    )
}

fn process_batch_payload(input: &str) -> String {
    let t0 = Instant::now();
    // Lightweight delimiter protocol: First line = QUERY, followed by ===PAPER=== blocks
    let mut lines = input.lines();
    let query_line = lines.next().unwrap_or("");
    let query_tokens = tokenize(query_line);
    let rest: String = lines.collect::<Vec<&str>>().join("\n");
    let raw_papers: Vec<&str> = rest.split("===PAPER===").filter(|s| !s.trim().is_empty()).collect();

    // Process all papers in parallel across native OS threads using std::thread::scope
    let mut results = Vec::with_capacity(raw_papers.len());
    thread::scope(|s| {
        let mut handles = Vec::with_capacity(raw_papers.len());
        for paper_txt in &raw_papers {
            let q_ref = &query_tokens;
            handles.push(s.spawn(move || parse_academic_text(paper_txt, q_ref)));
        }
        for h in handles {
            if let Ok(res) = h.join() {
                results.push(res);
            }
        }
    });

    // Aggregate top cross-corpus entities
    let mut global_entities: HashMap<String, usize> = HashMap::new();
    let mut papers_json = Vec::with_capacity(results.len());
    for r in &results {
        for e in &r.entities {
            *global_entities.entry(e.clone()).or_insert(0) += 1;
        }
        let metrics_arr: Vec<String> = r.metrics.iter().map(|m| format!("\"{}\"", json_escape(m))).collect();
        let ents_arr: Vec<String> = r.entities.iter().map(|e| format!("\"{}\"", json_escape(e))).collect();
        papers_json.push(format!(
            "{{\"methodology\":\"{}\",\"datasets\":\"{}\",\"results\":\"{}\",\"limitations\":\"{}\",\"metrics\":[{}],\"entities\":[{}],\"bm25Score\":{:.2}}}",
            json_escape(&r.methodology),
            json_escape(&r.datasets),
            json_escape(&r.results),
            json_escape(&r.limitations),
            metrics_arr.join(","),
            ents_arr.join(","),
            r.bm25_score
        ));
    }

    let mut top_global: Vec<(String, usize)> = global_entities.into_iter().collect();
    top_global.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
    let top_global_json: Vec<String> = top_global.into_iter().take(12).map(|(k, c)| format!("{{\"entity\":\"{}\",\"count\":{}}}", json_escape(&k), c)).collect();

    let elapsed_us = t0.elapsed().as_micros();
    format!(
        "{{\"ok\":true,\"engine\":\"imentor-compute-kernel-rs\",\"paperCount\":{},\"computeMicros\":{},\"topCorpusEntities\":[{}],\"papers\":[{}]}}",
        results.len(),
        elapsed_us,
        top_global_json.join(","),
        papers_json.join(",")
    )
}

fn handle_http_client(mut stream: TcpStream) {
    let mut buf = vec![0u8; 2 * 1024 * 1024]; // 2MB buffer
    let mut total_read = 0;
    let mut header_end = None;
    let mut content_len = 0usize;

    loop {
        match stream.read(&mut buf[total_read..]) {
            Ok(0) => break,
            Ok(n) => {
                total_read += n;
                if header_end.is_none() {
                    if let Some(pos) = buf[..total_read].windows(4).position(|w| w == b"\r\n\r\n") {
                        header_end = Some(pos + 4);
                        let headers_str = String::from_utf8_lossy(&buf[..pos]);
                        for line in headers_str.lines() {
                            if line.to_ascii_lowercase().starts_with("content-length:") {
                                if let Some(v) = line.split(':').nth(1) {
                                    content_len = v.trim().parse::<usize>().unwrap_or(0);
                                }
                            }
                        }
                    }
                }
                if let Some(h_end) = header_end {
                    if total_read >= h_end + content_len {
                        break;
                    }
                }
                if total_read >= buf.len() {
                    break;
                }
            }
            Err(_) => break,
        }
    }

    if total_read == 0 { return; }
    let req_str = String::from_utf8_lossy(&buf[..total_read]);
    let first_line = req_str.lines().next().unwrap_or("");
    let body = if let Some(h_end) = header_end {
        String::from_utf8_lossy(&buf[h_end..total_read]).to_string()
    } else {
        String::new()
    };

    let response_json = if first_line.starts_with("GET /health") {
        "{\"ok\":true,\"service\":\"imentor-compute-kernel-rs\",\"status\":\"healthy\"}".to_string()
    } else if first_line.starts_with("POST /integrity") {
        let parts: Vec<&str> = body.split("===COMPARE===").collect();
        analyze_integrity(parts.first().copied().unwrap_or(""), parts.get(1).copied().unwrap_or(""))
    } else {
        process_batch_payload(&body)
    };

    let http_resp = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        response_json.len(),
        response_json
    );
    let _ = stream.write_all(http_resp.as_bytes());
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let mut serve_port: Option<u16> = None;
    let mut stump_mode = false;
    let mut integrity_mode = false;

    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--serve" => {
                if i + 1 < args.len() {
                    serve_port = args[i + 1].parse::<u16>().ok();
                    i += 1;
                }
            }
            "--stump" => stump_mode = true,
            "--integrity" => integrity_mode = true,
            "--json" => {}
            _ => {}
        }
        i += 1;
    }

    if stump_mode {
        let mut rng = Xorshift64::new(42);
        println!(
            "{{\"ok\":true,\"kernel\":\"imentor-compute-kernel-rs\",\"version\":\"2.0.0\",\"prngCheck\":{},\"capabilities\":[\"parallel_academic_section_parser\",\"okapi_bm25_ranker\",\"entity_branching_miner\",\"ngram_integrity_analyzer\"]}}",
            rng.next_u64()
        );
        return;
    }

    if let Some(port) = serve_port {
        let addr = format!("127.0.0.1:{}", port);
        let listener = TcpListener::bind(&addr).expect("Failed to bind Rust compute kernel port");
        eprintln!("🚀 iMentor Rust Compute Kernel listening on http://{}", addr);
        for stream in listener.incoming().flatten() {
            thread::spawn(move || handle_http_client(stream));
        }
        return;
    }

    let mut input = String::new();
    let _ = io::stdin().read_to_string(&mut input);
    if integrity_mode {
        let parts: Vec<&str> = input.split("===COMPARE===").collect();
        println!("{}", analyze_integrity(parts.first().copied().unwrap_or(""), parts.get(1).copied().unwrap_or("")));
    } else {
        println!("{}", process_batch_payload(&input));
    }
}
