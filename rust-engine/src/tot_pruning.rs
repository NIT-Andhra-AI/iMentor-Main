// rust-engine/src/tot_pruning.rs
use crate::models::{PruningDecision, ReasoningStep, StepConfidenceScore};

const CONTRADICTION_HINTS: &[&str] = &[
    "however", "but", "contradict", "inconsistent", "conflict", "not found", "failed", "invalid",
];

const SPECULATION_HINTS: &[&str] = &[
    "might", "maybe", "possibly", "unclear", "unknown", "assume", "guess", "perhaps",
];

const EVIDENCE_HINTS: &[&str] = &[
    "data", "study", "source", "result", "stat", "citation", "evidence", "found", "retriev",
    "measured", "observed", "proof", "theorem",
];

#[inline(always)]
fn clamp(value: f64, min: f64, max: f64) -> f64 {
    value.max(min).min(max)
}

/// Evaluates logical consistency between thought, observation, and action
pub fn evaluate_logical_consistency(step: &ReasoningStep) -> f64 {
    let thought = step.thought.to_lowercase();
    let observation = step.observation.to_lowercase();
    let action = step.action.as_deref().unwrap_or("").to_lowercase();

    if thought.is_empty() && observation.is_empty() {
        return 0.45;
    }

    let thought_words: Vec<&str> = thought.split_whitespace().filter(|w| w.len() > 4).collect();
    if thought_words.is_empty() {
        return 0.50;
    }

    let overlap_count = thought_words
        .iter()
        .filter(|&&w| observation.contains(w))
        .count();

    let overlap_ratio = overlap_count as f64 / thought_words.len() as f64;
    let action_boost = if !action.is_empty() && (observation.contains(&action) || thought.contains(&action)) {
        0.10
    } else {
        0.0
    };

    clamp(0.35 + overlap_ratio + action_boost, 0.0, 1.0)
}

/// Evaluates empirical or textual evidence backing the reasoning step
pub fn evaluate_evidence_strength(step: &ReasoningStep) -> f64 {
    let observation = step.observation.to_lowercase();
    let references_count = step.references.as_ref().map(|r| r.len()).unwrap_or(0);

    let has_structured_evidence = EVIDENCE_HINTS.iter().any(|&k| observation.contains(k));
    let length_factor = clamp(observation.len() as f64 / 300.0, 0.0, 1.0);

    let base_ref = if references_count > 0 { 0.40 } else { 0.0 };
    let base_struct = if has_structured_evidence { 0.35 } else { 0.15 };

    clamp(base_ref + base_struct + (length_factor * 0.25), 0.0, 1.0)
}

/// Detects logical contradictions in the observation
pub fn detect_contradiction_penalty(step: &ReasoningStep) -> f64 {
    let observation = step.observation.to_lowercase();
    let hits = CONTRADICTION_HINTS
        .iter()
        .filter(|&&k| observation.contains(k))
        .count();

    clamp(hits as f64 * 0.18, 0.0, 0.80)
}

/// Detects speculative or uncertain language
pub fn detect_speculation_penalty(step: &ReasoningStep) -> f64 {
    let observation = step.observation.to_lowercase();
    let hits = SPECULATION_HINTS
        .iter()
        .filter(|&&k| observation.contains(k))
        .count();

    clamp(hits as f64 * 0.15, 0.0, 0.70)
}

/// Computes the comprehensive confidence evaluation for a reasoning step
pub fn score_reasoning_step(step: &ReasoningStep) -> StepConfidenceScore {
    let coherence = evaluate_logical_consistency(step);
    let evidence_strength = evaluate_evidence_strength(step);
    let contradiction_penalty = detect_contradiction_penalty(step);
    let speculation_penalty = detect_speculation_penalty(step);

    let base = (coherence * 0.40) + (evidence_strength * 0.40)
        - (contradiction_penalty * 0.12)
        - (speculation_penalty * 0.08);

    let weighted_score = (clamp(base, 0.0, 1.0) * 100.0).round() as u32;
    let reasoning_score = (((coherence + evidence_strength) / 2.0) * 100.0).round() as u32;

    let mut uncertainty_factors = Vec::new();
    if contradiction_penalty > 0.25 {
        uncertainty_factors.push("possible-contradiction".to_string());
    }
    if speculation_penalty > 0.25 {
        uncertainty_factors.push("speculative-language".to_string());
    }
    if evidence_strength < 0.35 {
        uncertainty_factors.push("weak-evidence".to_string());
    }

    let should_prune = weighted_score < 40 || contradiction_penalty > 0.45;

    StepConfidenceScore {
        coherence,
        evidence_strength,
        contradiction_penalty,
        speculation_penalty,
        weighted_score,
        reasoning_score,
        should_prune,
        uncertainty_factors,
    }
}

/// Determines whether a branch node should be pruned from the Tree-of-Thought
pub fn evaluate_pruning_decision(node_id: &str, score: &StepConfidenceScore) -> PruningDecision {
    if score.contradiction_penalty > 0.45 {
        PruningDecision {
            node_id: node_id.to_string(),
            prune: true,
            reason: "Critical logical contradiction detected in reasoning step".to_string(),
            confidence: score.contradiction_penalty,
        }
    } else if score.weighted_score < 35 {
        PruningDecision {
            node_id: node_id.to_string(),
            prune: true,
            reason: format!("Confidence score ({}/100) below acceptable threshold", score.weighted_score),
            confidence: 1.0 - (score.weighted_score as f64 / 100.0),
        }
    } else {
        PruningDecision {
            node_id: node_id.to_string(),
            prune: false,
            reason: "Confidence score passed validity threshold".to_string(),
            confidence: score.weighted_score as f64 / 100.0,
        }
    }
}
