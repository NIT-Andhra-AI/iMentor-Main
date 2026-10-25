// rust-engine/src/main.rs
use imentor_rust_engine::{
    cosine_similarity, score_reasoning_step, ReasoningStep,
};
use serde::Serialize;
use std::env;
use std::io::{self, BufRead};
use std::process::Command;

#[derive(Serialize)]
struct HardwareReport {
    os: String,
    arch: String,
    cpu_threads: usize,
    avx2: bool,
    avx512: bool,
    ram_gb: u64,
    nvidia_gpu: Option<String>,
    amd_gpu: Option<String>,
    recommended_profile: String,
    recommended_engine: String,
    recommended_model: String,
}

fn detect_ram_gb() -> u64 {
    #[cfg(target_os = "linux")]
    {
        if let Ok(meminfo) = std::fs::read_to_string("/proc/meminfo") {
            for line in meminfo.lines() {
                if line.starts_with("MemTotal:") {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 2 {
                        if let Ok(kb) = parts[1].parse::<u64>() {
                            return (kb + 524_288) / 1_048_576;
                        }
                    }
                }
            }
        }
    }
    #[cfg(target_os = "windows")]
    {
        if let Ok(out) = Command::new("powershell")
            .args(["-NoProfile", "-Command", "(Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory"])
            .output()
        {
            if let Ok(s) = String::from_utf8(out.stdout) {
                if let Ok(bytes) = s.trim().parse::<u64>() {
                    return bytes / 1_073_741_824;
                }
            }
        }
    }
    16
}

fn detect_nvidia_gpu() -> Option<String> {
    let out = Command::new("nvidia-smi")
        .args(["--query-gpu=name,memory.total", "--format=csv,noheader"])
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
    if s.is_empty() { None } else { Some(s.lines().next().unwrap_or(&s).to_string()) }
}

fn detect_amd_gpu() -> Option<String> {
    #[cfg(target_os = "linux")]
    {
        if let Ok(out) = Command::new("sh")
            .args(["-c", "lspci 2>/dev/null | grep -iE 'VGA|Display|3D' | grep -iwE 'AMD|Radeon|Instinct' | head -n 1"])
            .output()
        {
            let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !s.is_empty() {
                return Some(s);
            }
        }
    }
    #[cfg(target_os = "windows")]
    {
        if let Ok(out) = Command::new("powershell")
            .args(["-NoProfile", "-Command", "Get-CimInstance Win32_VideoController | Where-Object { $_.Name -match 'AMD|Radeon' } | Select-Object -First 1 -ExpandProperty Name"])
            .output()
        {
            let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !s.is_empty() {
                return Some(s);
            }
        }
    }
    None
}

fn build_hardware_report() -> HardwareReport {
    let os = env::consts::OS.to_string();
    let arch = env::consts::ARCH.to_string();
    let cpu_threads = std::thread::available_parallelism().map(|n| n.get()).unwrap_or(4);
    #[cfg(any(target_arch = "x86", target_arch = "x86_64"))]
    let (avx2, avx512) = (
        std::is_x86_feature_detected!("avx2"),
        std::is_x86_feature_detected!("avx512f"),
    );
    #[cfg(not(any(target_arch = "x86", target_arch = "x86_64")))]
    let (avx2, avx512) = (false, false);

    let ram_gb = detect_ram_gb();
    let nvidia_gpu = detect_nvidia_gpu();
    let amd_gpu = detect_amd_gpu();

    let (recommended_profile, recommended_engine, recommended_model) = if nvidia_gpu.is_some() {
        if os == "linux" {
            ("nvidia".to_string(), "sglang-cuda".to_string(), "Qwen/Qwen3-8B-AWQ".to_string())
        } else {
            ("nvidia".to_string(), "sglang-wsl2-or-llama-cuda".to_string(), "Qwen/Qwen3-8B-AWQ".to_string())
        }
    } else if amd_gpu.is_some() {
        if os == "linux" {
            ("amd_rocm".to_string(), "llama-server-rocm".to_string(), "Qwen3-8B-Q4_K_M.gguf".to_string())
        } else {
            ("amd_vulkan".to_string(), "llama-server-vulkan".to_string(), "Qwen3-8B-Q4_K_M.gguf".to_string())
        }
    } else if ram_gb >= 32 {
        ("cpu_moe".to_string(), "llama-server-cpu-avx2".to_string(), "Qwen3-30B-A3B-Q4_K_M.gguf".to_string())
    } else {
        ("cpu_lite".to_string(), "llama-server-cpu-avx2".to_string(), "Qwen3-4B-Q4_K_M.gguf".to_string())
    };

    HardwareReport {
        os,
        arch,
        cpu_threads,
        avx2,
        avx512,
        ram_gb,
        nvidia_gpu,
        amd_gpu,
        recommended_profile,
        recommended_engine,
        recommended_model,
    }
}

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.iter().any(|a| a == "--detect-hardware") {
        let report = build_hardware_report();
        if args.iter().any(|a| a == "--json") {
            println!("{}", serde_json::to_string_pretty(&report).unwrap_or_else(|_| "{}".to_string()));
        } else {
            println!("OS: {} ({}) | Threads: {} | RAM: {} GB", report.os, report.arch, report.cpu_threads, report.ram_gb);
            println!("Recommended Profile: {} | Engine: {} | Model: {}", report.recommended_profile, report.recommended_engine, report.recommended_model);
        }
        return;
    }

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
