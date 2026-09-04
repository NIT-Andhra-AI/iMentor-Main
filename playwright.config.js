// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never', outputFolder: 'tests/reports/playwright-html' }],
    ['list'],
    ['json', { outputFile: 'tests/reports/playwright-results.json' }]
  ],
  timeout: 180000,
  expect: { timeout: 30000 },
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3006',
    headless: true,             // ← headless for agent/CI execution
    slowMo: 50,                 // ← snappy yet stable event pacing
    video: 'retain-on-failure',  // ← record and retain video on failure
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 30000,
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'cd frontend && npm run dev',
    url: 'http://localhost:3005',
    timeout: 120000,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',       // ← use real installed Google Chrome
      },
    },
  ],
});
