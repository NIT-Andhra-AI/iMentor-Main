// tests/e2e/19_adaptive_learning_profile.spec.js — Student Adaptive Profile & Bloom Progression
import { test, expect } from '@playwright/test';

test.describe('MOD-ADAPTIVE — Adaptive Learning Profile & Mastery Matrix', () => {

  test('ADAPT-01 — Query Student Profile & Concept Mastery via API', async ({ request }) => {
    // Authenticate as student01
    const authRes = await request.post('http://localhost:5005/api/auth/signin', {
      data: { email: 'student01@imentor.edu', password: 'password123' }
    });
    expect(authRes.status()).toBe(200);
    const authData = await authRes.json();
    const token = authData.token;
    expect(token).toBeDefined();

    // Fetch user profile
    const profileRes = await request.get('http://localhost:5005/api/user/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(profileRes.status()).toBe(200);
    const profile = await profileRes.json();
    expect(profile.branch).toBe('Computer Science');
    expect(profile.learningLevel).toBe('NOVICE');
    expect(profile.hasCompletedOnboarding).toBe(true);
  });

  test('ADAPT-02 — Verify Gamification Bounties & Points for Student', async ({ request }) => {
    const authRes = await request.post('http://localhost:5005/api/auth/signin', {
      data: { email: 'student02@imentor.edu', password: 'password123' }
    });
    const { token } = await authRes.json();

    const gameRes = await request.get('http://localhost:5005/api/gamification/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(gameRes.status()).toBe(200);
  });

});
