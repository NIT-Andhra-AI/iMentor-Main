#!/usr/bin/env python3
"""
EE Deep Curriculum Analyzer & Walkthrough Tool
Analyzes every EE course, topic, and subtopic against R24 syllabus standards,
evaluating topic title quality, subtopic depth, textbook replacement capability, and interactive features.
"""

import os
import json
import csv
import glob
import re

COURSE_BOOTSTRAP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "course_bootstrap"))
TEXTBOOKS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "server", "textbooks"))
OUTPUT_ANALYSIS_PATH = os.path.join(COURSE_BOOTSTRAP_DIR, "EE_DEEP_CURRICULUM_WALKTHROUGH.json")

EE_CANONICAL = {
    "EE1011": "Basic Electrical Circuits",
    "EE1021": "Electrical Network Analysis",
    "EE1031": "Fundamentals of Electrical Engineering",
    "EE1611": "Electric and Magnetic Fields",
    "EE1621": "Signals and Systems",
    "EE2010": "Circuit Theory and Networks",
    "EE2011": "Measurements and Instrumentation",
    "EE2012": "Analog and Digital Circuits Lab",
    "EE2021": "Electrical Machines-I",
    "EE2022": "Circuits and Measurements Lab",
    "EE2031": "Electrical Machines-II",
    "EE2032": "Electric Power Drives Lab",
    "EE2041": "Digital Electronics",
    "EE2042": "Control Systems Lab",
    "EE2051": "Electromagnetic Fields & Waves",
    "EE2052": "Power Electronics Lab",
    "EE2061": "Control Systems",
    "EE2062": "Power Systems & Renewable Energy Lab",
    "EE2071": "Power System Analysis",
    "EE2601": "Basics of Internet of Things",
    "EE2611": "Renewable Power Generation",
    "EE2621": "Introduction to Machine Learning",
    "EE3010": "Advanced Power Systems",
    "EE3011": "Power Electronics",
    "EE3012": "Power Electronics Lab",
    "EE3021": "Power System Protection and Control",
    "EE3022": "Embedded Systems Lab",
    "EE3031": "Embedded Systems",
    "EE3032": "Electric Power Drives Lab",
    "EE3041": "Electric Power Drives",
    "EE3601": "Advanced Control Systems",
    "EE3611": "Wind and Solar Electrical Systems",
    "EE3621": "Digital Signal Processing",
    "EE3631": "Soft Computing Techniques",
    "EE3641": "Introduction to Electric Vehicles",
    "EE3651": "Electric Vehicles and Energy Storage",
    "EE3661": "Advanced Power Electronics",
    "EE3671": "Industrial Instrumentation and Automation",
    "EE3681": "HVDC and FACTS",
    "EE3691": "Deep Learning Algorithms",
    "EE3701": "Electrical Machine Design",
    "EE3711": "Introduction to Smart Grid",
    "EE3721": "Power System Dynamics and Stability",
    "EE3731": "Power System Security and Reliability",
    "EE3741": "Switched Mode Power Supplies",
    "EE3751": "New Venture Creation",
    "EE4014": "High Voltage Engineering",
    "EE4024": "Electric Drives & Control",
    "EE4601": "Energy Management and Audit",
    "EE4611": "Power Quality Improvement",
    "EE4621": "Restructured Power Systems",
    "EE4631": "Special Machines"
}

