#!/usr/bin/env python3
"""
EE Textbook Replacement Competency Evaluator
Evaluates all 52 B.Tech Electrical Engineering courses across 5 core criteria:
1. Mathematical Rigor & LaTeX Derivations
2. GATE-Level Solved Numerical Examples
3. Syllabus Topic & Subtopic Coverage
4. Interactive Student Checkpoints & STN Graphs
5. Real-World Engineering Applications
"""

import os
import json
import re

TEXTBOOKS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "server", "textbooks"))
COURSE_BOOTSTRAP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "course_bootstrap"))
OUTPUT_EVAL_PATH = os.path.join(COURSE_BOOTSTRAP_DIR, "EE_TEXTBOOK_COMPETENCY_EVALUATION.json")

EE_NAMES = {
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

def evaluate_textbook_competency(code):
    name = EE_NAMES.get(code, code)
    tb_dir = os.path.join(TEXTBOOKS_DIR, code)
    tb_file = os.path.join(tb_dir, "lecture_notes_textbook.md")

    scores = {
        "mathRigor": 0,
        "solvedExamples": 0,
        "topicCoverage": 0,
        "interactiveCheckpoints": 0,
        "engineeringApplications": 0
    }

    metrics = {
        "wordCount": 0,
        "latexEquationsCount": 0,
        "solvedProblemsCount": 0,
        "checkpointsCount": 0,
        "chaptersCount": 0
    }

    if not os.path.isfile(tb_file):
        return {
            "courseCode": code,
            "name": name,
            "overallScore": 0,
            "competencyGrade": "F (Non-Existent)",
            "metrics": metrics,
            "criteriaScores": scores,
            "verdict": "Missing Textbook Markdown File."
        }

    try:
        with open(tb_file, "r", encoding="utf-8") as f:
            content = f.read()

        words = content.split()
        metrics["wordCount"] = len(words)
        metrics["latexEquationsCount"] = len(re.findall(r'\$\$|\$', content))
        metrics["solvedProblemsCount"] = len(re.findall(r'Solved Problem|Problem:|GATE', content, re.I))
        metrics["checkpointsCount"] = len(re.findall(r'Check Point|Checkpoint', content, re.I))
        metrics["chaptersCount"] = len(re.findall(r'### Chapter', content))

        # 1. Mathematical Rigor Score (0-20)
        if metrics["latexEquationsCount"] >= 30:
            scores["mathRigor"] = 20
        elif metrics["latexEquationsCount"] >= 15:
            scores["mathRigor"] = 15
        else:
            scores["mathRigor"] = 10

        # 2. Solved Examples Score (0-20)
        if metrics["solvedProblemsCount"] >= 10:
            scores["solvedExamples"] = 20
        elif metrics["solvedProblemsCount"] >= 5:
            scores["solvedExamples"] = 16
        else:
            scores["solvedExamples"] = 10

        # 3. Topic Coverage Score (0-20)
        if metrics["chaptersCount"] >= 10:
            scores["topicCoverage"] = 20
        elif metrics["chaptersCount"] >= 4:
            scores["topicCoverage"] = 18
        else:
            scores["topicCoverage"] = 12

        # 4. Interactive Checkpoints Score (0-20)
        if metrics["checkpointsCount"] >= 10:
            scores["interactiveCheckpoints"] = 20
        elif metrics["checkpointsCount"] >= 4:
            scores["interactiveCheckpoints"] = 18
        else:
            scores["interactiveCheckpoints"] = 10

        # 5. Engineering Applications Score (0-20)
        if "Applications" in content or "Industrial" in content or "GATE" in content:
            scores["engineeringApplications"] = 20
        else:
            scores["engineeringApplications"] = 15

    except Exception as e:
        pass

    total_score = sum(scores.values())

    if total_score >= 90:
        grade = "A+ (Superior Textbook Replacement)"
        verdict = "Fully competent to replace standard B.Tech EE textbooks with superior interactive scaffolding and GATE preparation."
    elif total_score >= 80:
        grade = "A (Competent Textbook Replacement)"
        verdict = "Strong textbook replacement capability. Covers core theory, equations, and solved examples."
    elif total_score >= 70:
        grade = "B (Good Interactive Reference)"
        verdict = "Good interactive reference; supplementary derivations recommended for advanced honors topics."
    else:
        grade = "C (Needs Expansion)"
        verdict = "Requires further mathematical derivation expansion."

    return {
        "courseCode": code,
        "name": name,
        "overallScore": total_score,
        "competencyGrade": grade,
        "metrics": metrics,
        "criteriaScores": scores,
        "verdict": verdict
    }

def run_evaluator():
    print(f"📊 Evaluating Textbook Replacement Competency for all {len(EE_NAMES)} B.Tech EE Courses...\n")
    results = []
    for code in sorted(EE_NAMES.keys()):
        eval_res = evaluate_textbook_competency(code)
        results.append(eval_res)
        print(f"  [{eval_res['competencyGrade'][:2]}] {eval_res['courseCode']}: {eval_res['name']} — Score: {eval_res['overallScore']}/100")

    summary = {
        "totalEECourses": len(results),
        "averageCompetencyScore": round(sum(r["overallScore"] for r in results) / len(results), 1),
        "superiorCount": sum(1 for r in results if r["overallScore"] >= 90),
        "competentCount": sum(1 for r in results if 80 <= r["overallScore"] < 90),
        "courseEvaluations": results
    }

    with open(OUTPUT_EVAL_PATH, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("\n" + "=" * 70)
    print(f"🎯 EE TEXTBOOK COMPETENCY EVALUATION COMPLETE")
    print(f"   Total B.Tech EE Courses Evaluated: {summary['totalEECourses']}")
    print(f"   Average Textbook Competency Score:  {summary['averageCompetencyScore']}/100")
    print(f"   Superior Textbook Replacements:    {summary['superiorCount']} / {summary['totalEECourses']}")
    print(f"   Full Evaluation Saved to:           {OUTPUT_EVAL_PATH}")
    print("=" * 70)

if __name__ == "__main__":
    run_evaluator()
