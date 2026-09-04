#!/usr/bin/env python3
"""
health_checker.py — Continuous health monitoring & smart email alert agent for iMentor.
Monitors Docker containers, Python RAG, Node.js Backends, Frontends, and Caddy.
Works collaboratively with agy_auto_healer.py to prevent email spam during active healing sessions.
"""

import json
import os
import smtplib
import subprocess
import time
import urllib.request
import urllib.error
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

# ─── Configuration ────────────────────────────────────────────────────────────
WORKSPACE_ROOT = "/home/sri/Downloads/iMentor_march"
PROJECT_DIR = os.path.join(WORKSPACE_ROOT, "iMentorV2")
LOG_DIR = os.path.join(WORKSPACE_ROOT, "logs")
STATE_FILE = os.path.join(LOG_DIR, "health_alert_state.json")

os.makedirs(LOG_DIR, exist_ok=True)

ALERT_RECIPIENTS = ["sriphani@nitandhra.ac.in"]
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "phani.moresmiles@gmail.com"
SMTP_PASS = "leyv iqdo hija jhox"
SMTP_FROM = "iMentor Monitor <phani.moresmiles@gmail.com>"

ALERT_COOLDOWN_SECS = 600  # 10 minutes throttle for repeated failure alerts

DOCKER_CONTAINERS = [
    "chatbot-mongo",
    "chatbot-redis",
    "chatbot-neo4j",
    "chatbot-qdrant",
    "chatbot-elastic",
    "chatbot-sglang",
]

# ─── Helper Probes ────────────────────────────────────────────────────────────

def is_healing_active(service_name: str) -> bool:
    safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in service_name)
    lock_file = f"/tmp/agy_healing_{safe_name}.lock"
    if os.path.exists(lock_file):
        try:
            with open(lock_file, "r") as f:
                data = json.load(f)
            pid = data.get("pid")
            lock_time = data.get("timestamp", 0)
            if pid and (time.time() - lock_time) < 360:
                try:
                    os.kill(pid, 0)
                    return True
                except OSError:
                    pass
        except Exception:
            pass
    return False


