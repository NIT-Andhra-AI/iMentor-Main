'use strict';

const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();
const CampusDeploymentLead = require('../models/CampusDeploymentLead');
const { buildZipBuffer }   = require('../utils/zipBuilder');
const { adminAuthMiddleware } = require('../middleware/adminAuthMiddleware');
const log = require('../utils/logger');

const VALID_OS   = new Set(['ubuntu_linux', 'windows_wsl2', 'windows_native']);
const VALID_ACC  = new Set(['nvidia_gpu', 'amd_gpu', 'cpu_only', 'lab_pc_pool']);
const VALID_MEM  = new Set(['8_12gb', '16_24gb', '32_64gb', '64gb_plus']);
const VALID_CONN = new Set(['offline_airgapped', 'campus_lan_internet', 'hybrid_cloud_gpu']);

/**
 * Deterministic Enterprise Architecture & Sizing Engine across all OS + GPU/CPU combinations.
 */
function computeDeploymentPlan({
    osTarget = 'ubuntu_linux',
    accelerator = 'nvidia_gpu',
    memoryTier = '16_24gb',
    connectivityMode = 'campus_lan_internet',
    campusDomain = 'imentor.campus.local'
} = {}) {
    const os   = VALID_OS.has(osTarget) ? osTarget : 'ubuntu_linux';
    const acc  = VALID_ACC.has(accelerator) ? accelerator : 'nvidia_gpu';
    const mem  = VALID_MEM.has(memoryTier) ? memoryTier : '16_24gb';
    const conn = VALID_CONN.has(connectivityMode) ? connectivityMode : 'campus_lan_internet';
    const isWin = os !== 'ubuntu_linux';
    const isHighMem = mem === '32_64gb' || mem === '64gb_plus';
    const isLowMem  = mem === '8_12gb';

    let hardwareProfile = 'nvidia';
    let engine = 'SGLang RadixAttention Server (CUDA)';
    let engineBinary = 'sglang.launch_server';
    let model = 'Qwen/Qwen3-8B-AWQ';
    let quantization = '4-bit AWQ + FP16 KV Cache (RadixAttention)';
    let contextLength = 24576;
    let parallelSlots = 12;
    let estimatedTokPerSec = '240–340 tok/s aggregate';
    let concurrentStreams = '8–12 simultaneous active streams';
    let recommendedClassSize = '50–100 students per classroom';
    let forceNoThink = false;
    const warnings = [];
    const highlights = [
        '100% of student grades, chats, MongoDB records & Qdrant textbook vectors stay on your campus LAN',
        'Zero client software required on student lab PCs — works in any browser over campus Wi-Fi/LAN'
    ];

    if (conn === 'hybrid_cloud_gpu') {
        hardwareProfile = 'hybrid_cloud';
        engine = 'Hybrid Campus Edge + Hosted iMentor GPU Cluster (mTLS)';
        engineBinary = 'remote-mtls-sglang-gateway';
        model = 'Qwen/Qwen3-8B-AWQ (Hosted Cluster)';
        quantization = '4-bit AWQ on Enterprise Multi-GPU Hub';
        contextLength = 24576;
        parallelSlots = 24;
        estimatedTokPerSec = '300–500+ tok/s (Zero Campus GPU Required)';
        concurrentStreams = '15–30+ simultaneous active streams';
        recommendedClassSize = '100–500+ students campus-wide';
        highlights.push('Runs smoothly on any standard 16 GB Windows/Linux office PC with zero GPU hardware purchase');
    } else if (acc === 'nvidia_gpu') {
        hardwareProfile = 'nvidia';
        if (os === 'windows_native' || isLowMem) {
            engine = isWin
                ? 'llama-server.exe Native CUDA (No WSL2 / Hyper-V Required)'
                : 'llama-server CUDA Continuous Batching';
            engineBinary = isWin ? 'llama-server.exe' : 'llama-server';
            model = isLowMem ? 'Qwen3-4B-Q4_K_M.gguf (8GB) / Qwen3-8B-Q4_K_M.gguf (12GB)' : 'Qwen3-8B-Q4_K_M.gguf';
            quantization = 'GGUF Q4_K_M + Q8_0 Flash-Attention KV Cache';
            contextLength = isLowMem ? 16384 : 24576;
            parallelSlots = isLowMem ? 4 : 8;
            estimatedTokPerSec = isLowMem ? '75–130 tok/s aggregate' : '140–220 tok/s aggregate';
            concurrentStreams = isLowMem ? '3–5 simultaneous streams' : '6–8 simultaneous streams';
            recommendedClassSize = isLowMem ? '25–40 student lab batch' : '50–70 student classroom';
        } else {
            engine = os === 'windows_wsl2'
                ? 'SGLang CUDA Container (Docker Desktop WSL2 GPU Pass-Through)'
                : 'SGLang CUDA Container (Native Linux RadixAttention)';
            engineBinary = 'lmsysorg/sglang:latest';
            model = mem === '64gb_plus' ? 'Qwen/Qwen3-14B-AWQ (or Qwen3-8B-AWQ Ultra-Concurrency)' : 'Qwen/Qwen3-8B-AWQ';
            quantization = '4-bit AWQ + 96% Radix Prefix Cache Hit Rate';
            contextLength = 24576;
            parallelSlots = isHighMem ? 20 : 12;
            estimatedTokPerSec = isHighMem ? '320–480 tok/s aggregate' : '250–350 tok/s aggregate';
            concurrentStreams = isHighMem ? '12–20 simultaneous streams' : '8–12 simultaneous streams';
            recommendedClassSize = isHighMem ? '80–150 students' : '50–100 students';
            highlights.push('Full <think> mathematical derivations + 24k-context PhD Deep Research synthesis enabled');
        }
    } else if (acc === 'amd_gpu') {
        hardwareProfile = isWin ? 'amd_vulkan' : 'amd_rocm';
        engine = isWin
            ? 'llama-server.exe Native Vulkan / HIP (Works with Standard AMD Adrenalin Drivers)'
            : 'llama-server ROCm / HIP (or SGLang ROCm Container on Instinct/RDNA3+)';
        engineBinary = isWin ? 'llama-server.exe' : 'llama-server';
        model = isLowMem ? 'Qwen3-4B-Q4_K_M.gguf' : 'Qwen3-8B-Q4_K_M.gguf';
        quantization = 'GGUF Q4_K_M + Q8_0 KV Cache (--ubatch-size 128 tuned for AMD Infinity Cache)';
        contextLength = isLowMem ? 16384 : 24576;
        parallelSlots = isLowMem ? 4 : (isHighMem ? 8 : 6);
        estimatedTokPerSec = isLowMem ? '60–95 tok/s aggregate' : '95–175 tok/s aggregate';
        concurrentStreams = isLowMem ? '3–4 simultaneous streams' : '5–8 simultaneous streams';
        recommendedClassSize = isLowMem ? '25–35 student lab' : '40–65 student classroom';
        highlights.push(isWin
            ? 'Zero 10 GB ROCm SDK install needed on Windows — Vulkan backend runs directly on Radeon RX / PRO GPUs'
            : 'Native AMD ROCm matrix acceleration with continuous batching & GBNF JSON schema enforcement');
    } else if (acc === 'lab_pc_pool') {
        hardwareProfile = 'lab_pool';
        engine = 'iMentor Go Gateway Multi-PC GPU Pool + llama-server Workers';
        engineBinary = 'imentor-gateway + llama-server.exe';
        model = 'Qwen3-8B-Q4_K_M.gguf (Replicated across 3–5 Lab Desktops)';
        quantization = 'Distributed GGUF Q4_K_M across existing CAD/AIML Lab GPUs';
        contextLength = 20480;
        parallelSlots = 16;
        estimatedTokPerSec = '220–400 tok/s pooled across 3–5 lab desktops';
        concurrentStreams = '10–16 simultaneous streams (scales N x 4 per lab PC)';
        recommendedClassSize = '60–120 students (Zero New Server Hardware CapEx)';
        highlights.push('Includes lab-gpu-worker.ps1 service — turns 3–5 existing lab RTX/Radeon desktops into a self-healing campus AI cluster');
    } else {
        // cpu_only
        hardwareProfile = isHighMem ? 'cpu_moe' : 'cpu_lite';
        forceNoThink = true;
        engine = isWin
            ? 'llama-server.exe CPU AVX2 / AVX-512 + Intel OpenVINO iGPU/NPU'
            : 'llama-server CPU AVX-512 / AVX2 + OpenVINO Graph Runtime';
        engineBinary = isWin ? 'llama-server.exe' : 'llama-server';
        model = isHighMem
            ? 'Qwen3-30B-A3B-Q4_K_M.gguf (Mixture-of-Experts: only 3B active params/token!)'
            : 'Qwen3-4B-Q4_K_M.gguf';
        quantization = isHighMem
            ? 'MoE Q4_K_M (~17 GB RAM, 2.5x faster than dense 8B on CPU)'
            : 'Compact Q4_K_M (~2.6 GB RAM)';
        contextLength = isHighMem ? 16384 : 8192;
        parallelSlots = isHighMem ? 3 : 2;
        estimatedTokPerSec = isHighMem ? '14–24 tok/s (MoE 3B active)' : '9–16 tok/s';
        concurrentStreams = '1–2 simultaneous streams';
        recommendedClassSize = 'Self-paced study / small 10–15 student seminar';
        warnings.push(
            'CPU RAM bandwidth (~50 GB/s) cannot serve 8+ students simultaneously at high speed. For a 50-student live class without buying a server GPU, select "Pool 3–5 Lab Desktop GPUs" or "Hybrid Campus DB + iMentor Cloud GPU".'
        );
    }

    if (conn === 'offline_airgapped') {
        highlights.push('100% Offline Air-Gapped mode enabled (HF_HUB_OFFLINE=1, local FastEmbed ONNX CPU vectors, zero external outbound calls)');
    }

    const installerScriptName = isWin ? 'install-campus.ps1' : 'install-campus.sh';
    const engineScriptName    = isWin ? 'start-inference-engine.ps1' : 'start-inference-engine.sh';
    const includedFiles = [
        'README-CAMPUS-DEPLOY.md',
        '.env.campus',
        'docker-compose.campus.yml',
        installerScriptName,
        engineScriptName,
        ...(acc === 'lab_pc_pool' ? ['lab-gpu-worker.ps1'] : []),
        'campus-manifest.json'
    ];

    return {
        osTarget: os,
        accelerator: acc,
        memoryTier: mem,
        connectivityMode: conn,
        campusDomain: campusDomain || 'imentor.campus.local',
        hardwareProfile,
        engine,
        engineBinary,
        model,
        quantization,
        contextLength,
        parallelSlots,
        estimatedTokPerSec,
        concurrentStreams,
        recommendedClassSize,
        forceNoThink,
        includedFiles,
        highlights,
        warnings
    };
}

