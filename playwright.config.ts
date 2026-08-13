import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const testPort = Number(process.env.ZVENFIT_TEST_PORT ?? '43987');
const baseURL = externalBaseUrl ?? `http://127.0.0.1:${testPort}`;
const projectRoot = __dirname;
const frontendRoot = process.env.ZVENFIT_FRONTEND_PATH
  ? path.resolve(process.env.ZVENFIT_FRONTEND_PATH)
  : path.resolve(__dirname, '../zvenfit-frontend');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['line'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: {
    timeout: 7_000,
  },
  outputDir: 'test-results',
  use: {
    baseURL,
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
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
