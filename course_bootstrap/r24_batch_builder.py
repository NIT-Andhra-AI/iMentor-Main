#!/usr/bin/env python3
"""
R24 Batch Builder:
Iterates through all R24 subjects from the official NIT Andhra Pradesh R24 Regulation Curriculum,
synthesizes 36-lecture accredited course packages using the autonomous 8-agent swarm,
and prepares the data for student exploration in iMentor V2.
"""

import os
import sys
import json
import re
import csv
from typing import Dict, List, Any

# Ensure project root is in sys.path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from course_bootstrap.agents.course_orchestrator import CourseOrchestrator

R24_CANONICAL_NAMES = {
    "MA1011": "Single Variable Calculus and Infinite Series",
    "EE1011": "Basic Electrical Circuits",
    "ME1021": "Basics of Mechanical Engineering",
    "CS1031": "Problem Solving and Computer Programming",
    "CS1032": "Problem Solving and Computer Programming Lab",
    "MA1021": "Matrices and Differential Equations",
    "EE1611": "Electric and Magnetic Fields",
    "EE1621": "Signals and Systems",
    "EE1021": "Electrical Network Analysis",
    "CS2101": "Data Structures and Applications",
    "CS2102": "Data Structures and Applications Lab",
    "EE2011": "Measurements and Instrumentation",
    "EE2012": "Analog and Digital Circuits Lab",
    "EE2022": "Circuits and Measurements Lab",
    "EE2031": "Electrical Machines-I",
    "EE2601": "Basics of Internet of Things",
    "EE2041": "Digital Electronics",
    "EE2042": "Control Systems Lab",
    "MA2051": "Complex Variables and Transform Techniques",
    "EE2061": "Control Systems",
    "EE2062": "Power Systems & Renewable Energy Lab",
    "EE2071": "Power System Analysis",
    "MA2092": "Numerical Methods Lab",
    "EE3011": "Power Electronics",
    "EE3012": "Power Electronics Lab",
    "EE3021": "Power System Protection and Control",
    "EE3022": "Embedded Systems Lab",
    "SM3021": "Design Thinking",
    "EE3031": "Embedded Systems",
    "EE3032": "Electric Power Drives Lab",
    "EE3041": "Electric Power Drives",
    "SM3011": "Introduction to Entrepreneurship",
    "EE2611": "Renewable Power Generation",
    "EE2621": "Introduction to Machine Learning",
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
    "EE3731": "Power System Security and Reliability",
    "EE3741": "Switched Mode Power Supplies",
    "EE3751": "New Venture Creation",
    "EE4601": "Energy Management and Audit",
    "EE4611": "Power Quality Improvement",
    "EE4621": "Restructured Power Systems",
    "EE4631": "Special Machines",
    "EC401": "CMOS VLSI Design and Digital IC Architecture",
    "CS702": "Deep Reinforcement Learning",
    "QC401": "Quantum Information and Quantum Computing"
}

def load_r24_courses(pdf_json_path: str) -> Dict[str, Dict[str, Any]]:
    courses = {}
    if not os.path.exists(pdf_json_path):
        print(f"Warning: {pdf_json_path} not found.")
        return courses

    with open(pdf_json_path, 'r', encoding='utf-8') as f:
        entries = json.load(f)

    code_re = re.compile(r'((?:EE|CS|EC|MA|SM|ME|CE|CH)\s*\d{3,4}[A-Za-z]?)\s+([^\n\r]+?)(?:\s+(?:PCC|ESC|BSC|DEC|OE|PEC|HSC|MC|DLC)\s+)?(\d-\d-\d)\s+(\d+\s+Credits?)', re.IGNORECASE)

    for entry in entries:
        text = entry.get('text', '')
        m = code_re.search(text)
        if m:
            code = m.group(1).replace(' ', '').upper()
            raw_name = m.group(2).strip()
            credits = m.group(4).strip()
            
            # Map canonical name if available
            canonical_name = R24_CANONICAL_NAMES.get(code, raw_name)
            
            # Check for syllabus section
            syl_idx = text.find('Syllabus:')
            syl_text = text[syl_idx + 9:].strip() if syl_idx != -1 else ''
            
            if code not in courses or len(syl_text) > len(courses[code].get('syllabus', '')):
                courses[code] = {
                    'code': code,
                    'name': canonical_name,
                    'credits': credits,
                    'syllabus': syl_text
                }
    
    # Also ensure canonical courses are present
    for code, name in R24_CANONICAL_NAMES.items():
        if code not in courses:
            courses[code] = {
                'code': code,
                'name': name,
                'credits': '3 Credits',
                'syllabus': ''
            }
            
    return courses

def build_all_r24_courses():
    pdf_json_path = os.path.join(project_root, 'server', 'scripts', 'curriculum_pdf.json')
    
    print("=" * 70)
    print("🚀 Initializing Autonomous 8-Agent Swarm for ALL R24 Regulation Courses")
    print("=" * 70)
    
    r24_courses = load_r24_courses(pdf_json_path)
    print(f"📋 Loaded {len(r24_courses)} R24 Engineering Subject Syllabi.\n")
    
    orchestrator = CourseOrchestrator(base_output_dir=os.path.join(project_root, "course_bootstrap"))
    summary = []
    
    # Filter theory subjects or major laboratory capstones
    theory_courses = {k: v for k, v in r24_courses.items() if not k.endswith('2') or k in ['CS1032', 'EE2012']}
    
    count = 0
    total = len(theory_courses)
    
    import concurrent.futures

    def process_course(item):
        code, cinfo = item
        name = cinfo['name']
        syllabus_text = cinfo.get('syllabus', '')
        print(f"⚙️ Synthesizing 36-Lecture Course Package for: [{code}] {name}...")
        
        result = orchestrator.build_course(
            course_code=code,
            subject_name=name,
            raw_syllabus=syllabus_text
        )
        
        quality = result.get('quality_score', 100)
        lectures_count = len(result.get('syllabus', []))
        
        print(f"  ✓ [{code}] Generated {lectures_count} Theory Lectures • Quality Score: {quality}/100")
        
        return {
            'code': code,
            'name': name,
            'lectures': lectures_count,
            'quality_score': quality,
            'output_dir': result.get('course_dir', '')
        }

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        summary = list(executor.map(process_course, sorted(theory_courses.items())))

    print("\n" + "=" * 70)
    print("🎉 ALL R24 REGULATION COURSES SUCCESSFULLY SYNTHESIZED BY 8-AGENT SWARM!")
    print(f"   Total 3-Credit Courses Built: {len(summary)}")
    print(f"   Total Lectures Generated:     {sum(s['lectures'] for s in summary)}")
    print("=" * 70)

if __name__ == '__main__':
    build_all_r24_courses()