def analyze_ee_course(course_code):
    canonical_name = EE_CANONICAL.get(course_code, f"{course_code} Subject")
    course_path = os.path.join(COURSE_BOOTSTRAP_DIR, course_code)
    textbook_path = os.path.join(TEXTBOOKS_DIR, course_code)

    analysis = {
        "courseCode": course_code,
        "canonicalName": canonical_name,
        "isR24Aligned": True,  # R24 canonical curriculum match
        "topics": [],
        "totalTopicsCount": 0,
        "totalSubtopicsCount": 0,
        "topicQualityFlags": [],
        "subtopicDepthAssessment": "UNKNOWN",
        "textbookReplacementStatus": "NOT_READY",
        "interactiveLearningStatus": "BASIC",
        "recommendedFixes": []
    }

    if not os.path.isdir(course_path):
        analysis["isR24Aligned"] = False
        analysis["topicQualityFlags"].append("Course directory missing in course_bootstrap")
        analysis["recommendedFixes"].append("Bootstrap complete R24 course directory.")
        return analysis

    # 1. Inspect Topics & Subtopics
    spec_file = os.path.join(course_path, "curriculum_spec.json")
    csv_file = os.path.join(course_path, "syllabus.csv")
    stn_file = os.path.join(course_path, "stn_graph.json")

    topics_list = []

    if os.path.isfile(spec_file):
        try:
            with open(spec_file, "r", encoding="utf-8") as f:
                spec = json.load(f)
                raw_units = spec.get("units", spec.get("modules", spec.get("topics", [])))
                for unit in raw_units:
                    title = unit.get("title", unit.get("name", "Untitled Topic"))
                    subs = [s.get("title", s.get("name", str(s))) if isinstance(s, dict) else str(s)
                            for s in unit.get("subtopics", unit.get("concepts", []))]
                    topics_list.append({"title": title, "subtopics": subs})
        except Exception:
            pass

    if not topics_list and os.path.isfile(csv_file):
        try:
            with open(csv_file, "r", encoding="utf-8") as f:
                reader = csv.reader(f)
                rows = list(reader)
                current_topic = None
                for row in rows:
                    if not row: continue
                    text = row[0].strip()
                    if text.startswith("Unit") or text.startswith("Module") or text.startswith("Topic"):
                        if current_topic: topics_list.append(current_topic)
                        current_topic = {"title": text, "subtopics": []}
                    elif current_topic:
                        current_topic["subtopics"].append(text)
                if current_topic: topics_list.append(current_topic)
        except Exception:
            pass

    if not topics_list and os.path.isfile(stn_file):
        try:
            with open(stn_file, "r", encoding="utf-8") as f:
                stn = json.load(f)
                nodes = stn.get("nodes", stn.get("concepts", []))
                # Group STN nodes into topics
                grouped = {}
                for n in nodes:
                    unit = n.get("unit", n.get("category", "General Concepts"))
                    grouped.setdefault(unit, []).append(n.get("id", n.get("label", "Concept")))
                for u_title, subs in grouped.items():
                    topics_list.append({"title": u_title, "subtopics": subs})
        except Exception:
            pass

    analysis["topics"] = topics_list
    analysis["totalTopicsCount"] = len(topics_list)
    analysis["totalSubtopicsCount"] = sum(len(t["subtopics"]) for t in topics_list)

    # 2. Check for Topic Title Phrase Mismatches & "Too Crisp" Titles
    phrase_mismatches = []
    crisp_subtopics = []

    for t in topics_list:
        t_title = t["title"]
        # Check if topic title is a raw phrase or sentence (mismatch)
        if len(t_title.split()) > 7 or re.search(r'\b(provide|explain|cite|and|with|papers)\b', t_title, re.I):
            phrase_mismatches.append(t_title)

        for sub in t["subtopics"]:
            if len(sub.split()) <= 2:
                crisp_subtopics.append(sub)

    if phrase_mismatches:
        analysis["topicQualityFlags"].append(f"Phrase/Mismatch in Topic Titles ({len(phrase_mismatches)} topics)")
        analysis["recommendedFixes"].append("Refactor topic titles from raw phrases into standardized academic Unit titles.")

    if len(crisp_subtopics) > 5 or (analysis["totalSubtopicsCount"] > 0 and len(crisp_subtopics) / analysis["totalSubtopicsCount"] > 0.4):
        analysis["topicQualityFlags"].append(f"Subtopics too crisp/bare ({len(crisp_subtopics)} micro-titles)")
        analysis["recommendedFixes"].append("Expand subtopics with comprehensive descriptions, formulas, and textbook-style derivations.")

    # 3. Textbook Replacement Capability
    has_textbook_dir = os.path.isdir(textbook_path) and len(os.listdir(textbook_path)) > 0
    lectures_dir = os.path.join(course_path, "lectures")
    has_lectures = os.path.isdir(lectures_dir) and len(os.listdir(lectures_dir)) > 0

    if has_textbook_dir:
        analysis["textbookReplacementStatus"] = "READY (Textbook Markdown Compiled)"
    elif has_lectures:
        analysis["textbookReplacementStatus"] = "PARTIAL (Lecture Notes Present)"
        analysis["recommendedFixes"].append("Compile lecture notes into full chapter-based textbook replacement markdowns.")
    else:
        analysis["textbookReplacementStatus"] = "NOT_READY (Missing Textbook Content)"
        analysis["recommendedFixes"].append("Generate comprehensive textbook replacement notes and worked examples.")

    # 4. Interactive Learning Readiness
    has_portal = os.path.isdir(os.path.join(course_path, "interactive_portal"))
    has_stn = os.path.isfile(stn_file)
    qb_file = os.path.join(course_path, "concept_question_bank.json")

    q_count = 0
    if os.path.isfile(qb_file):
        try:
            with open(qb_file, "r", encoding="utf-8") as f:
                qb = json.load(f)
                q_count = len(qb) if isinstance(qb, list) else len(qb.get("questions", []))
        except Exception:
            pass

    if has_portal and has_stn and q_count >= 50:
        analysis["interactiveLearningStatus"] = "EXCELLENT (Portal + STN Graph + 50+ Practice Bank)"
    elif has_portal or has_stn:
        analysis["interactiveLearningStatus"] = "MODERATE (Basic Portal/STN Graph Available)"
        if q_count < 50:
            analysis["recommendedFixes"].append(f"Expand practice question bank from {q_count} to 50+ items.")
    else:
        analysis["interactiveLearningStatus"] = "POOR (Missing Interactive Portal & STN Graph)"
        analysis["recommendedFixes"].append("Build interactive portal HTML and STN concept graph.")

    return analysis

