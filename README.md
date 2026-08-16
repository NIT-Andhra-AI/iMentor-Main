# iMentor Platform — AI-Powered Adaptive Learning & Curriculum Management System

> **Repository:** [NIT-Andhra-AI/imentor](https://github.com/NIT-Andhra-AI/imentor)  
> **Maintained by:** NIT Andhra Pradesh AI Research (`spkkarri`)

---

## 1. Overview & Architecture

**iMentor** is an autonomous AI-driven adaptive learning, Socratic tutoring, and course curriculum management platform designed for higher education. It features real-time interactive Socratic dialogue, automated skill tree generation, multimodal visual lesson rendering, knowledge graph integration, and a dedicated Faculty Portal with auto-generated course syllabi and developer-agent swarm tools.

### Core Stack
* **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Mermaid.js
* **Backend:** Node.js (Express), Socket.io (WebSocket streaming), Nodemon
* **RAG & Vector Engine:** Python 3.10+, Qdrant (Vector Store), Neo4j (Knowledge Graph), Elasticsearch
* **AI & LLM Services:** SGLang (Local LLM - `Qwen/Qwen2.5-7B-Instruct-AWQ`), Google Gemini 2.5 Flash / Groq (Provider Fallbacks)
* **Reverse Proxy & TLS:** Caddy Server (Automatic HTTPS, SSE zero-buffering, WebSockets)

---

## 2. Webserver Setup & Execution Instructions

### Prerequisites
* **Node.js:** v20.0.0 or higher
* **Python:** 3.10+ with `pip` and virtual environment support
* **Databases:** MongoDB (Port `27017`), Redis (Port `6379`), Neo4j (Port `7688`), Qdrant (Port `6335`), Elasticsearch (Port `9200`)
* **Reverse Proxy:** Caddy v2.x (installed via `apt` or binary)

---

### Step 1: Clone Repository & Setup Environment Files

```bash
git clone https://github.com/NIT-Andhra-AI/imentor.git
cd imentor
```

Copy the example environment files for both backend and frontend:

```bash
# Top-level root environment
cp .env.example .env

# Server environment
cp server/.env.example server/.env

# Frontend environment
cp frontend/.env.example frontend/.env
```

---

### Step 2: Install Dependencies

#### A. Backend Dependencies
```bash
cd server
npm install
cd ..
```

#### B. Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

#### C. Python RAG Service Dependencies
```bash
cd server/rag_service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ../..
```

---

### Step 3: Run the Webservers

#### Option A: One-Command Automated Startup (Recommended)
Use the provided `startup.sh` script to launch all microservices (Node.js server, Frontend, Python RAG, Database health-checks):
```bash
bash startup.sh
```

#### Option B: Manual Service Execution

1. **Start Node.js Express Backend (Port 5005):**
   ```bash
   cd server
   npm run dev
   ```

2. **Start Python RAG Microservice (Port 2005):**
   ```bash
   cd server/rag_service
   bash start_rag.sh
   ```

3. **Start React Vite Frontend (Port 3005):**
   ```bash
   cd frontend
   npm run dev
   ```

---

## 3. Example Environment Files (`.env`)

Below are sample environment configurations for backend and frontend components.

### A. Root / Backend Environment (`server/.env.example`)
```ini
# server/.env.example
NODE_ENV=development
PORT=5005                            # Backend Express server port

# Security
JWT_SECRET=your_32_char_hex_jwt_secret
JWT_EXPIRATION=7d
ENCRYPTION_SECRET=your_32_char_hex_encryption_secret

# MongoDB & Redis
MONGO_URI=mongodb://localhost:27017/imentor
REDIS_URL=redis://localhost:6379
REDIS_PORT=6379

# Neo4j Knowledge Graph
NEO4J_URI=bolt://localhost:7688
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
NEO4J_PORT=7688

# Qdrant Vector Store & Elasticsearch
QDRANT_URL=http://localhost:6335
QDRANT_PORT=6335
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_PORT=9200

# Python RAG Microservice
PYTHON_RAG_SERVICE_URL=http://localhost:2005
RAG_PORT=2005

# SGLang Local LLM Engine
SGLANG_ENABLED=true
SGLANG_CHAT_URL=http://localhost:8000/v1
SGLANG_CHAT_MODEL=Qwen/Qwen2.5-7B-Instruct-AWQ

# Fallback Cloud LLMs
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
GROQ_API_KEY=your_groq_api_key
```

### B. Frontend Environment (`frontend/.env.example`)
```ini
# frontend/.env.example
# Backend API Base URL
VITE_API_BASE_URL=https://localhost/api

# WebSocket URL for Real-Time Streaming & Socket.io
VITE_WS_URL=wss://localhost

# Environment Mode
VITE_NODE_ENV=development
```

---

## 4. Reverse Proxy & Webserver Configuration (Caddy)

The **iMentor** platform uses **Caddy** as its primary reverse proxy and webserver in production and staging environments.

### Why Caddy?
* **Automatic HTTPS / TLS:** Manages self-signed TLS certificates internally or Let's Encrypt certificates automatically out of the box.
* **Zero-Buffering SSE Support (`flush_interval -1`):** Required for streaming real-time LLM thinking processes and Socratic tutor responses without chunk delays.
* **WebSocket / Socket.io Support:** Native support for long-lived HTTP upgrading and WebSocket streaming.

### Reverse Proxy Routing Map

```
                     ┌───────────────────────────────────────────────┐
                     │           Caddy Reverse Proxy                 │
                     │    https://localhost / https://<server-ip>   │
                     └───────────────────────┬───────────────────────┘
                                             │
      ┌──────────────────────┬───────────────┴───────────────┬──────────────────────┐
      │                      │                               │                      │
┌─────▼──────────────┐ ┌─────▼──────────────┐  ┌─────────────▼──────────────┐ ┌─────▼──────────────┐
│  Frontend (Vite)   │ │ Node.js Express API│  │   Python RAG Service     │ │ Socket.io WebSockets │
│   handle /         │ │ handle /api/*      │  │   handle /rag/*          │ │ handle /socket.io/*  │
│   localhost:3005   │ │ localhost:5005     │  │   localhost:2005         │ │ localhost:5005       │
└────────────────────┘ └────────────────────┘  └──────────────────────────┘ └────────────────────┘
```

### Caddy Configuration (`nginx/Caddyfile`)

```caddy
{
    admin off
    email admin@imentor.local
}

# HTTP to HTTPS Redirect
http://localhost, http://172.180.14.125 {
    redir https://{host}{uri} permanent
}

# Main HTTPS Server Entrypoint
https://localhost, https://172.180.14.125 {
    tls internal

    # Security Headers
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        Strict-Transport-Security "max-age=63072000; includeSubDomains"
        Permissions-Policy "geolocation=(), microphone=(self), camera=()"
    }

    # Node.js Express API Routes
    handle /api/* {
        reverse_proxy localhost:5005 {
            header_up Host              {upstream_hostport}
            header_up X-Real-IP         {remote_host}
            header_up X-Forwarded-For   {remote_host}
            header_up X-Forwarded-Proto {scheme}

            # Disable buffering for SSE (Real-Time LLM Streaming)
            flush_interval -1
            transport http {
                read_timeout  600s
                write_timeout 600s
                dial_timeout  60s
            }
        }
    }

    # Python RAG Service Routes
    handle /rag/* {
        uri strip_prefix /rag
        reverse_proxy localhost:2005 {
            header_up Host              {upstream_hostport}
            header_up X-Real-IP         {remote_host}
            header_up X-Forwarded-For   {remote_host}
            header_up X-Forwarded-Proto {scheme}
            flush_interval -1
        }
    }

    # Socket.io WebSocket Connections
    handle /socket.io/* {
        reverse_proxy localhost:5005 {
            header_up Host              {upstream_hostport}
            header_up X-Real-IP         {remote_host}
            header_up Upgrade           {http.request.header.Upgrade}
            header_up Connection        {http.request.header.Connection}
        }
    }

    # React Frontend Single Page App
    handle {
        reverse_proxy localhost:3005
    }
}
```

### Running Caddy Reverse Proxy

To switch to Caddy and deploy the reverse proxy automatically:

```bash
# Automated switch & reload script
sudo bash nginx/switch-to-caddy.sh

# Or start manually using Caddy CLI
sudo caddy run --config nginx/Caddyfile

# Reload configuration zero-downtime
sudo systemctl reload caddy
```

---

## 5. Token & Model Optimization Framework

iMentor includes an end-to-end token and model optimization framework to lower LLM token consumption and enforce intelligent provider routing:

1. **Input Minification (`server/utils/tokenOptimizer.js`):** Strips comments and collapses superfluous whitespace while preserving code blocks.
2. **Shorthand Abbreviation & Streaming Token Expander (`server/services/llmStreamingService.js`):** Injects System prompt shorthand definitions and dynamically restores abbreviated terms during chunked streaming.
3. **Smart Model Routing (`server/services/smartModelRouterService.js`):** Classifies queries by syntactic complexity and routes simple queries to local SGLang models and complex queries to cloud providers.

---

## 6. EE Syllabi Pipeline & Course Bootstrap

Automated scripts are included to bootstrap 17 Electrical Engineering (EE) courses:

```bash
# 1. Generate structured syllabus CSVs and folder scaffolding
python3 server/scripts/generate_ee_syllabi.py

# 2. Batch ingest into Neo4j graph & Qdrant vector database
python3 bootstrap_ee_courses.py
```

---

## 7. License & Credits

Developed by **NIT Andhra Pradesh AI Team** (`spkkarri`).  
For contributions, issues, or pull requests, visit [github.com/NIT-Andhra-AI/imentor](https://github.com/NIT-Andhra-AI/imentor).
