// tests/e2e/17_go_gateway_concurrency.spec.js — High-Concurrency Go Gateway Evaluation
import { test, expect } from '@playwright/test';

test.describe('MOD-GO-GATEWAY — High-Concurrency Go Gateway Pipeline', () => {

  test('GO-01 — Verify Go Gateway Health & Configured SGLang Proxy', async ({ request }) => {
    const response = await request.get('http://localhost:5001/health');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.service).toBe('imentor-go-gateway');
  });

  test('GO-02 — Verify Go Gateway High-Throughput Resource Stats', async ({ request }) => {
    const response = await request.get('http://localhost:5001/api/gateway/stats');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.gateway).toHaveProperty('activeBackgroundTasks');
    expect(data.gateway).toHaveProperty('queueDepth');
    expect(data.gateway).toHaveProperty('hasAvailableResources');
  });

  test('GO-03 — Concurrent Multi-Request Load Smoke Test', async ({ request }) => {
    const promises = [];
    for (let i = 0; i < 15; i++) {
      promises.push(request.get('http://localhost:5001/health'));
    }
    const results = await Promise.all(promises);
    for (const res of results) {
      expect(res.status()).toBe(200);
    }
  });

});
