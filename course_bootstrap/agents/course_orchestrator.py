#!/usr/bin/env python3
"""
CourseOrchestrator:
Master multi-agent orchestrator that accepts a subject name and optional syllabus/description,
invokes the 8 specialized agents, and builds complete world-class academic 3-credit course packages
with STN, KaTeX lecture notes, CSV syllabi, industry labs, concept question banks, capstone project,
standalone interactive simulators, and academic quality audit reports.
"""

import os
import csv
import json
import logging
from typing import Dict, Any, Optional

from course_bootstrap.agents.resource_collector_agent import ResourceCollectorAgent
from course_bootstrap.agents.syllabus_structure_agent import SyllabusStructureAgent
from course_bootstrap.agents.stn_graph_builder_agent import STNGraphBuilderAgent
from course_bootstrap.agents.content_synthesizer_agent import ContentSynthesizerAgent
from course_bootstrap.agents.lab_engineer_agent import LabEngineerAgent
from course_bootstrap.agents.assessment_bank_agent import AssessmentBankAgent
from course_bootstrap.agents.interactive_demo_agent import InteractiveDemoAgent
from course_bootstrap.agents.quality_auditor_agent import QualityAuditorAgent

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("CourseOrchestrator")


class CourseOrchestrator:
    """Master Multi-Agent Swarm Orchestrator for World-Class 3-Credit Course Creation."""

    def __init__(self, base_output_dir: str = "course_bootstrap"):
        self.base_output_dir = base_output_dir
        self.resource_agent = ResourceCollectorAgent()
        self.syllabus_agent = SyllabusStructureAgent()
        self.stn_agent = STNGraphBuilderAgent()
        self.content_agent = ContentSynthesizerAgent()
        self.lab_agent = LabEngineerAgent()
        self.assessment_agent = AssessmentBankAgent()
        self.demo_agent = InteractiveDemoAgent()
        self.auditor_agent = QualityAuditorAgent()

    def build_course(self, course_code: str, subject_name: str, raw_syllabus: str = "", description: str = "") -> Dict[str, Any]:
        """Runs the 8-agent swarm pipeline to construct a complete world-class 3-credit course package."""
        logger.info(f"🚀 Initializing Course Creation Swarm for: [{course_code}] {subject_name}")

        course_dir = os.path.join(self.base_output_dir, course_code.replace(" ", "_"))
        lectures_dir = os.path.join(course_dir, "lectures")
        labs_dir = os.path.join(course_dir, "labs")
        portal_dir = os.path.join(course_dir, "interactive_portal")

        os.makedirs(lectures_dir, exist_ok=True)
        os.makedirs(labs_dir, exist_ok=True)
        os.makedirs(portal_dir, exist_ok=True)

        # Agent 1: Resource Collection
        logger.info("📚 [Agent 1/8] ResourceCollectorAgent curating standard textbooks, IEEE/ACM references & simulation tools...")
        resources = self.resource_agent.collect(course_code, subject_name, description)
        with open(os.path.join(course_dir, "resources.json"), "w", encoding="utf-8") as f:
            json.dump(resources, f, indent=2)

        # Agent 2: Syllabus & Course Structure (3-Credit / 4-Unit Hierarchy)
        logger.info("📐 [Agent 2/8] SyllabusStructureAgent formulating accredited 3-Credit B.Tech modules, Course Outcomes & Bloom's taxonomy...")
        course_structure = self.syllabus_agent.structure_course(course_code, subject_name, raw_syllabus)
        
        # Export syllabus.csv in standard iMentor CSV format
        csv_path = os.path.join(course_dir, "syllabus.csv")
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["Course Code", "Course Name", "Module", "Lecture Topic", "Subtopics", "Prerequisites", "Bloom Level"])
            for lec in course_structure["lectures"]:
                writer.writerow([
                    course_code,
                    subject_name,
                    lec["module"],
                    lec["title"],
                    lec.get("subtopics", ""),
                    lec.get("prereq", "None"),
                    lec.get("bloom", "L3_APPLY")
                ])

        # Agent 3: Semantic Topic Network (STN) DAG
        logger.info("🕸️ [Agent 3/8] STNGraphBuilderAgent constructing concept DAG, prerequisites & adjacency matrix...")
        stn_graph = self.stn_agent.build_stn(course_structure)
        with open(os.path.join(course_dir, "stn_graph.json"), "w", encoding="utf-8") as f:
            json.dump(stn_graph, f, indent=2)

        import concurrent.futures

        # Agent 4: Content Synthesis (Mathematically Rigorous KaTeX Notes)
        logger.info(f"✍️ [Agent 4/8] ContentSynthesizerAgent generating comprehensive lecture notes ({len(course_structure['lectures'])} lectures) in parallel...")
        def generate_and_save_lecture(lec):
            lec_num = lec["num"]
            lecture_md = self.content_agent.synthesize_lecture(course_structure, lec, resources)
            with open(os.path.join(lectures_dir, f"L{lec_num}.md"), "w", encoding="utf-8") as f:
                f.write(lecture_md)
            return lec_num
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(32, len(course_structure["lectures"]))) as executor:
            list(executor.map(generate_and_save_lecture, course_structure["lectures"]))

        # Run Agents 5, 6, 7 in parallel as they only depend on course_structure and resources
        logger.info("🔬🎯⚡ [Agents 5,6,7/8] Running Lab, Assessment, and Demo agents concurrently...")
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            future_labs = executor.submit(self.lab_agent.generate_labs_and_capstone, course_structure, resources, labs_dir)
            future_cqb = executor.submit(self.assessment_agent.generate_question_bank, course_structure, course_dir)
            future_portal = executor.submit(self.demo_agent.generate_portal, course_structure, resources, portal_dir)
            
            lab_summary = future_labs.result()
            cqb_summary = future_cqb.result()
            portal_meta = future_portal.result()

        # Agent 8: Academic Quality Assurance & Self-Critique Audit
        logger.info("🔍 [Agent 8/8] QualityAuditorAgent auditing mathematical rigor, KaTeX syntax, testability & Bloom distribution...")
        audit_results = self.auditor_agent.audit_course_package(course_dir, course_structure)

        summary = {
            "course_code": course_code,
            "subject_name": subject_name,
            "category": resources.get("category", "engineering"),
            "total_lectures": len(course_structure["lectures"]),
            "modules_count": len(course_structure["modules"]),
            "stn_nodes": stn_graph["total_nodes"],
            "stn_edges": stn_graph["total_edges"],
            "total_labs": lab_summary["total_labs"],
            "total_questions": cqb_summary["total_questions"],
            "quality_score": audit_results["quality_score"],
            "audit_passed": audit_results["passed"],
            "syllabus_csv": csv_path,
            "stn_json": os.path.join(course_dir, "stn_graph.json"),
            "resources_json": os.path.join(course_dir, "resources.json"),
            "cqb_json": os.path.join(course_dir, "concept_question_bank.json"),
            "quality_audit_json": os.path.join(course_dir, "quality_audit_report.json"),
            "capstone_path": lab_summary["capstone_path"],
            "lectures_path": lectures_dir,
            "labs_path": labs_dir,
            "interactive_portal": portal_meta["html"]
        }

        logger.info(f"✅ World-Class 3-Credit Course package generated at: {course_dir} (Quality Score: {audit_results['quality_score']}/100)")
        return summary

