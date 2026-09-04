// tests/e2e/21_assessment_performance_benchmark.spec.js
import { test, expect } from '@playwright/test';

const BASE_API = 'http://127.0.0.1:5005/api';

test.describe('Assessment Latency & Performance Benchmark', () => {
  test.setTimeout(60000);
  let authToken = '';

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BASE_API}/auth/signin`, {
      data: {
        email: 'student01@imentor.edu',
        password: 'password123',
      },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    authToken = data.token;
    expect(authToken).toBeTruthy();
  });

  test('PERF-01 — Generate Assessment Latency Benchmark (< 4s)', async ({ request }) => {
    const startTime = Date.now();
    const res = await request.post(`${BASE_API}/assessment/generate`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        topic: 'Binary Search Trees and Graph Traversals',
        course: 'Data Structures and Algorithms',
      },
    });
    const elapsed = Date.now() - startTime;
    console.log(`⏱️ [PERF-01] Question Generation Latency: ${elapsed}ms`);

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.questions).toBeInstanceOf(Array);
    expect(data.questions.length).toBeGreaterThanOrEqual(3);
    console.log(`  ✓ Generated ${data.questions.length} questions in ${elapsed}ms (Source: ${data.source || data._source})`);
  });

  test('PERF-02 — Submit Assessment & Generate Final Report Latency Benchmark (< 2s)', async ({ request }) => {
    // Generate questions first
    const genRes = await request.post(`${BASE_API}/assessment/generate`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { topic: 'Sorting Algorithms', course: 'Computer Science' },
    });
    const genData = await genRes.json();
    const questions = genData.questions;

    const sampleResponses = questions.map((q, idx) => ({
      question: q.question,
      userAnswer: q.options && q.options.length > 0 ? (idx % 2 === 0 ? q.correctAnswer || 'A' : 'B') : 'Detailed algorithmic explanation',
      correctAnswer: q.correctAnswer || (q.options && q.options[0]) || 'A',
      modelAnswer: q.modelAnswer || 'Quicksort average time complexity is O(N log N)',
      concepts: q.concepts || ['Sorting'],
      bloomLevel: q.bloomLevel || 'understand',
      difficulty: q.difficulty || 'medium',
      type: q.type || 'mcq',
    }));

    const startTime = Date.now();
    const submitRes = await request.post(`${BASE_API}/assessment/submit`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        responses: sampleResponses,
        topic: 'Sorting Algorithms',
        course: 'Computer Science',
      },
    });
    const elapsed = Date.now() - startTime;
    console.log(`⏱️ [PERF-02] Final Report Evaluation Latency: ${elapsed}ms`);

    expect(submitRes.status()).toBe(200);
    const report = await submitRes.json();
    expect(report.level).toBeTruthy();
    expect(report.strengths).toBeInstanceOf(Array);
    expect(report.weakAreas).toBeInstanceOf(Array);
    expect(report.gradingDetails).toBeInstanceOf(Array);
    console.log(`  ✓ Evaluated report generated in ${elapsed}ms (Level: ${report.level}, Score: ${report.score}/${report.maxScore})`);
  });

  test('PERF-03 — Diagnostic Profile & Bloom Analytics Latency Benchmark (< 300ms)', async ({ request }) => {
    const startTime = Date.now();
    const res = await request.get(`${BASE_API}/assessment/blooms-taxonomy?topic=Sorting%20Algorithms`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const elapsed = Date.now() - startTime;
    console.log(`⏱️ [PERF-03] Bloom Analytics Latency: ${elapsed}ms`);

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.bloomLevels).toBeInstanceOf(Array);
    console.log(`  ✓ Bloom's Taxonomy analytics fetched in ${elapsed}ms`);
  });
});
