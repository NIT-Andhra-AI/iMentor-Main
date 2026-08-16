#!/usr/bin/env bash
# =============================================================================
#  iMentor Unified Installer & Setup Script
#  Deploys backend, frontend, databases, and GPU-accelerated SGLang LLM server.
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}          iMentor Unified Stack Installer           ${NC}"
echo -e "${GREEN}====================================================${NC}"

# ─── 1. Prerequisites Check ──────────────────────────────────────────────────
echo -e "\n${YELLOW}[1/6] Checking System Prerequisites...${NC}"

# Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
else
    echo -e "  ✓ Docker is installed."
fi

# Docker Compose
if docker compose version &> /dev/null; then
    DOCKER_CMD="docker compose"
    echo -e "  ✓ Docker Compose (v2) is installed."
elif command -v docker-compose &> /dev/null; then
    DOCKER_CMD="docker-compose"
    echo -e "  ✓ docker-compose is installed."
else
    echo -e "${RED}❌ Docker Compose is not installed. Please install it first.${NC}"
    exit 1
fi

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js (v18+).${NC}"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo -e "  ✓ Node.js is installed ($NODE_VERSION)."
fi

# Conda
if ! command -v conda &> /dev/null; then
    echo -e "${YELLOW}  ⚠️  Conda is not found on PATH. Will attempt fallback to standard python3/pip.${NC}"
    HAS_CONDA=false
else
    echo -e "  ✓ Conda is installed."
    HAS_CONDA=true
fi

# ─── 2. Setup Environment Configurations ──────────────────────────────────────
echo -e "\n${YELLOW}[2/6] Configuring Environment Files...${NC}"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -f "$PROJECT_ROOT/server/.env" ]; then
    echo -e "  → Creating server/.env from template..."
    if [ -f "$PROJECT_ROOT/server/.env.example" ]; then
        cp "$PROJECT_ROOT/server/.env.example" "$PROJECT_ROOT/server/.env"
    else
        # Fallback minimal env configuration
        cat <<EOF > "$PROJECT_ROOT/server/.env"
NODE_ENV=development
PORT=5005
JWT_SECRET=imentor_dev_jwt_secret_change_in_production_2026
JWT_EXPIRATION=7d
ENCRYPTION_SECRET=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
MONGO_URI=mongodb://localhost:27018/imentor
REDIS_URL=redis://localhost:6380
REDIS_PORT=6380
NEO4J_URI=bolt://localhost:7688
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
QDRANT_URL=http://localhost:6335
PYTHON_RAG_SERVICE_URL=http://localhost:2005
SGLANG_ENABLED=true
SGLANG_API_BASE=http://localhost:8000/v1
SGLANG_CHAT_URL=http://localhost:8000/v1
SGLANG_REASON_URL=http://localhost:8000/v1
SGLANG_HEAVY_URL=http://localhost:8000/v1
SGLANG_CHAT_MODEL=Qwen/Qwen2.5-7B-Instruct-AWQ
SGLANG_REASON_MODEL=Qwen/Qwen2.5-7B-Instruct-AWQ
SGLANG_HEAVY_MODEL=Qwen/Qwen2.5-7B-Instruct-AWQ
FRONTEND_URL=http://localhost:3006,http://localhost:5173
EMBED_PROVIDER=fastembed
ENABLE_CRON=false
EOF
    fi
    echo -e "  ✓ server/.env created."
else
    echo -e "  ✓ server/.env already exists."
fi

# ─── 3. Launch Docker Infrastructure ─────────────────────────────────────────
echo -e "\n${YELLOW}[3/6] Starting Infrastructure Services (MongoDB, Redis, Neo4j, Qdrant, SGLang)...${NC}"
$DOCKER_CMD up -d mongodb redis neo4j qdrant sglang

# ─── 4. Install Node.js Backend Dependencies ──────────────────────────────────
echo -e "\n${YELLOW}[4/6] Installing Node.js Server Dependencies...${NC}"
cd "$PROJECT_ROOT/server"
npm install --no-audit --no-fund

# ─── 5. Install Python RAG Service Dependencies ───────────────────────────────
echo -e "\n${YELLOW}[5/6] Setting Up Python RAG Microservice...${NC}"
cd "$PROJECT_ROOT/server/rag_service"

if [ "$HAS_CONDA" = true ]; then
    echo -e "  → Initializing conda environment 'imentor'..."
    conda env update -n imentor -f environment.yml || conda env create -n imentor -f environment.yml
else
    echo -e "  → Installing pip dependencies locally..."
    pip install -r requirements.txt
fi

# ─── 6. Install React Frontend Dependencies ───────────────────────────────────
echo -e "\n${YELLOW}[6/6] Installing Frontend Dependencies...${NC}"
cd "$PROJECT_ROOT/frontend"
npm install --no-audit --no-fund

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}        🎉 Setup Completed Successfully! 🎉         ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "\nTo launch all components:"
echo -e "  1. Start backend server:  ${YELLOW}cd server && npm run dev${NC}"
echo -e "  2. Start RAG service:    ${YELLOW}cd server/rag_service && conda run -n imentor uvicorn app:app --port 2005 --host 0.0.0.0${NC}"
echo -e "  3. Start React frontend:  ${YELLOW}cd frontend && npm run dev${NC}"
echo -e "\nAccess the web app at:    ${GREEN}http://localhost:3006/${NC}"
echo -e "SGLang inference active at: ${GREEN}http://localhost:8000/v1${NC}"
echo -e "${GREEN}====================================================${NC}"
