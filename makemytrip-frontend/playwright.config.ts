import { defineConfig, devices } from '@playwright/test'

/**
 * Browser smoke tests over the routes that render from bundled data.
 *
 * `webServer` builds and serves the frontend itself, so the suite has no
 * external dependency: no API, no Firestore, no credentials. That is deliberate
 * — a job that depends on the datastore fails whenever the quota does, and a
 * flaky gate gets ignored rather than fixed.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Retry in CI only; locally a flake should be seen, not hidden.
  retries: process.env.CI ? 2 : 0,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // A second engine catches layout and API differences the first hides.
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } }
  ]
})
