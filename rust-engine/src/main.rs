// rust-engine/src/main.rs
use imentor_rust_engine::{
    cosine_similarity, score_reasoning_step, ReasoningStep,
};
use std::io::{self, BufRead};

fn main() {
    println!("==================================================");
    println!("🦀 iMentor High-Performance Compute Engine v0.1.0");
    println!("==================================================");
    println!("• Tree-of-Thought (ToT) Graph Reasoning & Pruning");
    println!("• Semantic Topic Network (STN) Matrix Algebra");
    println!("• SIMD-Accelerated 1024-dim Vector Similarity");
    println!("--------------------------------------------------");

    // Example quick benchmark demonstration
    let v1 = vec![0.1f32; 1024];
    let v2 = vec![0.1f32; 1024];
    let sim = cosine_similarity(&v1, &v2);
    println!("✓ 1024-dim Vector Cosine Similarity Self-Test: {:.4}", sim);

    // Interactive JSON pipeline if piped from stdin
    let stdin = io::stdin();
    let mut lines = stdin.lock().lines();

    if let Some(Ok(line)) = lines.next() {
        if let Ok(step) = serde_json::from_str::<ReasoningStep>(&line) {
            let score = score_reasoning_step(&step);
            if let Ok(json_out) = serde_json::to_string(&score) {
                println!("{}", json_out);
            }
        }
    }
}
