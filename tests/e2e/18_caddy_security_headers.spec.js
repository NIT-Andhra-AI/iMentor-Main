// tests/e2e/18_caddy_security_headers.spec.js — Caddy HTTPS & Edge Security Verification
import { test, expect } from '@playwright/test';

test.describe('MOD-CADDY-SEC — Caddy Reverse Proxy & Security Header Compliance', () => {

  test('CADDY-01 — Verify Caddy Root Proxy to Vite Frontend', async ({ request }) => {
    const response = await request.get('https://localhost', { ignoreHTTPSErrors: true });
    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers['content-type']).toContain('text/html');
  });

  test('CADDY-02 — Verify Caddy Testaddr Diagnostic Probe', async ({ request }) => {
    const response = await request.get('https://localhost/testaddr', { ignoreHTTPSErrors: true });
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('iMentor Platform is running');
  });

  test('CADDY-03 — Enforce Security Headers (HSTS, X-Frame-Options, NoSniff)', async ({ request }) => {
    const response = await request.get('https://localhost/testaddr', { ignoreHTTPSErrors: true });
    const headers = response.headers();
    expect(headers['strict-transport-security']).toContain('max-age=');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
  });

});
