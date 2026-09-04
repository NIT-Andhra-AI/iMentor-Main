module.exports = {
  apps: [
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
        RAG_PORT: "2006"
      }
    },
    {
      name: "imentor-v2-backend",
      script: "server.js",
      cwd: "/home/sri/Downloads/iMentor_march/iMentorV2/server",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: "5006"
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
        GATEWAY_PORT: "5002"
      }
    },
    {
      name: "imentor-v2-frontend",
      script: "npx",
      args: "vite --host 0.0.0.0 --port 3006",
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
