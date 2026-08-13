import { expect, test } from '@playwright/test';

test.describe('Production runtime-конфигурация', () => {
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
