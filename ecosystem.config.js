module.exports = {
  apps: [
    {
      name: "imentor-rust-kernel",
      script: "./bin/imentor-compute-kernel",
      args: "--serve 3009",
      cwd: "/home/sri/Downloads/iMentor_march/iMentorV2",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M"
    },
    {
      name: "imentor-model-service",
      script: "server.js",
      cwd: "/home/sri/Downloads/iMentor_march/iMentorV2/services/model-service",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        MODEL_SERVICE_PORT: "5010",
        SGLANG_URL: "http://127.0.0.1:8000/v1"
      }
    },

    {
      name: "imentor-v2-rag",
      script: "./start_rag.sh",
      interpreter: "bash",
      cwd: "/home/sri/Downloads/iMentor_march/iMentorV2/server/rag_service",
      autorestart: true,
      watch: false,
      max_memory_restart: "4G",
      env: {
        PYTHONUNBUFFERED: "1",
        RAG_PORT: "2006",
        INTERNAL_SERVICE_TOKEN: "f9a3ddbc4d5fc3d59b484f99774bdd81b17b207f74ce1694e8e351c443a09a6b"
      }
    },
    {
      name: "imentor-v2-backend",
      script: "server.js",
      cwd: "/home/sri/Downloads/iMentor_march/iMentorV2/server",
      autorestart: true,
      watch: false,
      max_memory_restart: "8G",
      node_args: "--max-old-space-size=6144",
      env: {
        NODE_ENV: "development",
        PORT: "5006",
        HOST: "127.0.0.1",
        INTERNAL_SERVICE_TOKEN: "f9a3ddbc4d5fc3d59b484f99774bdd81b17b207f74ce1694e8e351c443a09a6b"
      }
    },
    {
      name: "imentor-v2-go-gateway",
      script: "./bin/imentor-gateway",
      cwd: "/home/sri/Downloads/iMentor_march/iMentorV2/go-gateway",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        GATEWAY_PORT: "5002",
        JWT_SECRET: "imentor_dev_jwt_secret_change_in_production_2026"
      }
    },
    {
      name: "imentor-v2-frontend",
      script: "npx",
      args: "vite preview --host 127.0.0.1 --port 3006",
      cwd: "/home/sri/Downloads/iMentor_march/iMentorV2/frontend",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M"
    },
    {
      name: "imentor-v2-caddy-bridge",
      script: "/home/sri/Downloads/iMentor_march/scripts/caddy_v2_bridge.js",
      cwd: "/home/sri/Downloads/iMentor_march",
      autorestart: true,
      watch: false,
      max_memory_restart: "100M"
    },
    {
      name: "imentor-v2-monitor",
      script: "./scripts/monitor_services.sh",
      interpreter: "bash",
      cwd: "/home/sri/Downloads/iMentor_march/iMentorV2/server",
      autorestart: true,
      watch: false,
      max_memory_restart: "200M"
    }
  ]
};
