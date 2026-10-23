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

// Staging sits behind a shared cloud ingress that may drop TCP handshakes. The
// browser reaches it through a local CONNECT proxy that re-dials the origin on
// a fresh socket (scripts/connect-retry-proxy.ts); TLS stays end-to-end.
// STAGING_CONNECT_RETRY=0 switches the tunnel off.
const connectRetryEnabled = process.env.STAGING_CONNECT_RETRY !== '0';
const proxyPort = Number(process.env.STAGING_PROXY_PORT ?? '43989');

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
    proxy: connectRetryEnabled ? { server: `http://127.0.0.1:${proxyPort}` } : undefined,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: connectRetryEnabled
    ? {
        command: 'npm run serve:staging-proxy',
        port: proxyPort,
        reuseExistingServer: false,
        timeout: 15_000,
        stdout: 'pipe',
        stderr: 'pipe',
        env: {
          STAGING_PROXY_PORT: String(proxyPort),
          STAGING_PROXY_ALLOWED_HOST: baseUrl.hostname,
        },
      }
    : undefined,
});
