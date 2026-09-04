#!/usr/bin/env python3
"""
STNGraphBuilderAgent:
Constructs the Semantic Topic Network (STN) DAG with prerequisite relationships,
Bloom's cognitive taxonomy weights, and adjacency matrices for the Rust compute engine.
"""

import json
import math
from typing import Dict, List, Any

class STNGraphBuilderAgent:
    """Agent that transforms a course syllabus into a fully linked Semantic Topic Network."""

    def build_stn(self, course_data: Dict[str, Any]) -> Dict[str, Any]:
        course_code = course_data.get("course_code", "GEN001")
        course_name = course_data.get("course_name", "Engineering Subject")
        lectures = course_data.get("lectures", [])

        nodes = []
        edges = []
        node_id_map = {}

        # 1. Create Nodes
        for idx, lec in enumerate(lectures):
            node_id = f"node_{course_code.lower()}_l{lec['num']}"
            node_id_map[str(lec['num'])] = node_id

            # Compute normalized difficulty based on Bloom Level & index
            bloom = lec.get("bloom", "L2_UNDERSTAND")
            bloom_weights = {
                "L1_REMEMBER": 0.2,
                "L2_UNDERSTAND": 0.35,
                "L3_APPLY": 0.55,
                "L4_ANALYZE": 0.75,
                "L5_EVALUATE": 0.88,
                "L6_CREATE": 0.98
            }
            diff = bloom_weights.get(bloom, 0.5)

            # Generate synthetic 16-dim normalized concept embedding for fast similarity
            emb = [math.sin((idx + 1) * (i + 1) * 0.4) for i in range(16)]
            norm = math.sqrt(sum(x * x for x in emb)) or 1.0
            emb_norm = [round(x / norm, 4) for x in emb]

            nodes.append({
                "id": node_id,
                "lecture_num": lec["num"],
                "title": lec["title"],
                "module": lec["module"],
                "subtopics": lec.get("subtopics", ""),
                "bloom_level": bloom,
                "difficulty": round(diff, 2),
                "embedding": emb_norm,
                "required_mastery": 0.85
            })

        # 2. Create Edges
        for idx, lec in enumerate(lectures):
            curr_id = node_id_map[str(lec["num"])]
            
            # Module hierarchy edge (PART_OF module)
            module_id = f"mod_{course_code.lower()}_{lec['module'].replace(' ', '_').lower()}"
            edges.append({
                "source": curr_id,
                "target": module_id,
                "type": "PART_OF",
                "weight": 1.0
            })

            # Sequential prerequisite chain
            prereq_val = str(lec.get("prereq", ""))
            if prereq_val and prereq_val != "None" and prereq_val in node_id_map:
                prereq_id = node_id_map[prereq_val]
                edges.append({
                    "source": prereq_id,
                    "target": curr_id,
                    "type": "PREREQUISITE_OF",
                    "weight": 0.95
                })

            # Immediate forward progression (LEADS_TO)
            if idx + 1 < len(lectures):
                next_id = node_id_map[str(lectures[idx + 1]["num"])]
                edges.append({
                    "source": curr_id,
                    "target": next_id,
                    "type": "LEADS_TO",
                    "weight": 0.80
                })

        # 3. Compute Adjacency Matrix
        n = len(nodes)
        adj_matrix = [[0.0 for _ in range(n)] for _ in range(n)]
        node_index_lookup = {node["id"]: i for i, node in enumerate(nodes)}

        for edge in edges:
            src = edge["source"]
            tgt = edge["target"]
            if src in node_index_lookup and tgt in node_index_lookup:
                i = node_index_lookup[src]
                j = node_index_lookup[tgt]
                adj_matrix[i][j] = edge["weight"]

        return {
            "course_code": course_code,
            "course_name": course_name,
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "nodes": nodes,
            "edges": edges,
            "adjacency_matrix": adj_matrix
        }
