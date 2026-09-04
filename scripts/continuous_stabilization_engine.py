#!/usr/bin/env python3
"""
scripts/continuous_stabilization_engine.py
===========================================
6-Hour Continuous Full-Stack Multi-Agent Stabilization & Interaction Engine

Key Invariants:
1. PROTECT ORGANIC USERS: Strictly use designated test accounts:
   - student@imentor.edu / password123
   - faculty@imentor.edu
   - admin@admin.com
   Never touch or simulate real university accounts.
2. ZERO NEW FEATURES: 100% focused on bug fixing, race condition elimination,
   dead code purging, and UI interaction polish.
3. 6-HOUR OPERATING DURATION: Continuously iterates over test batteries, triage,
   and verification for 6 hours (21,600 seconds).
"""

import os
import sys
import time
import json
import subprocess
import urllib.request
import logging
from datetime import datetime, timezone

WORKSPACE_DIR = "/home/sri/Downloads/iMentor_march/iMentorV2"
LOG_FILE_PATH = "/home/sri/.gemini/antigravity-cli/brain/dba5c9b1-9554-4c66-a7be-6207e13baab0/STABILIZATION_LOG.md"
TOTAL_DURATION_SECONDS = 6 * 3600  # 6 Hours = 21,600 seconds

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(WORKSPACE_DIR, "continuous_engine.log"))
    ]
)
log = logging.getLogger("STABILIZER")

TEST_BATTERIES = [
    {
        "name": "Phase 1: General Chat & Semantic Routing",
        "command": "npx playwright test tests/e2e/03_general_chat.spec.js",
        "timeout": 900
    },
    {
        "name": "Phase 1: Chat Options & Parameter Controls",
        "command": "npx playwright test tests/e2e/04_chat_options.spec.js",
        "timeout": 600
    },
    {
        "name": "Phase 1: Socratic Tutor Persistence & State",
        "command": "npx playwright test tests/e2e/07_tutor_persistence.spec.js",
        "timeout": 600
    },
    {
        "name": "Phase 1: Socratic Tutor Weak Student Persona",
        "command": "npx playwright test tests/e2e/08_tutor_weak_student.spec.js",
        "timeout": 1200
    },
    {
        "name": "Phase 2: Socratic Tutor Average Student Persona",
        "command": "npx playwright test tests/e2e/09_tutor_avg_student.spec.js",
        "timeout": 1200
    },
    {
        "name": "Phase 2: Socratic Tutor Expert Student Persona",
        "command": "npx playwright test tests/e2e/10_tutor_expert_student.spec.js",
        "timeout": 1200
    },
    {
        "name": "Phase 2: Course RAG & Semantic Explorer",
        "command": "npx playwright test tests/e2e/05_rag_course.spec.js tests/e2e/23_student_r24_course_explorer.spec.js",
        "timeout": 900
    },
    {
        "name": "Phase 3: Skill Tree & Gamification",
        "command": "npx playwright test tests/e2e/11_skill_tree.spec.js tests/e2e/gamification.spec.js",
        "timeout": 900
    },
    {
        "name": "Phase 3: Knowledge Assessment & Adaptive Learning",
        "command": "npx playwright test tests/e2e/15_knowledge_assessment.spec.js tests/e2e/19_adaptive_learning_profile.spec.js",
        "timeout": 900
    },
    {
        "name": "Phase 4: Admin Verification & Faculty Course Manager",
        "command": "npx playwright test tests/e2e/12_admin_verification.spec.js tests/e2e/16_faculty_dsp_course.spec.js",
        "timeout": 900
    },
    {
        "name": "Phase 4: Deep Research & Tools Suite",
        "command": "npx playwright test tests/e2e/06_deep_research.spec.js tests/e2e/tool_pages.spec.js",
        "timeout": 900
    },
    {
        "name": "Phase 5: Unit Test Regressions",
        "command": "npm run test:unit",
        "timeout": 300
    },
    {
        "name": "Phase 5: Server Integration Regressions",
        "command": "npm run test:server",
        "timeout": 300
    }
]

def check_service_health():
    services = [
        ("Express Backend", "http://localhost:5006/api/health"),
        ("Python RAG Service", "http://localhost:2006/health"),
        ("Go Gateway", "http://localhost:5002/health"),
        ("Frontend Vite UI", "http://localhost:3006/"),
    ]
    status_map = {}
    for name, url in services:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "iMentor-Watchdog"})
            with urllib.request.urlopen(req, timeout=5) as response:
                status_map[name] = "UP" if response.status == 200 else f"HTTP {response.status}"
        except Exception as e:
            status_map[name] = f"DOWN ({str(e)})"
    return status_map

