// rust-engine/src/course_synthesizer.rs
//! High-Performance Rust Course & STN Synthesizer
//! Provides lock-free graph construction, SIMD vector distance matrices,
//! and topological dependency resolution for B.Tech course concept graphs.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::vector_math::cosine_similarity;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CourseConcept {
    pub id: String,
    pub lecture_num: usize,
    pub title: String,
    pub module: String,
    pub bloom_level: String,
    pub difficulty: f32,
    pub embedding: Vec<f32>,
    pub prerequisites: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SynthesizedCourseGraph {
    pub course_code: String,
    pub total_concepts: usize,
    pub topological_order: Vec<String>,
    pub distance_matrix: Vec<Vec<f32>>,
}

/// Compute pairwise SIMD cosine distance matrix for all course concepts
pub fn compute_concept_distance_matrix(concepts: &[CourseConcept]) -> Vec<Vec<f32>> {
    let n = concepts.len();
    let mut matrix = vec![vec![0.0f32; n]; n];

    for i in 0..n {
        for j in 0..n {
            if i == j {
                matrix[i][j] = 0.0;
            } else {
                let sim = cosine_similarity(&concepts[i].embedding, &concepts[j].embedding);
                matrix[i][j] = 1.0 - sim;
            }
        }
    }
    matrix
}

/// Perform Kahn's algorithm for fast topological dependency ordering
pub fn resolve_topological_order(concepts: &[CourseConcept]) -> Vec<String> {
    let mut in_degree: HashMap<String, usize> = HashMap::new();
    let mut adj_list: HashMap<String, Vec<String>> = HashMap::new();

    for c in concepts {
        in_degree.entry(c.id.clone()).or_insert(0);
        adj_list.entry(c.id.clone()).or_insert_with(Vec::new);
    }

    for c in concepts {
        for prereq in &c.prerequisites {
            if prereq != "None" && !prereq.is_empty() {
                adj_list.entry(prereq.clone()).or_default().push(c.id.clone());
                *in_degree.entry(c.id.clone()).or_insert(0) += 1;
            }
        }
    }

    let mut queue: Vec<String> = in_degree
        .iter()
        .filter(|(_, &deg)| deg == 0)
        .map(|(id, _)| id.clone())
        .collect();

    let mut order = Vec::new();
    while let Some(curr) = queue.pop() {
        order.push(curr.clone());
        if let Some(neighbors) = adj_list.get(&curr) {
            for neighbor in neighbors {
                if let Some(deg) = in_degree.get_mut(neighbor) {
                    *deg -= 1;
                    if *deg == 0 {
                        queue.push(neighbor.clone());
                    }
                }
            }
        }
    }

    order
}
