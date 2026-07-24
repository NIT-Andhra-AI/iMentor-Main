# server/tests/test_pipeline_comprehensive_team4.py
import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Ensure root directory is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import components from bootstrap_course
import bootstrap_course
from lecture_generator.concept_extractor import KnowledgeGraph

class TestEEPipelineComprehensive(unittest.TestCase):

    @patch('bootstrap_course.load_course')
    @patch('bootstrap_course.find_syllabus')
    @patch('bootstrap_course.sglang_client')
    @patch('bootstrap_course.extract_knowledge_graph')
    @patch('bootstrap_course.run_lecture_pipeline')
    @patch('requests.post')
    def test_bootstrap_unified_control_flow(self, mock_post, mock_run_lecture, mock_extract_kg, mock_sglang_client, mock_find_syllabus, mock_load_course):
        # 1. Setup mocks
        mock_sglang_client.check_health.return_value = True
        
        # Mock Syllabus
        mock_syllabus = MagicMock()
        mock_syllabus.source_path = "mock_syllabus.csv"
        mock_syllabus.summary = "Mock Course (10 concepts)"
        mock_syllabus.concept_count_hint.return_value = 10
        mock_syllabus.entries = []
        mock_find_syllabus.return_value = mock_syllabus

        # Mock Course
        mock_course = MagicMock()
        mock_course.summary = "Course with 5 lectures"
        mock_course.combined_text = "Standard learning content text description."
        mock_load_course.return_value = mock_course

        # Mock Knowledge Graph
        mock_concept = MagicMock()
        mock_concept.id = "concept_1"
        mock_concept.label = "Concept One"
        mock_concept.description = "First design concept"
        mock_concept.importance = 0.8
        mock_concept.prerequisites = []
        
        mock_kg = MagicMock(spec=KnowledgeGraph)
        mock_kg.concepts = [mock_concept]
        mock_kg.relationships = []
        mock_extract_kg.return_value = mock_kg

        # Mock HTTP responses for RAG ingestion & STN triggers
        mock_response_ingest = MagicMock()
        mock_response_ingest.ok = True
        mock_response_ingest.json.return_value = {
            "status": "success",
            "neo4j": {"nodes_added": 12, "relationships_added": 15},
            "qdrant": {"total_chunks_added": 45}
        }
        
        mock_response_stn = MagicMock()
        mock_response_stn.ok = True
        
        mock_post.side_effect = [mock_response_ingest, mock_response_stn]

        # 2. Run bootstrap invocation
        try:
            bootstrap_course.bootstrap(
                course_name="EE1011 Basic Electrical Circuits",
                course_dir="server/course_bootstrap/EE1011 Basic Electrical Circuits",
                materials_dir="server/course_bootstrap/EE1011 Basic Electrical Circuits/materials",
                skip_rag=False,
                skip_lecture=False,
                output_root="",
                rag_url="http://localhost:2001"
            )
        except Exception as e:
            self.fail(f"bootstrap raised Exception unexpectedly: {e}")

        # 3. Assert correct invocations
        mock_load_course.assert_called_once_with(
            "server/course_bootstrap/EE1011 Basic Electrical Circuits",
            course_name="EE1011 Basic Electrical Circuits"
        )
        mock_extract_kg.assert_called_once()
        mock_run_lecture.assert_called_once()
        
        # Verify both RAG service and STN from KG endpoints were hit
        self.assertEqual(mock_post.call_count, 2)
        
        # Inspect RAG course/ingest POST arguments
        first_call_args, first_call_kwargs = mock_post.call_args_list[0]
        self.assertEqual(first_call_args[0], "http://localhost:2001/course/ingest")
        self.assertEqual(first_call_kwargs["json"]["course_name"], "EE1011 Basic Electrical Circuits")
        self.assertEqual(first_call_kwargs["json"]["syllabus_csv_path"], "mock_syllabus.csv")

        # Inspect RAG course/stn_from_kg POST arguments
        second_call_args, second_call_kwargs = mock_post.call_args_list[1]
        self.assertEqual(second_call_args[0], "http://localhost:2001/course/stn_from_kg")
        self.assertEqual(second_call_kwargs["json"]["course_name"], "EE1011 Basic Electrical Circuits")
        self.assertEqual(len(second_call_kwargs["json"]["concepts"]), 1)
        self.assertEqual(second_call_kwargs["json"]["concepts"][0]["label"], "Concept One")

if __name__ == "__main__":
    unittest.main()
