// rust-engine/src/stn_graph.rs
use crate::models::{LearningPathStep, STNConcept, STNRelationship};
use crate::vector_math::cosine_similarity;
use petgraph::graph::{DiGraph, NodeIndex};
use std::collections::HashMap;

/// Semantic Topic Network Graph manager
pub struct STNGraph {
    graph: DiGraph<STNConcept, f64>,
    node_map: HashMap<String, NodeIndex>,
}

impl STNGraph {
    pub fn new() -> Self {
        Self {
            graph: DiGraph::new(),
            node_map: HashMap::new(),
        }
    }

    /// Adds a concept node to the STN graph
    pub fn add_concept(&mut self, concept: STNConcept) {
        let concept_id = concept.id.clone();
        let idx = self.graph.add_node(concept);
        self.node_map.insert(concept_id, idx);
    }

    /// Adds a directional relationship edge (e.g. from prerequisite to target concept)
    pub fn add_relationship(&mut self, rel: STNRelationship) {
        if let (Some(&from_idx), Some(&to_idx)) = (
            self.node_map.get(&rel.from_concept_id),
            self.node_map.get(&rel.to_concept_id),
        ) {
            self.graph.add_edge(from_idx, to_idx, rel.weight);
        }
    }

    /// Finds the closest concepts to a query embedding vector
    pub fn find_similar_concepts(&self, query_vec: &[f32], top_k: usize) -> Vec<LearningPathStep> {
        let mut results: Vec<LearningPathStep> = self
            .graph
            .node_weights()
            .map(|concept| {
                let sim = cosine_similarity(query_vec, &concept.embedding);
                LearningPathStep {
                    concept_id: concept.id.clone(),
                    concept_name: concept.name.clone(),
                    cognitive_level: concept.cognitive_level.clone(),
                    similarity_score: sim as f64,
                }
            })
            .collect();

        results.sort_unstable_by(|a, b| {
            b.similarity_score
                .partial_cmp(&a.similarity_score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        if results.len() > top_k {
            results.truncate(top_k);
        }

        results
    }

    /// Computes the prerequisite chain for a target concept
    pub fn get_prerequisites(&self, target_concept_id: &str) -> Vec<STNConcept> {
        let target_idx = match self.node_map.get(target_concept_id) {
            Some(&idx) => idx,
            None => return Vec::new(),
        };

        let mut prereqs = Vec::new();
        let mut visited = std::collections::HashSet::new();
        let mut queue = std::collections::VecDeque::new();

        queue.push_back(target_idx);
        visited.insert(target_idx);

        while let Some(curr_idx) = queue.pop_front() {
            // Find incoming edges (prerequisites that point to curr_idx)
            for neighbor in self.graph.neighbors_directed(curr_idx, petgraph::Direction::Incoming) {
                if !visited.contains(&neighbor) {
                    visited.insert(neighbor);
                    if let Some(concept) = self.graph.node_weight(neighbor) {
                        prereqs.push(concept.clone());
                    }
                    queue.push_back(neighbor);
                }
            }
        }

        prereqs
    }
}
