#!/usr/bin/env python3
"""
Command-Line Interface to trigger the Course Creation Multi-Agent Swarm.
Usage:
  python3 course_bootstrap/build_course.py --code "EE3621" --name "Digital Signal Processing"
  python3 course_bootstrap/build_course.py --code "CS601" --name "Machine Learning"
  python3 course_bootstrap/build_course.py --code "EE2061" --name "Control Systems"
  python3 course_bootstrap/build_course.py --all-btech
"""

import sys
import os
import argparse

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from course_bootstrap.agents.course_orchestrator import CourseOrchestrator

CORE_BTECH_COURSES = [
    ("EE3621", "Digital Signal Processing", "Discrete-time signals, DTFT, Z-transform, DFT, FFT, Butterworth/Chebyshev IIR filter design, windowed FIR filters, finite wordlength effects"),
    ("CS601", "Machine Learning", "Supervised learning, Linear/Logistic regression, Decision trees, Random Forests, AdaBoost, XGBoost, SVMs, Kernel trick, K-Means, PCA, Neural networks, Backpropagation"),
    ("EE2061", "Control Systems", "LTI system modeling, transfer functions, block reduction, time response, Routh-Hurwitz, Root Locus, Bode plots, Nyquist criterion, State-Space analysis"),
    ("EE1011", "Basic Electrical Circuits", "Circuit elements, KVL, KCL, Nodal & Mesh analysis, Network theorems, AC sinusoidal steady-state, Series & Parallel resonance, Magnetic circuits"),
    ("EE1021", "Analog Electronics", "BJT & MOSFET amplifiers, small signal models, power amplifiers, operational amplifiers, active filters, feedback oscillators"),
    ("EE2021", "DC Machines and Transformers", "Electromechanical energy conversion, DC generators, DC motors, single-phase & three-phase transformers, testing and efficiency"),
    ("EE2031", "Power System Generation and Transmission", "Conventional & renewable generation, transmission line parameters, modeling, performance, traveling waves"),
    ("EE3011", "Power Electronics", "Power semiconductor devices, phase-controlled rectifiers, DC-DC buck/boost converters, PWM inverters, AC voltage controllers")
]

def main():
    parser = argparse.ArgumentParser(description="Trigger World-Class 3-Credit Course Creation Multi-Agent Swarm")
    parser.add_argument("--code", type=str, default="", help="Course code (e.g., EE3621, CS601, EE2061)")
    parser.add_argument("--name", type=str, help="Subject name (e.g., Digital Signal Processing, Deep Reinforcement Learning)")
    parser.add_argument("--syllabus", type=str, default="", help="Optional pasted syllabus text or file path")
    parser.add_argument("--description", type=str, default="", help="Optional course description")
    parser.add_argument("--all-btech", action="store_true", help="Generate all core B.Tech R24 courses automatically")

    args = parser.parse_args()
    orchestrator = CourseOrchestrator()

    if args.all_btech:
        print("==================================================================")
        print("🎓 Running Multi-Agent Course Generation for All Core B.Tech Courses")
        print("==================================================================")
        results = []
        for code, name, desc in CORE_BTECH_COURSES:
            res = orchestrator.build_course(code, name, description=desc)
            results.append(res)
        print("\n🎉 Batch generation complete! Generated courses:")
        for r in results:
            print(f"  • [{r['course_code']}] {r['subject_name']}: {r['total_lectures']} lectures | {r['total_labs']} labs | {r['total_questions']} Qs | Quality: {r['quality_score']}/100 | Portal: {r['interactive_portal']}")
        return

    if not args.name:
        print("❌ Error: Please specify --name (Course Title) or use --all-btech.")
        sys.exit(1)

    course_code = args.code
    if not course_code:
        # Auto-derive course code from words in title
        words = [w[0].upper() for w in args.name.split() if w.isalnum()]
        course_code = "".join(words[:4]) + "301"

    raw_syllabus = args.syllabus
    if raw_syllabus and os.path.isfile(raw_syllabus):
        with open(raw_syllabus, "r", encoding="utf-8") as f:
            raw_syllabus = f.read()

    res = orchestrator.build_course(course_code, args.name, raw_syllabus=raw_syllabus, description=args.description)
    print("\n==================================================================")
    print(f"🎉 World-Class 3-Credit Course [{res['course_code']}] {res['subject_name']} Successfully Generated!")
    print(f"  • Academic Quality Score: {res['quality_score']}/100 (Pass: {res['audit_passed']})")
    print(f"  • Total Subtopic Lectures: {res['total_lectures']} (KaTeX + Mermaid + Numerical Proofs)")
    print(f"  • Total Modules / Units:   {res['modules_count']}")
    print(f"  • Hands-on Industry Labs:  {res['total_labs']} + Capstone Project ({res['capstone_path']})")
    print(f"  • Concept Question Bank:   {res['total_questions']} Diagnostic Questions ({res['cqb_json']})")
    print(f"  • Semantic Graph (STN):    {res['stn_nodes']} nodes, {res['stn_edges']} edges")
    print(f"  • Syllabus CSV Path:       {res['syllabus_csv']}")
    print(f"  • Interactive Web Portal:  {res['interactive_portal']}")
    print("==================================================================")

if __name__ == "__main__":
    main()

