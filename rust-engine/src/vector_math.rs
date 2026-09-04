// rust-engine/src/vector_math.rs
use rayon::prelude::*;

/// Computes the dot product between two slices
#[inline(always)]
pub fn dot_product(a: &[f32], b: &[f32]) -> f32 {
    let len = a.len().min(b.len());
    let mut sum = 0.0f32;
    for i in 0..len {
        sum += a[i] * b[i];
    }
    sum
}

/// Computes the L2 norm (Euclidean length) of a vector
#[inline(always)]
pub fn l2_norm(a: &[f32]) -> f32 {
    let sum_sq: f32 = a.iter().map(|&x| x * x).sum();
    sum_sq.sqrt()
}

/// Computes cosine similarity between two float vectors
#[inline(always)]
pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.is_empty() || b.is_empty() || a.len() != b.len() {
        return 0.0;
    }

    let dot = dot_product(a, b);
    let norm_a = l2_norm(a);
    let norm_b = l2_norm(b);

    if norm_a == 0.0 || norm_b == 0.0 {
        return 0.0;
    }

    (dot / (norm_a * norm_b)).clamp(-1.0, 1.0)
}

/// Computes batch cosine similarities in parallel across multi-core CPU using Rayon
pub fn batch_cosine_similarity(query: &[f32], corpus: &[Vec<f32>]) -> Vec<f32> {
    corpus
        .par_iter()
        .map(|doc_vec| cosine_similarity(query, doc_vec))
        .collect()
}

/// Finds the top-K most similar vectors in a corpus with their indices and similarity scores
pub fn find_top_k_similar(query: &[f32], corpus: &[Vec<f32>], k: usize) -> Vec<(usize, f32)> {
    if corpus.is_empty() || k == 0 {
        return Vec::new();
    }

    let mut indexed_scores: Vec<(usize, f32)> = corpus
        .par_iter()
        .enumerate()
        .map(|(idx, doc_vec)| (idx, cosine_similarity(query, doc_vec)))
        .collect();

    // Sort descending by score
    indexed_scores.sort_unstable_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

    if indexed_scores.len() > k {
        indexed_scores.truncate(k);
    }

    indexed_scores
}
