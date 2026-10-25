const fs = require('fs');
const path = require('path');
const isWin = process.platform === 'win32';
const ROOT = __dirname;
const exe = (name) => (isWin ? `${name}.exe` : name);

const apps = [
  {
    name: "imentor-rust-kernel",
    script: path.join(ROOT, "bin", exe("imentor-compute-kernel")),
    args: "--serve 3009",
    cwd: ROOT,
    autorestart: true,
    watch: false,
    max_memory_restart: "500M"
  },
  {
    name: "imentor-model-service",
    script: "server.js",
    cwd: path.join(ROOT, "services", "model-service"),
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production",
      MODEL_SERVICE_PORT: "5010",
      SGLANG_URL: process.env.SGLANG_CHAT_URL || "http://127.0.0.1:8000/v1"
    }
  },
  {
    name: "imentor-v2-rag",
    script: isWin ? "app.py" : "./start_rag.sh",
    interpreter: isWin ? "python" : "bash",
    cwd: path.join(ROOT, "server", "rag_service"),
    autorestart: true,
    watch: false,
    max_memory_restart: "4G",
    env: {
      PYTHONUNBUFFERED: "1",
      RAG_PORT: "2006",
      INTERNAL_SERVICE_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || "f9a3ddbc4d5fc3d59b484f99774bdd81b17b207f74ce1694e8e351c443a09a6b"
    }
  },
  {
    name: "imentor-v2-backend",
    script: "server.js",
    cwd: path.join(ROOT, "server"),
    autorestart: true,
    watch: false,
    max_memory_restart: "8G",
    node_args: "--max-old-space-size=6144",
    env: {
      NODE_ENV: process.env.NODE_ENV || "development",
      PORT: "5006",
      HOST: "127.0.0.1",
      INTERNAL_SERVICE_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || "f9a3ddbc4d5fc3d59b484f99774bdd81b17b207f74ce1694e8e351c443a09a6b"
    }
  },
  {
    name: "imentor-v2-go-gateway",
    script: path.join(ROOT, "go-gateway", "bin", exe("imentor-gateway")),
    cwd: path.join(ROOT, "go-gateway"),
    autorestart: true,
    watch: false,
    max_memory_restart: "500M",
    env: {
      GATEWAY_PORT: "5002",
      JWT_SECRET: process.env.JWT_SECRET || "imentor_dev_jwt_secret_change_in_production_2026"
    }
  },
  {
    name: "imentor-v2-frontend",
    script: "npx",
    args: "vite preview --host 127.0.0.1 --port 3006",
    cwd: path.join(ROOT, "frontend"),
    autorestart: true,
    watch: false,
    max_memory_restart: "500M"
  }
];

const bridgeScript = path.resolve(ROOT, "..", "scripts", "caddy_v2_bridge.js");
if (!isWin && fs.existsSync(bridgeScript)) {
  apps.push({
    name: "imentor-v2-caddy-bridge",
    script: bridgeScript,
    cwd: path.resolve(ROOT, ".."),
    autorestart: true,
    watch: false,
    max_memory_restart: "100M"
  });
}

const monitorScript = path.join(ROOT, "server", "scripts", "monitor_services.sh");
if (!isWin && fs.existsSync(monitorScript)) {
  apps.push({
    name: "imentor-v2-monitor",
    script: "./scripts/monitor_services.sh",
    interpreter: "bash",
    cwd: path.join(ROOT, "server"),
    autorestart: true,
    watch: false,
    max_memory_restart: "200M"
  });
}

module.exports = { apps };
