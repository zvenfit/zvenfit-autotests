import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const testPort = Number(process.env.ZVENFIT_TEST_PORT ?? '43987');
const baseURL = externalBaseUrl ?? `http://127.0.0.1:${testPort}`;
const projectRoot = __dirname;
const frontendRoot = process.env.ZVENFIT_FRONTEND_PATH
  ? path.resolve(process.env.ZVENFIT_FRONTEND_PATH)
  : path.resolve(__dirname, '../zvenfit-frontend');
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? 'line' : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: {
    timeout: 7_000,
  },
  outputDir: 'test-results',
  use: {
    baseURL,
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    extraHTTPHeaders: externalBaseUrl ? { 'X-Zvenfit-Test-Run': 'playwright-read-only' } : undefined,
    trace: isCI ? 'off' : 'retain-on-failure',
    screenshot: isCI ? 'off' : 'only-on-failure',
    video: isCI ? 'off' : 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: 'npm run serve:frontend',
        cwd: projectRoot,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 30_000,
        env: {
          ZVENFIT_FRONTEND_PATH: frontendRoot,
          ZVENFIT_TEST_PORT: String(testPort),
        },
      },
});
