import { defineConfig, devices } from '@playwright/test';

// Local end-to-end smoke test (issue #28). It runs against an already-running
// dev stack (docker compose up) — see README "End-to-end booking test". Override
// the target with E2E_BASE_URL if the frontend is served elsewhere.
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:4200';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
