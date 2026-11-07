import { defineConfig, devices } from '@playwright/test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const databaseDir = mkdtempSync(path.join(tmpdir(), 'payload-ai-e2e-'))
const port = 3107

export default defineConfig({
  testDir: './dev',
  testMatch: '**/e2e.spec.{ts,js}',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 90_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `pnpm exec next dev dev --port ${port}`,
    reuseExistingServer: false,
    url: `http://localhost:${port}/admin`,
    timeout: 180_000,
    env: {
      DATABASE_URI: `file:${path.join(databaseDir, 'test.db')}`,
      PAYLOAD_SECRET: 'disposable-e2e-test-secret',
      NEXT_TELEMETRY_DISABLED: '1',
      PAYLOAD_AI_E2E: '1',
    },
  },
})
