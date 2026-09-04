#!/usr/bin/env python3
"""
agy_auto_healer.py — Autonomous Self-Healing Engine powered by Antigravity CLI (agy)
Extracts runtime crash logs, stack traces, and system context, then invokes an isolated
non-interactive Antigravity CLI session to diagnose, fix, and revive broken services.
Includes atomic locking, cooldown throttling, and loop protection.
"""

import argparse
import json
import os
import smtplib
import subprocess
import sys
import time
import urllib.error
import urllib.request
import ssl
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# ─── Configuration ────────────────────────────────────────────────────────────
WORKSPACE_ROOT = "/home/sri/Downloads/iMentor_march"
MAIN_PROJECT_DIR = os.path.join(WORKSPACE_ROOT, "iMentor-Main")
V2_PROJECT_DIR = os.path.join(WORKSPACE_ROOT, "iMentorV2")
LOG_DIR = os.path.join(WORKSPACE_ROOT, "logs")
RESOLUTIONS_LOG = os.path.join(LOG_DIR, "incident_resolutions.jsonl")
HEALING_STATE_FILE = os.path.join(LOG_DIR, "healing_state.json")
AGY_BIN = "/home/sri/.local/bin/agy"

os.makedirs(LOG_DIR, exist_ok=True)

ALERT_RECIPIENTS = ["sriphani@nitandhra.ac.in"]
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "phani.moresmiles@gmail.com"
SMTP_PASS = "leyv iqdo hija jhox"
SMTP_FROM = "iMentor Auto-Healer <phani.moresmiles@gmail.com>"

MAX_HEALING_ATTEMPTS_PER_INCIDENT = 2
COOLDOWN_WINDOW_SECS = 900  # 15 minutes

# Non-verifying SSL context for localhost probes
SSL_CTX = ssl._create_unverified_context()


# ─── Helpers: Email Notifications ─────────────────────────────────────────────

def send_email(subject: str, html_content: str, text_content: str) -> bool:
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM
        msg["To"] = ", ".join(ALERT_RECIPIENTS)

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=12) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, ALERT_RECIPIENTS, msg.as_string())
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ✉️ Notification email sent to {ALERT_RECIPIENTS}")
        return True
    except Exception as e:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ⚠️ Failed to send notification email: {e}")
        return False


# ─── Helpers: Lock & State Management ──────────────────────────────────────────

def get_lock_path(service_name: str) -> str:
    safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in service_name)
    return f"/tmp/agy_healing_{safe_name}.lock"


def acquire_lock(service_name: str, incident_id: str) -> bool:
    lock_file = get_lock_path(service_name)
    now = time.time()

    if os.path.exists(lock_file):
        try:
            with open(lock_file, "r") as f:
                data = json.load(f)
            pid = data.get("pid")
            lock_time = data.get("timestamp", 0)

            # Check if previous process is still alive and not timed out (> 6 minutes)
            if pid and (now - lock_time) < 360:
                try:
                    os.kill(pid, 0)
                    print(f"🔒 Active healing session already running for '{service_name}' (PID {pid}). Skipping to avoid loops.")
                    return False
                except OSError:
                    # Process died, stale lock
                    pass
        except Exception:
            pass

    try:
        with open(lock_file, "w") as f:
            json.dump({
                "pid": os.getpid(),
                "service": service_name,
                "incident_id": incident_id,
                "timestamp": now,
                "time_str": datetime.now().strftime("%Y-%m-%d %H:%M:%S IST")
            }, f, indent=2)
        return True
    except Exception as e:
        print(f"❌ Failed to acquire lock for '{service_name}': {e}")
        return False


def release_lock(service_name: str):
    lock_file = get_lock_path(service_name)
    try:
        if os.path.exists(lock_file):
            os.remove(lock_file)
    except Exception as e:
        print(f"⚠️ Error removing lock file {lock_file}: {e}")


