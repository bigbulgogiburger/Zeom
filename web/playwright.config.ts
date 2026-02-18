import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
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
            '--allow-file-access',
          ],
        },
        permissions: ['camera', 'microphone'],
      },
    },
  ],
  webServer: [
    {
      command: [
        'cd ../backend &&',
        'AUTH_ALLOW_E2E_ADMIN_BOOTSTRAP=true',
        `SENDBIRD_APP_ID=${process.env.SENDBIRD_APP_ID || ''}`,
        `SENDBIRD_API_TOKEN=${process.env.SENDBIRD_API_TOKEN || ''}`,
        './gradlew bootRun',
      ].join(' '),
      url: 'http://localhost:8080/actuator/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
});