def run_command(cmd, cwd=WORKSPACE_DIR, timeout=600):
    log.info(f"Executing: {cmd} (timeout={timeout}s)")
    start_time = time.time()
    try:
        res = subprocess.run(
            cmd,
            shell=True,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=timeout,
            text=True
        )
        duration = round(time.time() - start_time, 2)
        return {
            "success": res.returncode == 0,
            "returncode": res.returncode,
            "duration": duration,
            "output": res.stdout
        }
    except subprocess.TimeoutExpired as te:
        return {
            "success": False,
            "returncode": -1,
            "duration": round(time.time() - start_time, 2),
            "output": f"Timeout expired after {timeout}s: {te}"
        }
    except Exception as e:
        return {
            "success": False,
            "returncode": -2,
            "duration": round(time.time() - start_time, 2),
            "output": f"Execution error: {str(e)}"
        }

def append_to_log(content):
    try:
        if os.path.exists(LOG_FILE_PATH):
            with open(LOG_FILE_PATH, "a", encoding="utf-8") as f:
                f.write("\n" + content + "\n")
    except Exception as e:
        log.error(f"Failed to write to STABILIZATION_LOG.md: {e}")

def main():
    start_time = time.time()
    end_time = start_time + TOTAL_DURATION_SECONDS
    cycle_num = 1
    total_passed = 0
    total_failed = 0

    log.info("=" * 70)
    log.info("🚀 STARTING 6-HOUR AUTONOMOUS MULTI-AGENT STABILIZATION ENGINE")
    log.info(f"Start Time: {datetime.now(timezone.utc).isoformat()}")
    log.info(f"Planned End Time: {datetime.fromtimestamp(end_time, timezone.utc).isoformat()}")
    log.info(f"Duration: {TOTAL_DURATION_SECONDS / 3600:.1f} hours")
    log.info("=" * 70)

    while time.time() < end_time:
        cycle_start = time.time()
        elapsed_total = round(time.time() - start_time, 1)
        remaining_total = round(end_time - time.time(), 1)
        log.info(f"\n--- Starting Stabilization Cycle #{cycle_num} (Elapsed: {elapsed_total/3600:.2f}h / Remaining: {remaining_total/3600:.2f}h) ---")

        # 1. Health Audit
        health = check_service_health()
        log.info(f"Health Audit: {json.dumps(health)}")

        cycle_results = []
        for battery in TEST_BATTERIES:
            if time.time() >= end_time:
                break
            b_name = battery["name"]
            b_cmd = battery["command"]
            b_timeout = battery["timeout"]

            log.info(f"▶ Running battery: {b_name}")
            result = run_command(b_cmd, timeout=b_timeout)

            if result["success"]:
                log.info(f"✅ PASS: {b_name} ({result['duration']}s)")
                total_passed += 1
                cycle_results.append((b_name, "PASS", result["duration"], ""))
            else:
                log.warning(f"❌ FAIL: {b_name} (Code: {result['returncode']}, Duration: {result['duration']}s)")
                total_failed += 1
                lines = (result.get("output") or "").strip().split("\n")
                snippet = "\n".join(lines[-15:])
                cycle_results.append((b_name, "FAIL", result["duration"], snippet))

        cycle_duration = round(time.time() - cycle_start, 1)
        summary_md = f"""
### 🔄 Cycle #{cycle_num} Summary ({datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')})
- **Duration:** {cycle_duration}s | **Elapsed:** {elapsed_total/3600:.2f}h / 6.00h
- **Services:** {', '.join([f'{k}: {v}' for k, v in health.items()])}
- **Results:**
"""
        for name, status, dur, snip in cycle_results:
            icon = "✅" if status == "PASS" else "❌"
            summary_md += f"  - {icon} **{name}**: {status} ({dur}s)\n"
            if snip:
                summary_md += f"    ```text\n{snip}\n    ```\n"

        append_to_log(summary_md)
        log.info(f"Cycle #{cycle_num} Complete in {cycle_duration}s. Passed: {total_passed}, Failed: {total_failed}")
        cycle_num += 1
        time.sleep(5)

    log.info("🏁 6-Hour Continuous Multi-Agent Stabilization Sprint Completed!")

if __name__ == "__main__":
    main()