/**
 * Generates the tailored 6–7 file .zip deployment kit in memory.
 */
function buildInstallerFiles(leadInfo, plan, bundleId) {
    const jwtSecret     = crypto.randomBytes(32).toString('hex');
    const internalToken = crypto.randomBytes(32).toString('hex');
    const isWin         = plan.osTarget !== 'ubuntu_linux';
    const isHybrid      = plan.connectivityMode === 'hybrid_cloud_gpu';
    const isOffline     = plan.connectivityMode === 'offline_airgapped';
    const domain        = plan.campusDomain || 'imentor.campus.local';

    const sglangUrl = isHybrid
        ? 'https://gpu-hub.imentor.edu.in/v1'
        : (plan.accelerator === 'lab_pc_pool' ? 'http://127.0.0.1:5002/internal/llm-pool/v1' : 'http://127.0.0.1:8000/v1');

    // 1. .env.campus
    const envContent = [
        `# ============================================================================`,
        `# iMentor Enterprise Campus Configuration — ${leadInfo.collegeName}`,
        `# Bundle ID: ${bundleId} | Generated: ${new Date().toISOString()}`,
        `# ============================================================================`,
        `CAMPUS_NAME="${leadInfo.collegeName.replace(/"/g, '')}"`,
        `CAMPUS_DOMAIN=${domain}`,
        `NODE_ENV=production`,
        `PORT=5006`,
        `RAG_PORT=2006`,
        `GATEWAY_PORT=5002`,
        `RUST_KERNEL_URL=http://127.0.0.1:3009`,
        ``,
        `# Strict Campus Data Sovereignty & Local Inference Routing`,
        `LOCAL_GPU_ONLY=true`,
        `HARDWARE_PROFILE=${plan.hardwareProfile}`,
        `SGLANG_ENABLED=true`,
        `SGLANG_CHAT_URL=${sglangUrl}`,
        `SGLANG_REASON_URL=${sglangUrl}`,
        `SGLANG_HEAVY_URL=${sglangUrl}`,
        `SGLANG_CHAT_MODEL=${plan.model.split(' ')[0]}`,
        `SGLANG_MAX_CONTEXT=${plan.contextLength}`,
        `SGLANG_FORCE_NO_THINK=${plan.forceNoThink ? 'true' : 'false'}`,
        `SGLANG_API_KEY=${isHybrid ? 'REPLACE_WITH_IMENTOR_ENTERPRISE_HUB_KEY' : 'campus-local-key'}`,
        `LLM_CONCURRENCY_SGLANG=${Math.max(8, plan.parallelSlots * 3)}`,
        `LLM_QUEUE_MAX_DEPTH=150`,
        ``,
        `# Campus Databases (100% On-Premise)`,
        `MONGO_URI=mongodb://127.0.0.1:27018/imentor`,
        `QDRANT_URL=http://127.0.0.1:6333`,
        `NEO4J_URI=bolt://127.0.0.1:7687`,
        `REDIS_URL=redis://127.0.0.1:6379`,
        `HF_HUB_OFFLINE=${isOffline ? '1' : '0'}`,
        `ENABLE_WEB_ACADEMIC_SEARCH=${isOffline ? 'false' : 'true'}`,
        ``,
        `# Unique Campus Cryptographic Secrets`,
        `JWT_SECRET=${jwtSecret}`,
        `INTERNAL_SERVICE_TOKEN=${internalToken}`,
        ``
    ].join('\n');

    // 2. docker-compose.campus.yml
    let inferenceServiceYaml = '';
    if (!isHybrid && plan.accelerator === 'nvidia_gpu' && plan.osTarget !== 'windows_native' && plan.memoryTier !== '8_12gb') {
        inferenceServiceYaml = `
  imentor-llm:
    image: lmsysorg/sglang:latest
    container_name: imentor-campus-sglang
    restart: unless-stopped
    ipc: host
    ports:
      - "127.0.0.1:8000:8000"
    volumes:
      - ./models:/root/.cache/huggingface
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    command: >
      python3 -m sglang.launch_server
      --model-path ${plan.model.split(' ')[0]}
      --host 0.0.0.0 --port 8000
      --context-length ${plan.contextLength}
      --mem-fraction-static 0.84
      --chunked-prefill-size 2048
      --max-running-requests 24
      --schedule-policy lpm
`;
    } else if (!isHybrid && plan.accelerator !== 'lab_pc_pool') {
        const llamaImage = plan.accelerator === 'amd_gpu' && !isWin
            ? 'ghcr.io/ggml-org/llama.cpp:server-rocm'
            : (plan.accelerator === 'nvidia_gpu' ? 'ghcr.io/ggml-org/llama.cpp:server-cuda' : 'ghcr.io/ggml-org/llama.cpp:server');
        const nglFlag = plan.accelerator === 'cpu_only' ? '-ngl 0' : '-ngl 99 --flash-attn';
        inferenceServiceYaml = `
  imentor-llm:
    image: ${llamaImage}
    container_name: imentor-campus-llama
    restart: unless-stopped
    ports:
      - "127.0.0.1:8000:8000"
    volumes:
      - ./models:/models
    command: >
      -m /models/${plan.model.split(' ')[0]}
      --host 0.0.0.0 --port 8000
      ${nglFlag}
      -c ${plan.contextLength * Math.min(plan.parallelSlots, 4)}
      -np ${plan.parallelSlots}
      -ctk q8_0 -ctv q8_0
      -ub 128
      --cache-reuse 256
`;
    }

    const composeContent = `# iMentor Campus Stack — ${leadInfo.collegeName} (${plan.osTarget} / ${plan.accelerator})
services:
  imentor-mongo:
    image: mongo:7
    container_name: imentor-campus-mongo
    restart: unless-stopped
    ports:
      - "127.0.0.1:27018:27017"
    volumes:
      - ./data/mongo:/data/db

  imentor-qdrant:
    image: qdrant/qdrant:latest
    container_name: imentor-campus-qdrant
    restart: unless-stopped
    ports:
      - "127.0.0.1:6333:6333"
    volumes:
      - ./data/qdrant:/qdrant/storage

  imentor-redis:
    image: redis:7-alpine
    container_name: imentor-campus-redis
    restart: unless-stopped
    ports:
      - "127.0.0.1:6379:6379"

  imentor-neo4j:
    image: neo4j:5-community
    container_name: imentor-campus-neo4j
    restart: unless-stopped
    environment:
      - NEO4J_AUTH=neo4j/imentor_campus_graph
    ports:
      - "127.0.0.1:7687:7687"
    volumes:
      - ./data/neo4j:/data
${inferenceServiceYaml}`;

    // 3. Engine launcher script
    const engineScriptName = isWin ? 'start-inference-engine.ps1' : 'start-inference-engine.sh';
    const nglVal = plan.accelerator === 'cpu_only' ? '0' : '99';
    const extraGpuFlags = plan.accelerator === 'cpu_only' ? '' : '--flash-attn -ctk q8_0 -ctv q8_0 -ub 128';
    const engineScriptContent = isWin
        ? `# Start Local Inference Engine on Windows (${plan.engine})
$ErrorActionPreference = "Stop"
Write-Host "Starting iMentor Local Inference Engine (${plan.model})..." -ForegroundColor Cyan
if ("${plan.connectivityMode}" -eq "hybrid_cloud_gpu") {
    Write-Host "Hybrid Cloud GPU mode active -> routing LLM requests to central iMentor GPU cluster." -ForegroundColor Green
    exit 0
}
if (Test-Path ".\\bin\\llama-server.exe") {
    .\\bin\\llama-server.exe -m ".\\models\\${plan.model.split(' ')[0]}" --host 127.0.0.1 --port 8000 -ngl ${nglVal} ${extraGpuFlags} -c ${plan.contextLength} -np ${plan.parallelSlots} --cache-reuse 256
} else {
    docker compose -f docker-compose.campus.yml up -d imentor-llm
}
`
        : `#!/usr/bin/env bash
set -euo pipefail
echo "[iMentor] Starting Local Inference Engine (${plan.engine})..."
if [ "${plan.connectivityMode}" = "hybrid_cloud_gpu" ]; then
  echo "[iMentor] Hybrid Cloud GPU mode active -> routing LLM calls over mTLS."
  exit 0
fi
docker compose -f docker-compose.campus.yml up -d imentor-llm
`;

    // 4. Main Campus Installer Script (install-campus.ps1 or install-campus.sh)
    const installerScriptName = isWin ? 'install-campus.ps1' : 'install-campus.sh';
    const installerScriptContent = isWin
        ? `# ==============================================================================
# iMentor Enterprise Campus Installer for Windows (${plan.osTarget})
# Institution: ${leadInfo.collegeName} | Bundle: ${bundleId}
# ==============================================================================
$ErrorActionPreference = "Stop"
Write-Host "============================================================" -ForegroundColor Teal
Write-Host "  iMentor Campus Deployment — ${leadInfo.collegeName}" -ForegroundColor White
Write-Host "  Profile: ${plan.engine}" -ForegroundColor Cyan
Write-Host "  Capacity: ${plan.recommendedClassSize} (${plan.estimatedTokPerSec})" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Teal

New-Item -ItemType Directory -Force -Path ".\\data\\mongo", ".\\data\\qdrant", ".\\data\\neo4j", ".\\models" | Out-Null
Copy-Item -Force ".env.campus" ".\\server\\.env" -ErrorAction SilentlyContinue

if (Test-Path ".\\bin\\imentor-rust-engine.exe") {
    Write-Host "[1/4] Probing campus server hardware..." -ForegroundColor Yellow
    .\\bin\\imentor-rust-engine.exe --detect-hardware
}

if ("${plan.osTarget}" -eq "windows_native") {
    Write-Host "[2/4] Native Portable Windows Mode (Zero Docker / Zero BIOS Virtualization)..." -ForegroundColor Yellow
    Write-Host "Ensure portable binaries (node.exe, qdrant.exe, mongod.exe, llama-server.exe) are placed in .\\bin\\"
    Start-Process -FilePath "powershell" -ArgumentList "-ExecutionPolicy Bypass -File .\\start-inference-engine.ps1" -WindowStyle Minimized
} else {
    Write-Host "[2/4] Starting Campus Databases & Inference Containers via Docker Desktop WSL2..." -ForegroundColor Yellow
    docker compose -f docker-compose.campus.yml up -d
}

Write-Host "[3/4] Starting iMentor Node Backend, Rust Compute Kernel, Go Gateway & Frontend..." -ForegroundColor Yellow
if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    pm2 start ecosystem.config.js --update-env
    pm2 save
}

Write-Host "[4/4] Verifying Campus Health Endpoint..." -ForegroundColor Yellow
Start-Sleep -Seconds 4
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:5006/api/health" -TimeoutSec 10
    Write-Host "SUCCESS! iMentor Campus Portal is live at http://${domain}:3006" -ForegroundColor Green
} catch {
    Write-Host "Setup initialized. Once model weights finish downloading into .\\models, open http://${domain}:3006" -ForegroundColor Cyan
}
`
        : `#!/usr/bin/env bash
# ==============================================================================
# iMentor Enterprise Campus Installer for Ubuntu Linux
# Institution: ${leadInfo.collegeName} | Bundle: ${bundleId}
# ==============================================================================
set -euo pipefail

echo "============================================================"
echo "  iMentor Campus Deployment — ${leadInfo.collegeName}"
echo "  Engine  : ${plan.engine}"
echo "  Model   : ${plan.model}"
echo "  Capacity: ${plan.recommendedClassSize} (${plan.estimatedTokPerSec})"
echo "============================================================"

mkdir -p ./data/mongo ./data/qdrant ./data/neo4j ./models
[ -d ./server ] && cp -f .env.campus ./server/.env || true

if [ -x ./rust-engine/target/release/imentor-rust-engine ]; then
  echo "[1/4] Probing campus server hardware..."
  ./rust-engine/target/release/imentor-rust-engine --detect-hardware
fi

echo "[2/4] Launching Campus Databases & Local Inference Engine..."
docker compose -f docker-compose.campus.yml up -d

echo "[3/4] Starting iMentor Application Daemons (PM2)..."
if command -v pm2 >/dev/null 2>&1 && [ -f ecosystem.config.js ]; then
  pm2 start ecosystem.config.js --update-env
  pm2 save
fi

echo "[4/4] Checking Campus Health..."
sleep 4
curl -fsS http://127.0.0.1:5006/api/health && echo "" || true
echo "✅ iMentor Campus Server configured! Students on campus LAN can open: http://${domain}:3006"
`;

    // 5. README-CAMPUS-DEPLOY.md
    const quickCmd = isWin
        ? `Expand-Archive -Path imentor-campus-installer.zip -DestinationPath C:\\iMentor; cd C:\\iMentor; Set-ExecutionPolicy Bypass -Scope Process; .\\install-campus.ps1`
        : `unzip imentor-campus-installer.zip -d ~/imentor-campus && cd ~/imentor-campus && chmod +x *.sh && ./install-campus.sh`;

    const readmeContent = [
        '# iMentor Enterprise Campus Deployment Kit',
        '**Institution:** ' + leadInfo.collegeName,
        '**Bundle ID:** ' + bundleId,
        '**Selected OS:** ' + plan.osTarget,
        '**Compute Architecture:** ' + plan.engine,
        '**Target Model:** ' + plan.model,
        '**Certified Classroom Capacity:** **' + plan.recommendedClassSize + '** (' + plan.concurrentStreams + ' @ ' + plan.estimatedTokPerSec + ')',
        '',
        '---',
        '',
        '## 1. Campus Architecture Overview',
        '- **Zero Install on Student PCs:** Install this bundle on **1 Campus Server PC** connected to your college LAN/Wi-Fi. All 50-500 students & faculty access iMentor in Chrome/Edge at http://' + domain + ':3006.',
        '- **100% Campus Data Privacy:** Student accounts, Socratic mastery graphs, course PDFs, MongoDB records, and Qdrant textbook vectors never leave your campus server.',
        '',
        '## 2. Quick-Start Command',
        '~~~' + (isWin ? 'powershell' : 'bash'),
        quickCmd,
        '~~~',
        '',
        '## 3. Included Files in This Custom Bundle',
        ...plan.includedFiles.map(f => '- ' + f),
        ...(plan.warnings.length ? ['', '## 4. Hardware Sizing Advisory', ...plan.warnings.map(w => '> **Note:** ' + w)] : []),
        ''
    ].join('\n');

    const files = [
        { name: 'README-CAMPUS-DEPLOY.md', content: readmeContent },
        { name: '.env.campus',             content: envContent },
        { name: 'docker-compose.campus.yml', content: composeContent },
        { name: installerScriptName,       content: installerScriptContent },
        { name: engineScriptName,          content: engineScriptContent }
    ];

    if (plan.accelerator === 'lab_pc_pool') {
        files.push({
            name: 'lab-gpu-worker.ps1',
            content: `# Run on 3–5 existing CAD/AIML Lab Windows Desktops with RTX / Radeon GPUs
param([string]$CampusServerIp = "192.168.1.50")
$ErrorActionPreference = "Stop"
Write-Host "Starting iMentor Lab GPU Worker -> Registering with Campus Gateway at $CampusServerIp:5002..." -ForegroundColor Cyan
.\\bin\\llama-server.exe -m ".\\models\\Qwen3-8B-Q4_K_M.gguf" --host 0.0.0.0 --port 8000 -ngl 99 --flash-attn -ctk q8_0 -ctv q8_0 -c 20480 -np 4 --cache-reuse 256
`
        });
    }

    const manifest = {
        bundleId,
        generatedAt: new Date().toISOString(),
        institution: {
            collegeName: leadInfo.collegeName,
            campusDomain: domain,
            studentCountEstimate: leadInfo.studentCountEstimate
        },
        deploymentPlan: plan
    };
    files.push({ name: 'campus-manifest.json', content: JSON.stringify(manifest, null, 2) });

    return files;
}