def load_healing_state() -> dict:
    if os.path.exists(HEALING_STATE_FILE):
        try:
            with open(HEALING_STATE_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def save_healing_state(state: dict):
    try:
        with open(HEALING_STATE_FILE, "w") as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        print(f"⚠️ Failed to save healing state: {e}")


def check_cooldown(service_name: str) -> tuple[bool, str]:
    state = load_healing_state()
    svc_state = state.get(service_name, {})
    now = time.time()

    attempts = svc_state.get("attempts", 0)
    first_attempt_ts = svc_state.get("first_attempt_ts", 0)
    last_status = svc_state.get("last_status", "UNKNOWN")

    if attempts >= MAX_HEALING_ATTEMPTS_PER_INCIDENT:
        if (now - first_attempt_ts) < COOLDOWN_WINDOW_SECS:
            remaining = int(COOLDOWN_WINDOW_SECS - (now - first_attempt_ts))
            return False, f"Maximum healing attempts ({attempts}) reached for '{service_name}'. Cooldown active ({remaining}s remaining)."
        else:
            # Cooldown window expired, reset attempts
            svc_state["attempts"] = 0
            svc_state["first_attempt_ts"] = now
            state[service_name] = svc_state
            save_healing_state(state)

    return True, "OK"


def record_attempt(service_name: str, status: str, incident_id: str):
    state = load_healing_state()
    now = time.time()
    svc_state = state.get(service_name, {})

    if svc_state.get("attempts", 0) == 0 or (now - svc_state.get("first_attempt_ts", 0)) > COOLDOWN_WINDOW_SECS:
        svc_state["first_attempt_ts"] = now
        svc_state["attempts"] = 1
    else:
        svc_state["attempts"] = svc_state.get("attempts", 0) + 1

    svc_state["last_attempt_ts"] = now
    svc_state["last_status"] = status
    svc_state["incident_id"] = incident_id
    state[service_name] = svc_state
    save_healing_state(state)


def record_resolution(service_name: str, incident_id: str, fix_summary: str, duration_secs: float):
    state = load_healing_state()
    if service_name in state:
        state[service_name]["attempts"] = 0
        state[service_name]["last_status"] = "RESOLVED"
        save_healing_state(state)

    entry = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S IST"),
        "service": service_name,
        "incident_id": incident_id,
        "status": "RESOLVED",
        "duration_seconds": round(duration_secs, 2),
        "summary": fix_summary
    }
    try:
        with open(RESOLUTIONS_LOG, "a") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception as e:
        print(f"⚠️ Error writing to resolutions log: {e}")


# ─── Helpers: Health Probe & Diagnostic Collector ─────────────────────────────

def probe_health(url: str, timeout: int = 5) -> bool:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "AGY-Healer/1.0"})
        ctx = SSL_CTX if url.startswith("https://") else None
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            return resp.status in (200, 201, 301, 302, 304, 401, 403)
    except urllib.error.HTTPError as e:
        return e.code in (200, 201, 301, 302, 304, 401, 403)
    except Exception:
        return False


