#!/usr/bin/env bash

# monitor_services.sh
# Monitors all docker containers and host application services for iMentor.
# Automatically restarts any down service.

PROJECT_DIR="/home/sri/Downloads/iMentor_march/iMentor-Main"
NODE_LOG="$PROJECT_DIR/logs/node_backend_manual.log"
RAG_LOG="$PROJECT_DIR/logs/rag_service_manual.log"
FRONTEND_LOG="$PROJECT_DIR/logs/frontend_manual.log"
MONITOR_LOG="$PROJECT_DIR/logs/monitor_services.log"

# Ensure the logs directory exists
mkdir -p "$PROJECT_DIR/logs"

echo "=== iMentor Services Monitoring Script Started ===" | tee -a "$MONITOR_LOG"
echo "Node Log: $NODE_LOG" | tee -a "$MONITOR_LOG"
echo "RAG Log: $RAG_LOG" | tee -a "$MONITOR_LOG"
echo "Frontend Log: $FRONTEND_LOG" | tee -a "$MONITOR_LOG"
echo "Monitor Log: $MONITOR_LOG" | tee -a "$MONITOR_LOG"

# Helper function to check if a port is listening on the host
check_port() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        lsof -i :"$port" > /dev/null 2>&1
    elif command -v ss >/dev/null 2>&1; then
        ss -tuln | grep -q ":$port "
    else
        # fallback using bash dev TCP check
        timeout 1 bash -c "cat < /dev/null > /dev/tcp/127.0.0.1/$port" >/dev/null 2>&1
    fi
}

while true; do
    # -------------------------------------------------------------------------
    # 1. Monitor Docker Containers
    # -------------------------------------------------------------------------
    DOCKER_CONTAINERS=(
        "chatbot-mongo"
        "chatbot-redis"
        "chatbot-neo4j"
        "chatbot-qdrant"
        "chatbot-elastic"
        "chatbot-sglang"
    )

    if command -v docker >/dev/null 2>&1; then
        for container in "${DOCKER_CONTAINERS[@]}"; do
            # Check if container is running
            RUNNING_STATUS=$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null)
            if [ "$RUNNING_STATUS" != "true" ]; then
                echo "[$(date)] ❌ Docker container '$container' is DOWN (status: $RUNNING_STATUS). Restarting..." | tee -a "$MONITOR_LOG"
                docker start "$container" >> "$MONITOR_LOG" 2>&1
                echo "[$(date)] ✅ '$container' restart command issued." | tee -a "$MONITOR_LOG"
            fi
        done
    else
        echo "[$(date)] ⚠️ Warning: docker command not found." | tee -a "$MONITOR_LOG"
    fi

    # -------------------------------------------------------------------------
    # 2. Monitor Node Backend (Port 5005)
    # -------------------------------------------------------------------------
    if ! check_port 5005; then
        echo "[$(date)] ❌ Node backend (port 5005) is DOWN. Restarting..." | tee -a "$MONITOR_LOG"
        cd "$PROJECT_DIR/server" || exit
        # Clean up any lingering nodemon/node instances that might block the port
        pkill -f "node server.js" > /dev/null 2>&1
        pkill -f "nodemon" > /dev/null 2>&1
        nohup npm run dev >> "$NODE_LOG" 2>&1 &
        echo "[$(date)] ✅ Node backend restart triggered." | tee -a "$MONITOR_LOG"
    fi

    # -------------------------------------------------------------------------
    # 3. Monitor Python RAG Service (Port 2005)
    # -------------------------------------------------------------------------
    if ! check_port 2005; then
        echo "[$(date)] ❌ Python RAG service (port 2005) is DOWN. Restarting..." | tee -a "$MONITOR_LOG"
        cd "$PROJECT_DIR/server/rag_service" || exit
        pkill -f "uvicorn app:app --host 0.0.0.0 --port 2005" > /dev/null 2>&1
        nohup conda run --no-capture-output -n imentor uvicorn app:app --host 0.0.0.0 --port 2005 >> "$RAG_LOG" 2>&1 &
        echo "[$(date)] ✅ Python RAG service restart triggered." | tee -a "$MONITOR_LOG"
    fi

    # -------------------------------------------------------------------------
    # 4. Monitor Frontend Service (Port 3005)
    # -------------------------------------------------------------------------
    if ! check_port 3005; then
        echo "[$(date)] ❌ Frontend service (port 3005) is DOWN. Restarting..." | tee -a "$MONITOR_LOG"
        cd "$PROJECT_DIR/frontend" || exit
        pkill -f "vite --host 0.0.0.0 --port 3005" > /dev/null 2>&1
        nohup npm run dev -- --host 0.0.0.0 --port 3005 >> "$FRONTEND_LOG" 2>&1 &
        echo "[$(date)] ✅ Frontend service restart triggered." | tee -a "$MONITOR_LOG"
    fi

    sleep 10
done