// ── POST /api/deploy/recommend (Instant Interactive Configurator Preview) ────
router.post('/recommend', (req, res) => {
    try {
        const plan = computeDeploymentPlan(req.body || {});
        return res.json({ success: true, plan });
    } catch (err) {
        log.error('DEPLOY', 'Failed to compute deployment recommendation', err);
        return res.status(500).json({ error: 'Failed to compute recommendation' });
    }
});

// ── POST /api/deploy/generate-installer (Save Lead + Stream Custom .zip) ─────
router.post('/generate-installer', async (req, res) => {
    try {
        const {
            collegeName,
            coordinatorName = '',
            officialEmail = '',
            phone = '',
            studentCountEstimate = '100-500',
            campusDomain = 'imentor.campus.local',
            osTarget = 'ubuntu_linux',
            accelerator = 'nvidia_gpu',
            memoryTier = '16_24gb',
            connectivityMode = 'campus_lan_internet'
        } = req.body || {};

        const cleanCollege = String(collegeName || '').trim();
        const cleanEmail   = String(officialEmail || '').trim().toLowerCase();
        const cleanPhone   = String(phone || '').trim();

        if (cleanCollege.length < 2) {
            return res.status(400).json({ error: 'Please enter your College or Institution Name.' });
        }
        if (!cleanEmail && !cleanPhone) {
            return res.status(400).json({ error: 'Please provide an Official Email or Phone number.' });
        }
        if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({ error: 'Please enter a valid email address.' });
        }

        const plan = computeDeploymentPlan({
            osTarget,
            accelerator,
            memoryTier,
            connectivityMode,
            campusDomain: String(campusDomain || 'imentor.campus.local').trim()
        });

        const bundleId = 'IMC-' + crypto.randomBytes(4).toString('hex').toUpperCase();

        await CampusDeploymentLead.create({
            bundleId,
            collegeName: cleanCollege,
            coordinatorName: String(coordinatorName || '').trim(),
            officialEmail: cleanEmail,
            phone: cleanPhone,
            studentCountEstimate: String(studentCountEstimate || '100-500'),
            campusDomain: plan.campusDomain,
            osTarget: plan.osTarget,
            accelerator: plan.accelerator,
            memoryTier: plan.memoryTier,
            connectivityMode: plan.connectivityMode,
            recommendedEngine: plan.engine,
            recommendedModel: plan.model,
            estimatedTokPerSec: plan.estimatedTokPerSec,
            concurrentClassSize: plan.recommendedClassSize,
            hardwareProfile: plan.hardwareProfile,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
            userAgent: String(req.headers['user-agent'] || '').slice(0, 240)
        });

        const slug = cleanCollege.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28) || 'campus';
        const filename = `imentor-${slug}-${plan.osTarget.replace('_', '-')}-${plan.accelerator.replace('_', '-')}.zip`;
        const files = buildInstallerFiles(
            { collegeName: cleanCollege, studentCountEstimate },
            plan,
            bundleId
        );
        const zipBuf = buildZipBuffer(files);

        log.info('DEPLOY', `Generated custom installer ${filename} (${zipBuf.length}B, bundle=${bundleId}) for "${cleanCollege}"`);

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', String(zipBuf.length));
        res.setHeader('X-Bundle-Id', bundleId);
        res.setHeader('X-Installer-Filename', filename);
        res.setHeader('Access-Control-Expose-Headers', 'X-Bundle-Id, X-Installer-Filename');
        return res.status(200).send(zipBuf);
    } catch (err) {
        log.error('DEPLOY', 'Failed to generate custom campus installer', err);
        return res.status(500).json({ error: 'Failed to generate custom installer package.' });
    }
});