def check_docker_container(name: str) -> tuple[bool, str]:
    try:
        res = subprocess.run(
            ["docker", "inspect", "-f", "{{.State.Running}} ({{.State.Health.Status}})", name],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if res.returncode == 0:
            out = res.stdout.strip()
            if out.startswith("true"):
                return True, out
            return False, f"Container not running: {out}"
        return False, f"Container inspect failed: {res.stderr.strip()}"
    except Exception as e:
        return False, str(e)


def check_http_endpoint(url: str, expected_status: int = 200, timeout: int = 5, ignore_ssl: bool = False) -> tuple[bool, str]:
    ctx = None
    if ignore_ssl:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(url, headers={"User-Agent": "iMentorHealthChecker/2.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as response:
            code = response.getcode()
            body = response.read().decode("utf-8", errors="replace")[:300]
            if code == expected_status or (expected_status == 200 and code in (200, 304, 401)):
                return True, f"HTTP {code} OK"
            return False, f"HTTP {code} returned: {body}"
    except urllib.error.HTTPError as e:
        if e.code in (200, 304, 401):
            return True, f"HTTP {e.code} OK (Protected)"
        body = e.read().decode("utf-8", errors="replace")[:300]
        return False, f"HTTP Error {e.code}: {body}"
    except Exception as e:
        return False, f"Connection failed: {str(e)}"


# ─── Alerting ─────────────────────────────────────────────────────────────────

def send_alert_email(subject: str, html_content: str, text_content: str):
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM
        msg["To"] = ", ".join(ALERT_RECIPIENTS)

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, ALERT_RECIPIENTS, msg.as_string())
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ✉️ Alert email successfully sent to {ALERT_RECIPIENTS}")
        return True
    except Exception as e:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ Failed to send alert email: {e}")
        return False


def load_state() -> dict:
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {"last_alert_time_ts": 0, "failing_services": []}


def save_state(state: dict):
    try:
        with open(STATE_FILE, "w") as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        print(f"Failed to save state file: {e}")


# ─── Main Health Evaluation ───────────────────────────────────────────────────

def run_health_check():
    now = time.time()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S IST")
    state = load_state()

    failures = []
    successes = []

    # 1. Docker Containers
    for container in DOCKER_CONTAINERS:
        ok, msg = check_docker_container(container)
        if ok:
            successes.append(f"Docker: {container} ({msg})")
        else:
            failures.append(f"Docker: {container} — {msg}")

    # 2. iMentorV2 Production Services
    ok, msg = check_http_endpoint("http://127.0.0.1:5006/api/network/ip", expected_status=200, timeout=4)
    if ok:
        successes.append(f"iMentorV2 Node Backend (:5006): {msg}")
    else:
        failures.append(f"iMentorV2 Node Backend (:5006): {msg}")

    ok, msg = check_http_endpoint("http://127.0.0.1:2006/health", expected_status=200, timeout=4)
    if ok:
        successes.append(f"iMentorV2 Python RAG (:2006): {msg}")
    else:
        failures.append(f"iMentorV2 Python RAG (:2006): {msg}")

    ok, msg = check_http_endpoint("http://127.0.0.1:3006", expected_status=200, timeout=4)
    if ok:
        successes.append(f"iMentorV2 Frontend (:3006): {msg}")
    else:
        failures.append(f"iMentorV2 Frontend (:3006): {msg}")

    ok, msg = check_http_endpoint("http://127.0.0.1:5002/health", expected_status=200, timeout=4)
    if ok:
        successes.append(f"iMentorV2 Go Gateway (:5002): {msg}")
    else:
        failures.append(f"iMentorV2 Go Gateway (:5002): {msg}")

    # 3. Caddy HTTPS Reverse Proxy (:443 Primary Entrypoint)
    ok, msg = check_http_endpoint("https://localhost/api/network/ip", expected_status=200, timeout=4, ignore_ssl=True)
    if ok:
        successes.append(f"Caddy HTTPS Reverse Proxy (:443): {msg}")
    else:
        failures.append(f"Caddy HTTPS Reverse Proxy (:443): {msg}")

    # ── State / Alert Logic ──
    prev_failing = state.get("failing_services", [])
    current_failing = [f.split(" — ")[0].split(":")[0] for f in failures]

    # Check if any failing service is actively undergoing Antigravity self-healing
    active_healers = []
    if "iMentorV2 Node Backend" in str(failures) and is_healing_active("imentor-v2-backend"):
        active_healers.append("imentor-v2-backend")
    if "iMentorV2 Python RAG" in str(failures) and is_healing_active("imentor-v2-rag"):
        active_healers.append("imentor-v2-rag")
    if "iMentorV2 Frontend" in str(failures) and is_healing_active("imentor-v2-frontend"):
        active_healers.append("imentor-v2-frontend")
    if "iMentorV2 Go Gateway" in str(failures) and is_healing_active("imentor-v2-go-gateway"):
        active_healers.append("imentor-v2-go-gateway")

    if failures:
        print(f"[{now_str}] ⚠️ {len(failures)} health check failure(s) detected:")
        for f in failures:
            print(f"  ❌ {f}")

        if active_healers:
            print(f"🤖 Note: Antigravity Self-Healing is actively working on: {active_healers}. Suppressing intermediate email alert.")
        else:
            # Check cooldown
            last_sent = state.get("last_alert_time_ts", 0)
            if (now - last_sent) > ALERT_COOLDOWN_SECS or set(current_failing) != set(prev_failing):
                subject = f"🚨 [iMentor Alert] Service Outage/Degraded: {', '.join(current_failing[:3])}"
                
                failures_html = "".join([f"<li style='color: #d9534f; margin-bottom: 6px;'><b>{f}</b></li>" for f in failures])
                successes_html = "".join([f"<li style='color: #5cb85c;'>{s}</li>" for s in successes])
                
                html = f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #d9534f; margin-top: 0;">🚨 iMentor Service Outage Alert</h2>
                    <p>An issue was detected on the iMentor infrastructure. The automated Antigravity Sentinel is tracking and attempting auto-recovery.</p>
                    
                    <p><b>Timestamp:</b> {now_str}</p>
                    
                    <h3 style="color: #333;">❌ Failing Components:</h3>
                    <ul>{failures_html}</ul>
                    
                    <h3 style="color: #333;">✅ Operational Components:</h3>
                    <ul>{successes_html}</ul>
                    
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #777;">
                        Antigravity Autonomous Monitoring Daemon — iMentor Infrastructure<br/>
                        Server Host: 172.180.14.125 | Public: 61.0.228.124
                    </p>
                </div>
                """
                text = f"iMentor Service Alert ({now_str})\n\nFAILURES:\n" + "\n".join(failures) + "\n\nOPERATIONAL:\n" + "\n".join(successes)
                
                if send_alert_email(subject, html, text):
                    state["last_alert_time_ts"] = now
                    state["last_alert_time_str"] = now_str

        state["failing_services"] = current_failing
        save_state(state)
        return False, failures
    else:
        print(f"[{now_str}] ✅ All {len(successes)} components healthy and operational.")
        
        # Check if recovering from a previous failure
        if prev_failing:
            subject = "✅ [iMentor RESOLVED] All Services Restored and Healthy"
            html = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #5cb85c; margin-top: 0;">✅ iMentor Services Recovered</h2>
                <p>All previously failing components have recovered and are now fully operational.</p>
                <p><b>Timestamp:</b> {now_str}</p>
                <p><b>Status:</b> All Docker containers, RAG, Backend, Frontend, and Caddy are healthy (HTTP 200 OK).</p>
            </div>
            """
            text = f"iMentor Resolved ({now_str}): All services are now online and healthy."
            send_alert_email(subject, html, text)
            state["failing_services"] = []
            save_state(state)

        return True, successes


if __name__ == "__main__":
    run_health_check()
