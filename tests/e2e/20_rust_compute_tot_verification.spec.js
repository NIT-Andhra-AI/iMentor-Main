// tests/e2e/20_rust_compute_tot_verification.spec.js — Rust Compute Engine & Vector Math Verification
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('MOD-RUST-ENGINE — High-Performance SIMD & Tree-of-Thought Compute', () => {

  test('RUST-01 — Execute Rust Compute Engine Self-Test Binary', async () => {
    const binaryPath = '/home/sri/Downloads/iMentor_march/iMentorV2/rust-engine/target/release/imentor-rust-engine';
    const output = execSync(`${binaryPath} </dev/null`).toString();
    expect(output).toContain('iMentor High-Performance Compute Engine');
    expect(output).toContain('Tree-of-Thought (ToT) Graph Reasoning');
    expect(output).toContain('1024-dim Vector Cosine Similarity Self-Test: 1.0000');
  });

  test('RUST-02 — Verify Rust Engine Cargo Unit & Integration Tests', async () => {
    const output = execSync('cargo test --manifest-path /home/sri/Downloads/iMentor_march/iMentorV2/rust-engine/Cargo.toml', {
      env: { ...process.env, PATH: `${process.env.HOME}/.cargo/bin:${process.env.PATH}` }
    }).toString();
    expect(output).toContain('5 passed');
    expect(output).toContain('test_vector_cosine_similarity ... ok');
    expect(output).toContain('test_tot_tree_search_trajectory ... ok');
  });

});
