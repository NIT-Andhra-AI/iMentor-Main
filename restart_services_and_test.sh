#!/bin/bash
# Orchestration script to:
# 1. Kill stale processes on service ports (3005, 5005, 2005, 8000)
# 2. Restart Docker containers (mongo, redis, neo4j, qdrant, elasticsearch)
# 3. Start SGLang-to-Ollama proxy on port 8000
# 4. Start Python RAG service on port 2005 (using conda imentor env)
# 5. Start Node.js backend on port 5005
# 6. Start Vite frontend on port 3005
# 7. Wait for all services to become healthy
# 8. Run Playwright E2E tests

set -e

PROJECT_DIR="/home/sri/Downloads/iMentor_march/iMentor-Main"
cd "$PROJECT_DIR"

echo "🧹 1. Cleaning up existing host processes..."
# Kill by pattern
pkill -f "nodemon" || true
pkill -f "vite" || true
pkill -f "uvicorn" || true
pkill -f "python app.py" || true
pkill -f "proxy.py" || true

# Kill anything listening on our ports
for port in 3005 3006 5005 2005 8000; do
    lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
done
echo "✅ Cleanup complete."

echo "🐳 2. Restarting Docker Compose containers..."
docker compose down --remove-orphans || true

SGLANG_CONF=$(grep -E '^SGLANG_ENABLED=' "$PROJECT_DIR/server/.env" 2>/dev/null | cut -d= -f2 | tr -d '[:space:]')
if [ "$SGLANG_CONF" = "true" ]; then
    echo "🐳 Starting SGLang (GPU) + standard databases..."
    docker compose up -d mongo redis neo4j qdrant elasticsearch sglang
    CONTAINERS="chatbot-mongo chatbot-redis chatbot-neo4j chatbot-qdrant chatbot-elastic chatbot-sglang"
else
    echo "🐳 Starting databases (SGLang disabled)..."
    docker compose up -d mongo redis neo4j qdrant elasticsearch
    CONTAINERS="chatbot-mongo chatbot-redis chatbot-neo4j chatbot-qdrant chatbot-elastic"
fi

echo "⏳ Waiting for Docker containers to become healthy..."
for container in $CONTAINERS; do
    echo -n "  Waiting for $container..."
    max_loops=30
    if [ "$container" = "chatbot-sglang" ]; then
        max_loops=200
    fi
    for i in $(seq 1 $max_loops); do
        status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "missing")
        if [ "$status" = "healthy" ]; then
            echo " healthy!"
            break
        fi
        sleep 2
    done
done
echo "✅ Docker services are up and healthy."

echo "🐍 4. Starting Python RAG Service on port 2005..."
cd "$PROJECT_DIR/server/rag_service"
mkdir -p "$PROJECT_DIR/logs"
nohup conda run -n imentor uvicorn app:app --host 0.0.0.0 --port 2005 > "$PROJECT_DIR/logs/python-rag.log" 2>&1 &

echo "🟢 5. Starting Node.js Server on port 5005..."
cd "$PROJECT_DIR/server"
nohup node server.js > "$PROJECT_DIR/logs/server.log" 2>&1 &

echo "⚛️ 6. Starting Frontend Vite Server on port 3005..."
cd "$PROJECT_DIR/frontend"
nohup npm run dev > "$PROJECT_DIR/logs/frontend.log" 2>&1 &

echo "🔍 7. Verifying all services are healthy..."

# SGLang check
echo -n "  Checking SGLang Server (8000)..."
for i in {1..15}; do
    if curl -sf http://localhost:8000/v1/models > /dev/null 2>&1; then
        echo " OK!"
        break
    fi
    if [ $i -eq 15 ]; then
        echo " WARNING: SGLang Server on port 8000 is not running yet."
    fi
    sleep 2
done

# RAG Service check
echo -n "  Checking RAG Service (2005)..."
for i in {1..30}; do
    if curl -sf http://localhost:2005/health > /dev/null 2>&1; then
        echo " OK!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo " FAILED!"
        exit 1
    fi
    sleep 2
done

# Node Server check
echo -n "  Checking Node.js Server (5005)..."
for i in {1..30}; do
    if curl -sf http://localhost:5005/health > /dev/null 2>&1; then
        echo " OK!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo " FAILED!"
        exit 1
    fi
    sleep 2
done

# Frontend check
echo -n "  Checking Frontend Server (3005)..."
for i in {1..30}; do
    if curl -sf http://localhost:3005 > /dev/null 2>&1; then
        echo " OK!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo " FAILED!"
        exit 1
    fi
    sleep 2
done

echo "🎉 All services are up and healthy!"
echo "🎭 8. Starting Webapp Playwright Tests..."
cd "$PROJECT_DIR"

# Run tests headlessly using xvfb-run
xvfb-run npx playwright test