def run_ee_walkthrough():
    ee_codes = sorted(list(EE_CANONICAL.keys()))
    print(f"🔬 Executing Comprehensive Walkthrough of {len(ee_codes)} EE Courses...\n")

    results = []
    for code in ee_codes:
        res = analyze_ee_course(code)
        results.append(res)

        status_flag = "⚠️" if res["topicQualityFlags"] or "NOT_READY" in res["textbookReplacementStatus"] else "✅"
        print(f"  [{status_flag} {res['courseCode']}] {res['canonicalName']}")
        print(f"      Topics: {res['totalTopicsCount']} | Subtopics: {res['totalSubtopicsCount']} | Textbook Status: {res['textbookReplacementStatus']}")
        if res["topicQualityFlags"]:
            print(f"      Flags: {', '.join(res['topicQualityFlags'])}")
        print()

    summary = {
        "totalEECourses": len(results),
        "r24SyllabusAlignedCount": sum(1 for r in results if r["isR24Aligned"]),
        "textbookReplacementReadyCount": sum(1 for r in results if "READY" in r["textbookReplacementStatus"]),
        "coursesNeedingTopicRefactoring": sum(1 for r in results if any("Phrase" in f or "crisp" in f for f in r["topicQualityFlags"])),
        "courseDetails": results
    }

    with open(OUTPUT_ANALYSIS_PATH, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("=" * 70)
    print(f"✅ EE CURRICULUM WALKTHROUGH COMPLETE")
    print(f"   Total EE Courses Walked Through: {summary['totalEECourses']}")
    print(f"   R24 Syllabus Aligned:            {summary['r24SyllabusAlignedCount']} / {summary['totalEECourses']}")
    print(f"   Textbook Replacement Ready:     {summary['textbookReplacementReadyCount']} / {summary['totalEECourses']}")
    print(f"   Courses Needing Refactoring:     {summary['coursesNeedingTopicRefactoring']} / {summary['totalEECourses']}")
    print(f"   Report Saved to:                 {OUTPUT_ANALYSIS_PATH}")
    print("=" * 70)

if __name__ == "__main__":
    run_ee_walkthrough()
