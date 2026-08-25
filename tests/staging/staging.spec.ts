import { expect, test, type Page } from '@playwright/test';

import { blockNonEssentialResources } from '../support/network';

const STAGING_ORIGIN = 'https://staging.zvenfit.ru';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  await blockNonEssentialResources(page, STAGING_ORIGIN, {
    allowExternalDocuments: false,
    allowLayoutResources: true,
    allowRuntimeResources: true,
  });
});

async function expectStagingLocation(page: Page, pathname: string) {
  const currentUrl = new URL(page.url());
  expect(currentUrl.origin).toBe(STAGING_ORIGIN);
  expect(currentUrl.pathname).toBe(pathname);
}

test('rejects unauthenticated access at the gateway', async () => {
  const response = await fetch(`${STAGING_ORIGIN}/`, {
    redirect: 'manual',
    headers: {
      'Cache-Control': 'no-store',
      'User-Agent': 'ZvenFit-Playwright-Staging/1.0',
      'X-Zvenfit-Test-Run': 'playwright-staging-read-only',
    },
  });

  expect(response.status).toBe(401);
});

test('serves an authenticated noindex build without production analytics', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  await expectStagingLocation(page, '/');
  await expect(page).toHaveTitle(/ZvenFit/i);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
  await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0);
  await expect(page.locator('script[src*="mc.yandex.ru"]')).toHaveCount(0);
});

test('renders the isolated synthetic schedule', async ({ page }) => {
  const response = await page.goto('/raspisanie/');

  expect(response?.status()).toBe(200);
  await expectStagingLocation(page, '/raspisanie/');
  await expect(page.getByRole('heading', { name: /расписание занятий/i })).toBeVisible();

  const schedule = page.locator('[data-schedule-root]');
  await expect(schedule.locator('.schedule-state--error')).toHaveCount(0);
  await expect(schedule.locator('.schedule-event').first()).toBeVisible({ timeout: 20_000 });
  await expect(schedule.getByText('Тест: групповая тренировка', { exact: true })).toBeVisible();
});

test('serves the club card from the self-training entry point', async ({ page }) => {
  const gymResponse = await page.goto('/trenazhernyj-zal/');
  expect(gymResponse?.status()).toBe(200);

  const selfTrainingCard = page.locator('.cat_card.areas_page').filter({
    has: page.getByRole('heading', { level: 3, name: 'Самостоятельно' }),
  });
  const clubCardLink = selfTrainingCard.getByRole('link', { name: 'подробнее' });
  await expect(clubCardLink).toHaveAttribute('href', '/klubnaya-karta/');
  await clubCardLink.click();

  await expectStagingLocation(page, '/klubnaya-karta/');
  await expect(page.getByRole('heading', { level: 1, name: 'Клубная карта' })).toBeVisible();
  await expect(page.locator('.club-card-price')).toHaveCount(6);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
});

test('blocks an invalid lead in the browser without calling the API', async ({ page }) => {
  let leadRequests = 0;
  await page.route('**/api/lead', route => {
    leadRequests += 1;
    return route.abort('blockedbyclient');
  });

  const response = await page.goto('/forma-dlya-zayavki/');
  expect(response?.status()).toBe(200);
  await expectStagingLocation(page, '/forma-dlya-zayavki/');

  const name = page.getByLabel('Имя', { exact: true });
  await page.getByRole('button', { name: 'Отправить', exact: true }).click();

  expect(await name.evaluate(element => element.matches(':invalid'))).toBe(true);
  await page.waitForTimeout(250);
  expect(leadRequests).toBe(0);
});