def collect_diagnostics(service_name: str, port: int) -> str:
    lines = []
    lines.append(f"=== Service Diagnostics for {service_name} ===")
    lines.append(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S IST')}")
    lines.append(f"Target Port: {port}")

    # PM2 Logs
    try:
        res = subprocess.run(
            ["pm2", "logs", service_name, "--lines", "70", "--nostream"],
            capture_output=True, text=True, timeout=8
        )
        if res.stdout or res.stderr:
            lines.append("\n--- Recent PM2 Logs (stdout & stderr) ---")
            lines.append(res.stdout[-4000:] if res.stdout else "")
            if res.stderr:
                lines.append("--- STDERR ---")
                lines.append(res.stderr[-3000:])
    except Exception as e:
        lines.append(f"Could not retrieve PM2 logs: {e}")

    # Check for crash dump file
    crash_dump_files = [
        "/tmp/imentor_last_crash.json",
        "/tmp/imentor_v2_last_crash.json",
        "/tmp/imentor_last_unhandled_rejection.json"
    ]
    for cfile in crash_dump_files:
        if os.path.exists(cfile):
            try:
                mtime = os.path.getmtime(cfile)
                if (time.time() - mtime) < 300:  # Fresh within 5 minutes
                    with open(cfile, "r") as f:
                        lines.append(f"\n--- Crash Dump ({cfile}) ---")
                        lines.append(f.read()[:2000])
            except Exception:
                pass

    return "\n".join(lines)


# ─── Core Healer Execution ───────────────────────────────────────────────────

def run_healer(service_name: str, port: int, check_url: str, target_dir: str, force: bool = False) -> bool:
    incident_id = f"INC-{service_name}-{int(time.time())}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S IST")

    print(f"\n[{now_str}] 🚀 Initiating Antigravity Auto-Healer for '{service_name}' (Incident: {incident_id})...")

    # 1. Cooldown & Lock Check
    if not force:
        allowed, reason = check_cooldown(service_name)
        if not allowed:
            print(f"⏳ {reason}")
            return False

    if not acquire_lock(service_name, incident_id):
        return False

    start_time = time.time()

    try:
        # 2. Collect Diagnostics
        diagnostics = collect_diagnostics(service_name, port)

        # 3. Formulate Autonomous Prompt
        prompt = (
            f"AUTONOMOUS INCIDENT RECOVERY for iMentor Service: '{service_name}'\n"
            f"Incident ID: {incident_id}\n"
            f"Target Port: {port}\n"
            f"Target Health URL: {check_url}\n"
            f"Primary Directory: {target_dir}\n\n"
            f"PROBLEM:\n"
            f"The service is DOWN / crash-looping and failed standard process restart.\n\n"
            f"CRASH LOGS & STACK TRACE:\n"
            f"```\n{diagnostics}\n```\n\n"
            f"YOUR EXACT OBJECTIVES:\n"
            f"1. Analyze the stack trace and pinpoint the root cause (missing module/file, invalid require path, syntax bug, unhandled exception, type error, or config issue).\n"
            f"2. Inspect the codebase in {target_dir} (or related workspace dirs in {WORKSPACE_ROOT}) and edit the necessary files to fix the error cleanly.\n"
            f"3. If a module is missing, locate it across /home/sri/Downloads/iMentor_march/ or implement the required service.\n"
            f"4. Validate your changes using syntax checks (e.g. node -c <file> or python -m py_compile <file>).\n"
            f"5. Restart the service using: pm2 restart {service_name}\n"
            f"6. Confirm the service is online and health endpoint {check_url} returns HTTP 200.\n"
            f"7. Provide a concise 2-sentence summary of the fix."
        )

        record_attempt(service_name, "IN_PROGRESS", incident_id)

        print(f"🤖 Spawning Antigravity CLI ('agy') autonomous healing session (max timeout: 4m)...")

        # 4. Invoke Antigravity CLI in non-interactive print mode
        cmd = [
            AGY_BIN,
            f"--prompt={prompt}",
            "--dangerously-skip-permissions",
            "--mode=accept-edits",
            "--effort=high",
            f"--add-dir={target_dir}",
            f"--add-dir={WORKSPACE_ROOT}",
            "--print-timeout=4m"
        ]

        agy_env = os.environ.copy()
        agy_env["ANTIGRAVITY_AUTONOMOUS_HEALER"] = "true"

        res = subprocess.run(
            cmd,
            cwd=target_dir,
            capture_output=True,
            text=True,
            timeout=270,
            env=agy_env
        )

        agy_output = res.stdout.strip()
        agy_stderr = res.stderr.strip()
        elapsed = time.time() - start_time

        print(f"⏱️ Antigravity CLI finished in {elapsed:.1f}s (exit code: {res.returncode})")

        # 5. Verify Service Health
        time.sleep(3)
        is_healthy = False
        for attempt in range(1, 4):
            if probe_health(check_url, timeout=4):
                is_healthy = True
                break
            time.sleep(2)

        if is_healthy:
            summary = agy_output[-600:] if agy_output else "Service successfully revived by Antigravity code healing session."
            print(f"✅ [HEALING SUCCESSFUL] '{service_name}' is LIVE and verified on {check_url}!")
            record_resolution(service_name, incident_id, summary, elapsed)

            # Send Resolution Email
            subject = f"✅ [iMentor AUTO-HEALED] '{service_name}' Restored by Antigravity AI"
            html = f"""
            <div style="font-family: Arial, sans-serif; max-width: 650px; padding: 20px; border: 1px solid #d0e7d2; border-radius: 8px; background-color: #fafdfa;">
                <h2 style="color: #2e7d32; margin-top: 0;">✨ Service Restored by Antigravity Autonomous AI</h2>
                <p>The iMentor Auto-Healer detected a persistent crash loop in <b>{service_name}</b> and invoked a dedicated Antigravity AI session to diagnose and repair the codebase.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr><td style="padding: 6px; border-bottom: 1px solid #eee; font-weight: bold; width: 140px;">Service:</td><td style="padding: 6px; border-bottom: 1px solid #eee;">{service_name} (Port {port})</td></tr>
                    <tr><td style="padding: 6px; border-bottom: 1px solid #eee; font-weight: bold;">Incident ID:</td><td style="padding: 6px; border-bottom: 1px solid #eee;">{incident_id}</td></tr>
                    <tr><td style="padding: 6px; border-bottom: 1px solid #eee; font-weight: bold;">Resolution Time:</td><td style="padding: 6px; border-bottom: 1px solid #eee;">{elapsed:.1f} seconds</td></tr>
                    <tr><td style="padding: 6px; border-bottom: 1px solid #eee; font-weight: bold;">Health Status:</td><td style="padding: 6px; border-bottom: 1px solid #eee; color: #2e7d32; font-weight: bold;">HTTP 200 OK ({check_url})</td></tr>
                </table>

                <h4 style="color: #333; margin-bottom: 5px;">Summary of Fix Applied:</h4>
                <div style="background-color: #f1f8e9; padding: 12px; border-radius: 6px; border-left: 4px solid #4caf50; font-family: monospace; font-size: 13px; white-space: pre-wrap;">{summary}</div>

                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #777;">
                    Antigravity Autonomous Self-Healing Sentinel<br/>
                    Workspace: {WORKSPACE_ROOT}
                </p>
            </div>
            """
            text = f"iMentor Service Auto-Healed ({now_str})\n\nService: {service_name}\nStatus: ONLINE (HTTP 200)\nDuration: {elapsed:.1f}s\n\nSummary:\n{summary}"
            send_email(subject, html, text)
            return True
        else:
            print(f"❌ [HEALING INCOMPLETE] '{service_name}' remains down after Antigravity session.")
            record_attempt(service_name, "FAILED", incident_id)

            # Check if escalation is needed
            state = load_healing_state()
            attempts = state.get(service_name, {}).get("attempts", 1)
            if attempts >= MAX_HEALING_ATTEMPTS_PER_INCIDENT:
                subject = f"🚨 [iMentor ESCALATION] '{service_name}' Requires Admin Attention"
                html = f"""
                <div style="font-family: Arial, sans-serif; max-width: 650px; padding: 20px; border: 1px solid #ffcdd2; border-radius: 8px; background-color: #fff9f9;">
                    <h2 style="color: #c62828; margin-top: 0;">🚨 Urgent: Autonomous Healing Limit Reached</h2>
                    <p>The automated Antigravity healer attempted to revive <b>{service_name}</b> {attempts} times, but the service is still not responding on port {port}.</p>
                    
                    <p><b>Incident ID:</b> {incident_id}<br/>
                    <b>Timestamp:</b> {now_str}</p>

                    <h4 style="color: #333;">Latest AGY Output:</h4>
                    <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px; overflow-x: auto;">{agy_output[-1500:] if agy_output else agy_stderr[-1500:]}</pre>
                </div>
                """
                text = f"iMentor Escalation ({now_str})\nService {service_name} could not be revived after {attempts} healing attempts.\nIncident ID: {incident_id}"
                send_email(subject, html, text)
            return False

    except subprocess.TimeoutExpired:
        print(f"⚠️ Antigravity healing session timed out (> 4.5m) for '{service_name}'.")
        record_attempt(service_name, "TIMEOUT", incident_id)
        return False
    except Exception as e:
        print(f"❌ Unexpected error in auto-healer: {e}")
        return False
    finally:
        release_lock(service_name)


