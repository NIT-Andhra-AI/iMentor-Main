#!/bin/bash
set -e

PROJECT_DIR="/home/sri/Downloads/iMentor_march/iMentor-Main"
cd "$PROJECT_DIR"

echo "🧹 1. Cleaning up existing host processes..."
pkill -f "nodemon" || true
pkill -f "vite" || true
pkill -f "uvicorn" || true
pkill -f "python app.py" || true
pkill -f "proxy.py" || true

for port in 3005 5005 2005 8000; do
    lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
done
echo "✅ Cleanup complete."

echo "🐳 2. Restarting Docker Compose containers..."
docker compose down --remove-orphans || true
docker compose up -d mongo redis neo4j qdrant elasticsearch

echo "⏳ Waiting for Docker containers to become healthy..."
for container in chatbot-mongo chatbot-redis chatbot-neo4j chatbot-qdrant chatbot-elastic; do
    echo -n "  Waiting for $container..."
    for i in {1..30}; do
        status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "missing")
        if [ "$status" = "healthy" ]; then
            echo " healthy!"
            break
        fi
        sleep 2
    done
done
echo "✅ Docker services are up and healthy."

echo "🚀 3. Starting SGLang Local Ollama Proxy on port 8000..."
nohup python3 proxy.py > "$PROJECT_DIR/logs/sglang_proxy.log" 2>&1 &

echo "🐍 4. Starting Python RAG Service on port 2005..."
cd "$PROJECT_DIR/server/rag_service"
mkdir -p "$PROJECT_DIR/logs"
nohup conda run -n imentor uvicorn app:app --host 0.0.0.0 --port 2005 > "$PROJECT_DIR/logs/python-rag.log" 2>&1 &

echo -n "  Waiting for Python RAG Service to start..."
for i in {1..30}; do
    if curl -sf http://localhost:2005/health > /dev/null 2>&1; then
        echo " OK!"
        break
    fi
    sleep 2
done

echo "🟢 5. Starting Node.js Server on port 5005..."
cd "$PROJECT_DIR/server"
nohup node server.js > "$PROJECT_DIR/logs/server.log" 2>&1 &

echo "⚛️ 6. Starting Frontend Vite Server on port 3005..."
cd "$PROJECT_DIR/frontend"
nohup npm run dev > "$PROJECT_DIR/logs/frontend.log" 2>&1 &

echo "🔍 7. Verifying all services are healthy..."

echo -n "  Checking SGLang Proxy (8000)..."
for i in {1..30}; do
    if curl -sf http://localhost:8000/v1/models > /dev/null 2>&1; then
        echo " OK!"
        break
    fi
    sleep 2
done

echo -n "  Checking RAG Service (2005)..."
for i in {1..30}; do
    if curl -sf http://localhost:2005/health > /dev/null 2>&1; then
        echo " OK!"
        break
    fi
    sleep 2
done

echo -n "  Checking Node.js Server (5005)..."
for i in {1..30}; do
    if curl -sf http://localhost:5005/health > /dev/null 2>&1; then
        echo " OK!"
        break
    fi
    sleep 2
done

echo -n "  Checking Frontend Server (3005)..."
for i in {1..30}; do
    if curl -sf http://localhost:3005 > /dev/null 2>&1; then
        echo " OK!"
        break
    fi
    sleep 2
done

echo "🎉 All services are up and healthy!"
echo "🎭 8. Starting Targeted Webapp Playwright Tests..."
cd "$PROJECT_DIR"

xvfb-run npx playwright test \
  tests/e2e/07_tutor_persistence.spec.js \
  tests/e2e/08_tutor_weak_student.spec.js \
  tests/e2e/09_tutor_avg_student.spec.js \
  tests/e2e/10_tutor_expert_student.spec.js \
  tests/e2e/11_skill_tree.spec.js \
  tests/e2e/14_ml_tutor_skillTree_journal.spec.js \
  tests/e2e/tutor_mode.spec.js
