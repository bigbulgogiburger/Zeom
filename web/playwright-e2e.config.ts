import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for running E2E tests against already-running servers.
 * Usage: npx playwright test --config=playwright-e2e.config.ts
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream',
          ],
        },
        permissions: ['camera', 'microphone'],
      },
    },
  ],
  // No webServer — expects backend (8080) and frontend (3000) already running
});
