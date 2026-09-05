#!/usr/bin/env bash
# ==============================================================================
# monitor_services.sh — Intelligent Multi-Tier Watchdog for iMentor
# Tier 1: Fast PM2/Docker restart for transient hiccups.
# Tier 2: Autonomous Antigravity AI Code Healer (agy_auto_healer.py) for persistent bugs.
# ==============================================================================

WORKSPACE_ROOT="/home/sri/Downloads/iMentor_march"
PROJECT_DIR="$WORKSPACE_ROOT/iMentorV2"
LOG_DIR="$WORKSPACE_ROOT/logs"
MONITOR_LOG="$LOG_DIR/monitor_services.log"
HEALER_SCRIPT="$WORKSPACE_ROOT/scripts/agy_auto_healer.py"

mkdir -p "$LOG_DIR"

echo "=== iMentorV2 Autonomous Sentinel & Self-Healing Watchdog Started ===" | tee -a "$MONITOR_LOG"
echo "Timestamp: $(date)" | tee -a "$MONITOR_LOG"

export PATH="/home/sri/.local/bin:/home/sri/anaconda3/bin:$PATH"

# Helper function to check if a port is listening on the host
check_port() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        lsof -i :"$port" > /dev/null 2>&1
    elif command -v ss >/dev/null 2>&1; then
        ss -tuln | grep -q ":$port "
    else
        timeout 1 bash -c "cat < /dev/null > /dev/tcp/127.0.0.1/$port" >/dev/null 2>&1
    fi
}

# Helper function to check HTTP health
check_http_healthy() {
    local url=$1
    local timeout_secs=${2:-4}
    local status_code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout_secs" "$url" 2>/dev/null || echo "000")
    if [[ "$status_code" =~ ^(200|304|401)$ ]]; then
        return 0
    else
        return 1
    fi
}

# Auto-revive or dispatch Antigravity Healer
handle_service_failure() {
    local service_name="$1"
    local port="$2"
    local check_url="$3"
    local target_dir="$4"

    # Check if Antigravity Self-Healing is already actively running for this service
    local safe_name
    safe_name=$(echo "$service_name" | sed 's/[^a-zA-Z0-9_-]/_/g')
    local lock_file="/tmp/agy_healing_${safe_name}.lock"
    if [ -f "$lock_file" ]; then
        local lock_pid
        lock_pid=$(grep -o '"pid": *[0-9]*' "$lock_file" 2>/dev/null | head -n1 | grep -o '[0-9]*')
        if [ -n "$lock_pid" ] && kill -0 "$lock_pid" 2>/dev/null; then
            echo "[$(date)] 🔒 Active healing session already running for '$service_name' (PID $lock_pid). Skipping watchdog restart." | tee -a "$MONITOR_LOG"
            return 0
        fi
    fi

    echo "[$(date)] ⚠️ Detected failure in service '$service_name' (Port $port)." | tee -a "$MONITOR_LOG"
    
    # --- Tier 1: Fast Restart ---
    echo "[$(date)] ⚡ [Tier 1] Attempting fast restart of '$service_name'..." | tee -a "$MONITOR_LOG"
    env -u PM2_JSON_PROCESSING -u NODE_CHANNEL_FD -u NODE_CHANNEL_SERIALIZATION_MODE -u PM2_USAGE pm2 restart "$service_name" >> "$MONITOR_LOG" 2>&1 || true
    
    # Python RAG services take 12-15 seconds to initialize FastEmbedder, Qdrant, Neo4j
    if [[ "$service_name" == *"rag"* ]]; then
        sleep 20
    elif [[ "$service_name" == *"backend"* ]]; then
        sleep 10
    else
        sleep 5
    fi
    
    # Re-check
    if check_port "$port" && check_http_healthy "$check_url" 6; then
        echo "[$(date)] ✅ [Tier 1 SUCCESS] '$service_name' recovered successfully via fast restart." | tee -a "$MONITOR_LOG"
        return 0
    fi

    # --- Tier 2: Dispatch Autonomous Antigravity AI Healer ---
    echo "[$(date)] 🚨 [Tier 1 FAILED] '$service_name' is still DOWN. Dispatching Antigravity Autonomous AI Healer..." | tee -a "$MONITOR_LOG"
    python3 "$HEALER_SCRIPT" --service="$service_name" --port="$port" --url="$check_url" --dir="$target_dir" >> "$MONITOR_LOG" 2>&1 &
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
            RUNNING_STATUS=$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null)
            if [ "$RUNNING_STATUS" != "true" ]; then
                echo "[$(date)] ❌ Docker container '$container' is DOWN. Restarting..." | tee -a "$MONITOR_LOG"
                docker start "$container" >> "$MONITOR_LOG" 2>&1
            fi
        done
    fi

    # -------------------------------------------------------------------------
    # 2. Monitor iMentorV2 (v2.0 Primary Production) Services
    # -------------------------------------------------------------------------
    # Node Backend (:5005)
    if ! check_port 5005 || ! check_http_healthy "http://127.0.0.1:5005/api/network/ip" 4; then
        # Double check after 3s to prevent false alarms during transient spikes
        sleep 3
        if ! check_port 5005 || ! check_http_healthy "http://127.0.0.1:5005/api/network/ip" 4; then
            handle_service_failure "imentor-v2-backend" 5005 "http://127.0.0.1:5005/api/network/ip" "$PROJECT_DIR"
        fi
    fi

    # Python RAG Service (:2005)
    if ! check_port 2005 || ! check_http_healthy "http://127.0.0.1:2005/health" 6; then
        sleep 10
        if ! check_port 2005 || ! check_http_healthy "http://127.0.0.1:2005/health" 10; then
            handle_service_failure "imentor-v2-rag" 2005 "http://127.0.0.1:2005/health" "$PROJECT_DIR/server/rag_service"
        fi
    fi

    # Frontend (:3005)
    if ! check_port 3005 || ! check_http_healthy "http://127.0.0.1:3005" 4; then
        sleep 3
        if ! check_port 3005 || ! check_http_healthy "http://127.0.0.1:3005" 4; then
            handle_service_failure "imentor-v2-frontend" 3005 "http://127.0.0.1:3005" "$PROJECT_DIR/frontend"
        fi
    fi

    # Go Gateway (:5002)
    if ! check_port 5002 || ! check_http_healthy "http://127.0.0.1:5002/health" 4; then
        sleep 3
        if ! check_port 5002 || ! check_http_healthy "http://127.0.0.1:5002/health" 4; then
            handle_service_failure "imentor-v2-go-gateway" 5002 "http://127.0.0.1:5002/health" "$PROJECT_DIR/go-gateway"
        fi
    fi

    # -------------------------------------------------------------------------
    # 3. Monitor Caddy Reverse Proxy
    # -------------------------------------------------------------------------
    if command -v systemctl >/dev/null 2>&1; then
        if ! systemctl is-active --quiet caddy 2>/dev/null; then
            echo "[$(date)] ⚠️ Caddy is inactive. Reloading..." | tee -a "$MONITOR_LOG"
            systemctl reload caddy 2>/dev/null || systemctl restart caddy 2>/dev/null || true
        fi
    fi

    # -------------------------------------------------------------------------
    # 4. Run Health Evaluation & Smart Alerting (Every 60 seconds)
    # -------------------------------------------------------------------------
    python3 "$PROJECT_DIR/server/scripts/health_checker.py" >> "$MONITOR_LOG" 2>&1

    sleep 15
done
