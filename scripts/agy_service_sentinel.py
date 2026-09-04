#!/usr/bin/env python3
"""
agy_service_sentinel.py — Autonomous Service Health Monitor & Auto-Healer for iMentor V2
Monitors Docker containers, PM2 processes, GPU LLM inference, Go Gateway, Python RAG, and Caddy HTTPS.
Automatically restarts and revives any degraded or failing service.
"""

import sys
import time
import subprocess
import urllib.request
import urllib.error
import ssl
import json
import os

PROJECT_DIR = "/home/sri/Downloads/iMentor_march/iMentorV2"

# Non-verifying SSL context for self-signed Caddy localhost certs
SSL_CTX = ssl._create_unverified_context()

SERVICES = [
    {
        "name": "Caddy HTTPS Reverse Proxy",
        "type": "https",
        "url": "https://localhost/testaddr",
        "restart_cmd": ["caddy", "reload", "--config", f"{PROJECT_DIR}/nginx/Caddyfile"],
        "critical": True
    },
    {
        "name": "Node.js Backend API",
        "type": "http",
        "url": "http://127.0.0.1:5005/api/health",
        "restart_cmd": ["pm2", "restart", "imentor-backend"],
        "critical": True
    },
    {
        "name": "Frontend (Vite UI)",
        "type": "http",
        "url": "http://127.0.0.1:3005",
        "restart_cmd": ["pm2", "restart", "imentor-frontend"],
        "critical": True
    },
    {
        "name": "Python RAG FastAPI Service",
        "type": "http",
        "url": "http://127.0.0.1:2005/docs",
        "restart_cmd": ["pm2", "restart", "imentor-rag"],
        "critical": True
    },
    {
        "name": "Go High-Concurrency Gateway",
        "type": "http",
        "url": "http://127.0.0.1:5001/health",
        "restart_cmd": ["pm2", "restart", "imentor-go-gateway"],
        "critical": True
    },
    {
        "name": "SGLang GPU Inference Server",
        "type": "http",
        "url": "http://127.0.0.1:8000/v1/models",
        "restart_cmd": ["docker", "restart", "chatbot-sglang"],
        "critical": True
    }
]

DOCKER_CONTAINERS = [
    "chatbot-mongo",
    "chatbot-redis",
    "chatbot-neo4j",
    "chatbot-qdrant",
    "chatbot-elastic",
    "chatbot-sglang"
]

def check_http_endpoint(url, timeout=5):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "AGY-Sentinel/1.0", "Host": "localhost"})
        ctx = SSL_CTX if url.startswith("https://") else None
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            return resp.status in (200, 201, 301, 302, 304, 401, 403, 404)
    except urllib.error.HTTPError as e:
        return e.code in (200, 201, 301, 302, 304, 401, 403, 404)
    except Exception:
        return False

def check_docker_container(name):
    try:
        res = subprocess.run(
            ["docker", "inspect", "-f", "{{.State.Status}} ({{.State.Health.Status}})", name],
            capture_output=True, text=True, timeout=5
        )
        if res.returncode == 0:
            out = res.stdout.strip()
            is_healthy = "running" in out and ("healthy" in out or "()" in out or "none" in out or "unhealthy" not in out)
            return is_healthy, out
        return False, "Not Found"
    except Exception as e:
        return False, str(e)

def revive_service(name, cmd):
    print(f"  ⚡ [AUTO-HEAL] Reviving failed service: {name} via `{ ' '.join(cmd) }`...")
    try:
        res = subprocess.run(cmd, cwd=PROJECT_DIR, capture_output=True, text=True, timeout=30)
        if res.returncode == 0:
            print(f"  ✅ [AUTO-HEAL] Successfully restarted {name}")
            return True
        else:
            print(f"  ❌ [AUTO-HEAL] Failed to restart {name}: {res.stderr.strip()[:150]}")
            return False
    except Exception as e:
        print(f"  ❌ [AUTO-HEAL] Exception executing restart for {name}: {e}")
        return False

def run_health_audit(auto_revive=True):
    print("\n" + "=" * 65)
    print("🛡️  AGY SERVICE SENTINEL — LIVE SYSTEM HEALTH AUDIT")
    print("=" * 65)
    
    results = {"timestamp": time.time(), "services": {}, "dockers": {}, "healthy": True}

    # 1. Check Docker Containers
    print("\n🐳 Checking Docker Infrastructure Containers:")
    for cname in DOCKER_CONTAINERS:
        ok, detail = check_docker_container(cname)
        results["dockers"][cname] = {"ok": ok, "status": detail}
        if ok:
            print(f"  ✅ {cname:20} -> {detail}")
        else:
            print(f"  ⚠️  {cname:20} -> DEGRADED ({detail})")
            results["healthy"] = False
            if auto_revive:
                revive_service(cname, ["docker", "restart", cname])

    # 2. Check HTTP Services
    print("\n🌐 Checking Application Services & Endpoints:")
    for svc in SERVICES:
        ok = check_http_endpoint(svc["url"])
        results["services"][svc["name"]] = {"ok": ok, "url": svc["url"]}
        if ok:
            print(f"  ✅ {svc['name']:32} [{svc['url']}] -> ONLINE")
        else:
            print(f"  ❌ {svc['name']:32} [{svc['url']}] -> UNREACHABLE")
            results["healthy"] = False
            if auto_revive:
                revive_service(svc["name"], svc["restart_cmd"])
                # Wait 3s and re-test
                time.sleep(3)
                re_ok = check_http_endpoint(svc["url"])
                if re_ok:
                    print(f"  ✅ {svc['name']:32} -> RECOVERED to ONLINE")
                    results["services"][svc["name"]]["ok"] = True

    print("=" * 65)
    if results["healthy"]:
        print("🌟 STATUS: All system services and database backends are HEALTHY & OPERATIONAL.")
    else:
        print("⚠️  STATUS: Degraded services detected & auto-revival procedures dispatched.")
    print("=" * 65 + "\n")
    return results

if __name__ == "__main__":
    mode = "--watch" if "--watch" in sys.argv else "--once"
    interval = 15
    for arg in sys.argv:
        if arg.startswith("--interval="):
            interval = int(arg.split("=")[1])

    if mode == "--once":
        res = run_health_audit(auto_revive=True)
        sys.exit(0 if res["healthy"] else 1)
    else:
        print(f"Starting AGY Service Sentinel continuous monitor loop (interval={interval}s)...")
        while True:
            try:
                run_health_audit(auto_revive=True)
                time.sleep(interval)
            except KeyboardInterrupt:
                print("\nSentinel monitoring halted by user.")
                break
