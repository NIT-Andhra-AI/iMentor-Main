// rust-engine/src/models.rs
use serde::{Deserialize, Serialize};

/// Represents a single step in a Tree-of-Thought (ToT) reasoning path
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReasoningStep {
    pub step_id: String,
    pub thought: String,
    pub observation: String,
    pub action: Option<String>,
    pub references: Option<Vec<String>>,
}

/// Evaluation scores calculated for a specific reasoning step
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepConfidenceScore {
    pub coherence: f64,
    pub evidence_strength: f64,
    pub contradiction_penalty: f64,
    pub speculation_penalty: f64,
    pub weighted_score: u32,
    pub reasoning_score: u32,
    pub should_prune: bool,
    pub uncertainty_factors: Vec<String>,
}

/// A node in the Tree-of-Thought graph
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThoughtNode {
    pub id: String,
    pub parent_id: Option<String>,
    pub step: ReasoningStep,
    pub score: StepConfidenceScore,
    pub depth: usize,
    pub cumulative_score: f64,
}

/// Pruning decision for a branch
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PruningDecision {
    pub node_id: String,
    pub prune: bool,
    pub reason: String,
    pub confidence: f64,
}

/// Concept node in the Semantic Topic Network (STN)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct STNConcept {
    pub id: String,
    pub name: String,
    pub topic: String,
    pub cognitive_level: String, // "L1_CONCEPT", "L2_APPLICATION", "L3_CRITICAL"
    pub embedding: Vec<f32>,
    pub mastery_threshold: f64,
}

/// Relationship edge in the Semantic Topic Network
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct STNRelationship {
    pub from_concept_id: String,
    pub to_concept_id: String,
    pub relationship_type: String, // "PREREQUISITE", "EXTENDS", "RELATED"
    pub weight: f64,
}

/// Learning path recommendation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningPathStep {
    pub concept_id: String,
    pub concept_name: String,
    pub cognitive_level: String,
    pub similarity_score: f64,
}
