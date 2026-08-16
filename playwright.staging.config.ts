import { defineConfig, devices } from '@playwright/test';

const EXPECTED_ORIGIN = 'https://staging.zvenfit.ru';
const requestedBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? EXPECTED_ORIGIN;
const baseUrl = new URL(requestedBaseUrl);

if (
  baseUrl.origin !== EXPECTED_ORIGIN ||
  baseUrl.pathname !== '/' ||
  baseUrl.search ||
  baseUrl.hash
) {
  throw new Error(`Staging Playwright is restricted to ${EXPECTED_ORIGIN}`);
}

const username = process.env.STAGING_BASIC_AUTH_USERNAME ?? '';
const password = process.env.STAGING_BASIC_AUTH_PASSWORD ?? '';

if (!username || !password) {
  throw new Error(
    'STAGING_BASIC_AUTH_USERNAME and STAGING_BASIC_AUTH_PASSWORD are required',
  );
}

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests/staging',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1,
  reporter: isCI ? 'line' : 'list',
  timeout: 30_000,
  expect: {
    timeout: 7_000,
  },
  outputDir: 'test-results',
  use: {
    baseURL: EXPECTED_ORIGIN,
    httpCredentials: { username, password, origin: EXPECTED_ORIGIN },
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    userAgent: 'ZvenFit-Playwright-Staging/1.0',
    extraHTTPHeaders: {
      'X-Zvenfit-Test-Run': 'playwright-staging-read-only',
    },
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
