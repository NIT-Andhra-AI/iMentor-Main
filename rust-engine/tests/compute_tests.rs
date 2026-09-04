// rust-engine/tests/compute_tests.rs
use imentor_rust_engine::*;

#[test]
fn test_vector_cosine_similarity() {
    let a = vec![1.0, 0.0, 0.0];
    let b = vec![1.0, 0.0, 0.0];
    let c = vec![0.0, 1.0, 0.0];

    // Identical vectors should have similarity 1.0
    let sim_ab = cosine_similarity(&a, &b);
    assert!((sim_ab - 1.0).abs() < 1e-5);

    // Orthogonal vectors should have similarity 0.0
    let sim_ac = cosine_similarity(&a, &c);
    assert!(sim_ac.abs() < 1e-5);

    // 1024-dim embeddings test
    let emb1 = vec![0.05f32; 1024];
    let emb2 = vec![0.05f32; 1024];
    let sim_emb = cosine_similarity(&emb1, &emb2);
    assert!((sim_emb - 1.0).abs() < 1e-5);
}

#[test]
fn test_top_k_vector_similarity() {
    let query = vec![1.0, 0.0, 0.0];
    let corpus = vec![
        vec![0.0, 1.0, 0.0], // Orthogonal (sim = 0)
        vec![0.9, 0.1, 0.0], // High similarity (sim ~0.99)
        vec![0.5, 0.5, 0.0], // Moderate similarity (sim ~0.70)
    ];

    let top = find_top_k_similar(&query, &corpus, 2);
    assert_eq!(top.len(), 2);
    assert_eq!(top[0].0, 1); // Index 1 is most similar
    assert!(top[0].1 > top[1].1);
}

#[test]
fn test_tot_step_confidence_and_pruning() {
    // 1. High-confidence valid step
    let valid_step = ReasoningStep {
        step_id: "step_1".to_string(),
        thought: "Gradient descent optimizes neural network parameters and weights using loss function.".to_string(),
        observation: "Backpropagation algorithm optimizes neural network parameters using benchmark study data and experimental evidence.".to_string(),
        action: Some("backpropagation".to_string()),
        references: Some(vec!["Rumelhart et al. 1986".to_string()]),
    };

    let score = score_reasoning_step(&valid_step);
    assert!(score.weighted_score >= 50);
    assert!(!score.should_prune);

    let decision = evaluate_pruning_decision("step_1", &score);
    assert!(!decision.prune);

    // 2. Low-confidence contradictory step
    let contradiction_step = ReasoningStep {
        step_id: "step_bad".to_string(),
        thought: "The model will converge instantaneously.".to_string(),
        observation: "However, the test failed and contradictory results conflict with inconsistent data.".to_string(),
        action: None,
        references: None,
    };

    let bad_score = score_reasoning_step(&contradiction_step);
    assert!(bad_score.contradiction_penalty > 0.3);
    assert!(bad_score.should_prune);

    let bad_decision = evaluate_pruning_decision("step_bad", &bad_score);
    assert!(bad_decision.prune);
}

#[test]
fn test_tot_tree_search_trajectory() {
    let mut tree = ToTTreeSearch::new(2, 3);

    let root_step = ReasoningStep {
        step_id: "root".to_string(),
        thought: "We need to design a neural network architecture for image classification.".to_string(),
        observation: "Input images are 224x224 RGB tensors backed by benchmark datasets.".to_string(),
        action: Some("design_cnn".to_string()),
        references: Some(vec!["ImageNet".to_string()]),
    };

    let root_id = tree.set_root(root_step);
    assert_eq!(root_id, "root");

    // Add branch candidates
    let branch1 = ReasoningStep {
        step_id: "b1_cnn".to_string(),
        thought: "Use convolutional layers with batch normalization and ReLU activations.".to_string(),
        observation: "Convolution preserves spatial locality according to benchmark data.".to_string(),
        action: Some("conv2d".to_string()),
        references: Some(vec!["ResNet".to_string()]),
    };

    let branch2 = ReasoningStep {
        step_id: "b2_bad".to_string(),
        thought: "Maybe guess arbitrary weights without learning.".to_string(),
        observation: "However, but inconsistent failed contradictory results.".to_string(),
        action: None,
        references: None,
    };

    let added = tree.add_branches(&root_id, vec![branch1, branch2]);
    // branch2 should be automatically pruned due to contradiction
    assert_eq!(added.len(), 1);
    assert_eq!(added[0], "b1_cnn");

    let trajectory = tree.extract_best_trajectory();
    assert_eq!(trajectory.len(), 2);
    assert_eq!(trajectory[0].id, "root");
    assert_eq!(trajectory[1].id, "b1_cnn");
}

#[test]
fn test_stn_graph_prerequisites_and_similarity() {
    let mut stn = STNGraph::new();

    let c1 = STNConcept {
        id: "c_calculus".to_string(),
        name: "Multivariate Calculus".to_string(),
        topic: "Mathematics".to_string(),
        cognitive_level: "L1_CONCEPT".to_string(),
        embedding: vec![0.8, 0.2, 0.0],
        mastery_threshold: 0.75,
    };

    let c2 = STNConcept {
        id: "c_backprop".to_string(),
        name: "Backpropagation".to_string(),
        topic: "Deep Learning".to_string(),
        cognitive_level: "L2_APPLICATION".to_string(),
        embedding: vec![0.7, 0.3, 0.1],
        mastery_threshold: 0.80,
    };

    stn.add_concept(c1);
    stn.add_concept(c2);

    stn.add_relationship(STNRelationship {
        from_concept_id: "c_calculus".to_string(),
        to_concept_id: "c_backprop".to_string(),
        relationship_type: "PREREQUISITE".to_string(),
        weight: 1.0,
    });

    // Check prerequisite lookup
    let prereqs = stn.get_prerequisites("c_backprop");
    assert_eq!(prereqs.len(), 1);
    assert_eq!(prereqs[0].id, "c_calculus");

    // Check similarity lookup
    let query_vec = vec![0.75, 0.25, 0.05];
    let similar = stn.find_similar_concepts(&query_vec, 2);
    assert_eq!(similar.len(), 2);
    assert!(similar[0].similarity_score > 0.95);
}
