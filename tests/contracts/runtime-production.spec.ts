import { expect, test } from '@playwright/test';
import { blockNonEssentialResources } from '../support/network';

test.describe('Production runtime-конфигурация', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    if (!baseURL) {
      throw new Error('Playwright baseURL is required');
    }

    await blockNonEssentialResources(page, baseURL);
  });

  test('адрес lead API настроен в production', async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'Проверка предназначена только для внешнего стенда');
    await page.goto('/forma-dlya-zayavki/', { waitUntil: 'domcontentloaded' });

    const apiUrl = await page.evaluate(() => (window as typeof window & { ZVENFIT_LEAD_API?: string }).ZVENFIT_LEAD_API);
    expect(apiUrl).toMatch(/^https:\/\//);
  });

  test('адрес schedule API настроен в production', async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'Проверка предназначена только для внешнего стенда');
    await page.goto('/raspisanie/', { waitUntil: 'domcontentloaded' });

    const apiUrl = await page.evaluate(
      () => (window as typeof window & { ZVENFIT_SCHEDULE_API?: string }).ZVENFIT_SCHEDULE_API,
    );
    expect(apiUrl).toMatch(/^https:\/\//);
  });
});