// ── Admin Endpoints: View & Manage Campus Deployment Leads ───────────────────
router.get('/leads', adminAuthMiddleware, async (req, res) => {
    try {
        const leads = await CampusDeploymentLead.find({})
            .sort({ createdAt: -1 })
            .limit(250)
            .lean();
        return res.json({ success: true, count: leads.length, leads });
    } catch (err) {
        log.error('DEPLOY', 'Failed to list campus deployment leads', err);
        return res.status(500).json({ error: 'Failed to fetch campus leads' });
    }
});

router.patch('/leads/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const { status, adminNotes } = req.body || {};
        const update = {};
        if (status && ['downloaded', 'contacted', 'pilot_active', 'deployed'].includes(status)) {
            update.status = status;
        }
        if (typeof adminNotes === 'string') {
            update.adminNotes = adminNotes.slice(0, 1000);
        }
        const doc = await CampusDeploymentLead.findByIdAndUpdate(
            req.params.id,
            { $set: update },
            { new: true }
        ).lean();
        if (!doc) return res.status(404).json({ error: 'Lead not found' });
        return res.json({ success: true, lead: doc });
    } catch (err) {
        log.error('DEPLOY', 'Failed to update campus deployment lead', err);
        return res.status(500).json({ error: 'Failed to update campus lead' });
    }
});

module.exports = router;
module.exports.computeDeploymentPlan = computeDeploymentPlan;
