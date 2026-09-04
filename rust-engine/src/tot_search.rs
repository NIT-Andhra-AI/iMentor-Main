// rust-engine/src/tot_search.rs
use crate::models::{ReasoningStep, ThoughtNode};
use crate::tot_pruning::score_reasoning_step;
use std::collections::HashMap;

/// Manages multi-branch Tree-of-Thought exploration
pub struct ToTTreeSearch {
    nodes: HashMap<String, ThoughtNode>,
    root_id: Option<String>,
    beam_width: usize,
    max_depth: usize,
}

impl ToTTreeSearch {
    pub fn new(beam_width: usize, max_depth: usize) -> Self {
        Self {
            nodes: HashMap::new(),
            root_id: None,
            beam_width: beam_width.max(1),
            max_depth: max_depth.max(1),
        }
    }

    /// Sets the root node of the reasoning tree
    pub fn set_root(&mut self, step: ReasoningStep) -> String {
        let node_id = step.step_id.clone();
        let score = score_reasoning_step(&step);
        let cumulative = score.weighted_score as f64;

        let node = ThoughtNode {
            id: node_id.clone(),
            parent_id: None,
            step,
            score,
            depth: 0,
            cumulative_score: cumulative,
        };

        self.nodes.insert(node_id.clone(), node);
        self.root_id = Some(node_id.clone());
        node_id
    }

    /// Adds candidate child branches to a parent node and scores them
    pub fn add_branches(&mut self, parent_id: &str, candidate_steps: Vec<ReasoningStep>) -> Vec<String> {
        let (parent_depth, parent_cumulative) = match self.nodes.get(parent_id) {
            Some(p) => (p.depth, p.cumulative_score),
            None => return Vec::new(),
        };

        if parent_depth >= self.max_depth {
            return Vec::new();
        }

        let mut added_ids = Vec::new();

        for step in candidate_steps {
            let score = score_reasoning_step(&step);
            if score.should_prune {
                continue; // Automatically prune dead-end branches
            }

            let node_id = step.step_id.clone();
            // Cumulative score calculation with decay
            let decay = 0.95f64.powi((parent_depth + 1) as i32);
            let cumulative = parent_cumulative + (score.weighted_score as f64 * decay);

            let node = ThoughtNode {
                id: node_id.clone(),
                parent_id: Some(parent_id.to_string()),
                step,
                score,
                depth: parent_depth + 1,
                cumulative_score: cumulative,
            };

            self.nodes.insert(node_id.clone(), node);
            added_ids.push(node_id);
        }

        added_ids
    }

    /// Beam Search: Returns the top active leaf node IDs at the frontier
    pub fn get_beam_frontier(&self) -> Vec<String> {
        if self.nodes.is_empty() {
            return Vec::new();
        }

        // Find all leaves (nodes that are not parents of any other node)
        let parent_ids: std::collections::HashSet<&str> = self
            .nodes
            .values()
            .filter_map(|n| n.parent_id.as_deref())
            .collect();

        let mut leaves: Vec<&ThoughtNode> = self
            .nodes
            .values()
            .filter(|n| !parent_ids.contains(n.id.as_str()))
            .collect();

        // Sort descending by cumulative score
        leaves.sort_unstable_by(|a, b| {
            b.cumulative_score
                .partial_cmp(&a.cumulative_score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        leaves
            .into_iter()
            .take(self.beam_width)
            .map(|n| n.id.clone())
            .collect()
    }

    /// Extracts the optimal reasoning trajectory from root to the highest-scoring leaf
    pub fn extract_best_trajectory(&self) -> Vec<ThoughtNode> {
        let frontier = self.get_beam_frontier();
        let best_leaf_id = match frontier.first() {
            Some(id) => id,
            None => return Vec::new(),
        };

        let mut path = Vec::new();
        let mut curr_id = Some(best_leaf_id.clone());

        while let Some(id) = curr_id {
            if let Some(node) = self.nodes.get(&id) {
                path.push(node.clone());
                curr_id = node.parent_id.clone();
            } else {
                break;
            }
        }

        path.reverse();
        path
    }
}
