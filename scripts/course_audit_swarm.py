#!/usr/bin/env python3
"""
Course Audit Swarm (50+ Concurrent Course Auditor Agents)
Analyzes topics, subtopics, content depth, STN graphs, question banks, and resources across all courses.
Curates courses that need attention and specifies the exact type of improvement needed.
"""

import os
import json
import csv
import glob
from concurrent.futures import ThreadPoolExecutor, as_completed

COURSE_BOOTSTRAP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "course_bootstrap"))
OUTPUT_REPORT_PATH = os.path.join(COURSE_BOOTSTRAP_DIR, "COURSE_SWARM_AUDIT_REPORT.json")

def audit_single_course(course_code):
    """
    Agent worker function: Audits topic, subtopic, content depth, STN graph,
    question bank size, and resources for a single course.
    """
    course_path = os.path.join(COURSE_BOOTSTRAP_DIR, course_code)
    audit_data = {
        "courseCode": course_code,
        "topicsCount": 0,
        "subtopicsCount": 0,
        "contentFilesCount": 0,
        "stnNodesCount": 0,
        "questionCount": 0,
        "hasCurriculumSpec": False,
        "hasStnGraph": False,
        "hasInteractivePortal": False,
        "hasFacultyDashboard": False,
        "hasResources": False,
        "healthScore": 100,
        "attentionNeeded": False,
        "attentionFlags": [],
        "improvementRecommendations": []
    }

    if not os.path.isdir(course_path):
        return audit_data

    # 1. Topic & Subtopic Analysis (curriculum_spec.json / syllabus.csv)
    spec_file = os.path.join(course_path, "curriculum_spec.json")
    csv_file = os.path.join(course_path, "syllabus.csv")

    if os.path.isfile(spec_file):
        audit_data["hasCurriculumSpec"] = True
        try:
            with open(spec_file, "r", encoding="utf-8") as f:
                spec = json.load(f)
                units = spec.get("units", spec.get("modules", spec.get("topics", [])))
                audit_data["topicsCount"] = len(units)
                sub_count = 0
                for u in units:
                    subs = u.get("subtopics", u.get("concepts", []))
                    sub_count += len(subs)
                audit_data["subtopicsCount"] = sub_count
        except Exception as e:
            audit_data["attentionFlags"].append("Corrupted curriculum_spec.json")
    elif os.path.isfile(csv_file):
        try:
            with open(csv_file, "r", encoding="utf-8") as f:
                reader = csv.reader(f)
                rows = list(reader)
                audit_data["topicsCount"] = max(1, len(rows) // 3)
                audit_data["subtopicsCount"] = len(rows)
        except Exception:
            pass
    else:
        audit_data["attentionFlags"].append("Missing Curriculum Spec / Syllabus")
        audit_data["healthScore"] -= 20

    # 2. STN Graph Analysis
    stn_file = os.path.join(course_path, "stn_graph.json")
    if os.path.isfile(stn_file):
        audit_data["hasStnGraph"] = True
        try:
            with open(stn_file, "r", encoding="utf-8") as f:
                stn = json.load(f)
                nodes = stn.get("nodes", stn.get("concepts", []))
                audit_data["stnNodesCount"] = len(nodes)
                if len(nodes) < 5:
                    audit_data["attentionFlags"].append(f"Low STN Node Count ({len(nodes)} nodes)")
                    audit_data["healthScore"] -= 15
        except Exception:
            audit_data["attentionFlags"].append("Corrupted stn_graph.json")
            audit_data["healthScore"] -= 15
    else:
        audit_data["attentionFlags"].append("Missing STN Graph")
        audit_data["healthScore"] -= 25

    # 3. Question Bank Analysis
    qb_file = os.path.join(course_path, "concept_question_bank.json")
    study_q_dir = os.path.join(course_path, "_study_questions")
    q_count = 0

    if os.path.isfile(qb_file):
        try:
            with open(qb_file, "r", encoding="utf-8") as f:
                qb = json.load(f)
                if isinstance(qb, list):
                    q_count += len(qb)
                elif isinstance(qb, dict):
                    q_count += len(qb.get("questions", []))
        except Exception:
            pass

    if os.path.isdir(study_q_dir):
        q_files = glob.glob(os.path.join(study_q_dir, "*.json"))
        q_count += len(q_files) * 5

    audit_data["questionCount"] = q_count
    if q_count < 10:
        audit_data["attentionFlags"].append(f"Small Question Bank ({q_count} questions)")
        audit_data["healthScore"] -= 20

    # 4. Interactive Portal & Dashboard
    portal_dir = os.path.join(course_path, "interactive_portal")
    dash_file = os.path.join(course_path, "faculty_dashboard.html")

    if os.path.isdir(portal_dir) and len(os.listdir(portal_dir)) > 0:
        audit_data["hasInteractivePortal"] = True
    else:
        audit_data["attentionFlags"].append("Missing Interactive Portal")
        audit_data["healthScore"] -= 15

    if os.path.isfile(dash_file):
        audit_data["hasFacultyDashboard"] = True
    else:
        audit_data["attentionFlags"].append("Missing Faculty Dashboard")
        audit_data["healthScore"] -= 10

    # 5. Content Files (Lectures, Labs, Textbooks)
    lectures_dir = os.path.join(course_path, "lectures")
    labs_dir = os.path.join(course_path, "labs")
    content_files = 0

    if os.path.isdir(lectures_dir):
        content_files += len(os.listdir(lectures_dir))
    if os.path.isdir(labs_dir):
        content_files += len(os.listdir(labs_dir))

    audit_data["contentFilesCount"] = content_files
    if content_files == 0:
        audit_data["attentionFlags"].append("No Lecture/Lab Content Files Found")
        audit_data["healthScore"] -= 15

    # 6. Resources
    res_file = os.path.join(course_path, "resources.json")
    if os.path.isfile(res_file):
        audit_data["hasResources"] = True

    # Finalize Health & Recommendations
    audit_data["healthScore"] = max(0, audit_data["healthScore"])
    if audit_data["healthScore"] < 85:
        audit_data["attentionNeeded"] = True

    # Generate specific recommendations
    rec = []
    if not audit_data["hasStnGraph"] or audit_data["stnNodesCount"] < 5:
        rec.append("Synthesize complete Semantic Topic Network (STN) graph with dependency edges.")
    if audit_data["questionCount"] < 15:
        rec.append(f"Generate massive question bank (expand current count from {audit_data['questionCount']} to 50+ items).")
    if audit_data["subtopicsCount"] < 10:
        rec.append("Decompose curriculum into deeper subtopic units and micro-concept nodes.")
    if not audit_data["hasInteractivePortal"]:
        rec.append("Build interactive student learning portal HTML scaffold.")
    if content_files == 0:
        rec.append("Add structured lecture slides, markdown notes, or lab exercises.")

    audit_data["improvementRecommendations"] = rec if rec else ["Maintain current high-quality curriculum state."]
    return audit_data

def run_agent_swarm():
    """
    Spawns 50+ concurrent worker agents, each dedicated to evaluating one course.
    """
    course_dirs = [d for d in os.listdir(COURSE_BOOTSTRAP_DIR)
                   if os.path.isdir(os.path.join(COURSE_BOOTSTRAP_DIR, d)) and not d.startswith(".") and d != "__pycache__" and d != "agents"]

    course_dirs.sort()
    num_courses = len(course_dirs)
    max_workers = min(64, max(50, num_courses))

    print(f"🚀 Spawning Swarm of {max_workers} Course Auditor Agents to evaluate {num_courses} courses...\n")

    audit_results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_course = {executor.submit(audit_single_course, c): c for c in course_dirs}
        for future in as_completed(future_to_course):
            course = future_to_course[future]
            try:
                data = future.result()
                audit_results.append(data)
                status_icon = "⚠️" if data["attentionNeeded"] else "✅"
                print(f"  [{status_icon} Agent-{course}] Health Score: {data['healthScore']}% | Topics: {data['topicsCount']}, Subtopics: {data['subtopicsCount']}, Questions: {data['questionCount']}")
            except Exception as exc:
                print(f"  ❌ Agent-{course} generated an exception: {exc}")

    audit_results.sort(key=lambda x: x["healthScore"])

    attention_courses = [c for c in audit_results if c["attentionNeeded"]]
    healthy_courses = [c for c in audit_results if not c["attentionNeeded"]]

    summary = {
        "totalCoursesAudited": len(audit_results),
        "coursesNeedingAttentionCount": len(attention_courses),
        "healthyCoursesCount": len(healthy_courses),
        "averageHealthScore": round(sum(c["healthScore"] for c in audit_results) / len(audit_results), 1) if audit_results else 0,
        "coursesNeedingAttention": attention_courses,
        "healthyCourses": healthy_courses
    }

    with open(OUTPUT_REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"\n==================================================================")
    print(f"🎯 SWARM AUDIT COMPLETE")
    print(f"   Total Courses Audited: {summary['totalCoursesAudited']}")
    print(f"   Courses Needing Attention: {summary['coursesNeedingAttentionCount']}")
    print(f"   Healthy Courses: {summary['healthyCoursesCount']}")
    print(f"   Average Health Score: {summary['averageHealthScore']}%")
    print(f"   Full Report Saved to: {OUTPUT_REPORT_PATH}")
    print(f"==================================================================")

if __name__ == "__main__":
    run_agent_swarm()