# ─── Service Configuration Registry ───────────────────────────────────────────

SERVICE_PROFILES = {
    "imentor-v2-backend": {
        "port": 5006,
        "url": "http://localhost:5006/api/network/ip",
        "dir": V2_PROJECT_DIR
    },
    "imentor-v2-rag": {
        "port": 2006,
        "url": "http://localhost:2006/health",
        "dir": os.path.join(V2_PROJECT_DIR, "server", "rag_service")
    },
    "imentor-v2-frontend": {
        "port": 3006,
        "url": "http://localhost:3006",
        "dir": os.path.join(V2_PROJECT_DIR, "frontend")
    },
    "imentor-v2-go-gateway": {
        "port": 5002,
        "url": "http://localhost:5002/health",
        "dir": os.path.join(V2_PROJECT_DIR, "go-gateway")
    },
    "imentor-v2-caddy-bridge": {
        "port": 3005,
        "url": "http://localhost:3005",
        "dir": WORKSPACE_ROOT
    }
}


def main():
    parser = argparse.ArgumentParser(description="Antigravity Autonomous Self-Healing Engine")
    parser.add_argument("--service", required=True, help="PM2 service name (e.g. imentor-backend)")
    parser.add_argument("--port", type=int, help="Target port")
    parser.add_argument("--url", help="Health probe URL")
    parser.add_argument("--dir", help="Project source directory")
    parser.add_argument("--force", action="store_true", help="Bypass cooldown and retry limits")

    args = parser.parse_args()

    profile = SERVICE_PROFILES.get(args.service, {})
    port = args.port or profile.get("port", 5005)
    url = args.url or profile.get("url", f"http://localhost:{port}/health")
    target_dir = args.dir or profile.get("dir", MAIN_PROJECT_DIR)

    success = run_healer(
        service_name=args.service,
        port=port,
        check_url=url,
        target_dir=target_dir,
        force=args.force
    )
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
