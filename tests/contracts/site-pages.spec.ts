import { expect, test } from '@playwright/test';
import { blockNonEssentialResources } from '../support/network';
import { legalRoutes, siteRoutes, trainerProfileRoutes } from '../support/site-catalog';

test.describe('Контракт всех страниц из актуального sitemap', () => {
  for (const route of siteRoutes) {
    test(`${route} доступна, индексируема и содержит основной контент`, async ({ page, isMobile }, testInfo) => {
      test.skip(Boolean(isMobile), 'Полный каталог страниц достаточно проверять один раз на desktop');

      const baseURL = String(testInfo.project.use.baseURL);
      await blockNonEssentialResources(page, baseURL);
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });

      expect(response, `Нет document response для ${route}`).not.toBeNull();
      expect(response?.status(), `HTTP status для ${route}`).toBeLessThan(400);
      await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
      await expect(page).not.toHaveTitle(/^\s*$/);

      const description = page.locator('meta[name="description"]');
      await expect(description).toHaveCount(1);
      expect((await description.getAttribute('content'))?.trim().length).toBeGreaterThan(30);

      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
      await expect(canonical).toHaveAttribute('href', `https://zvenfit.ru${route}`);

      const bodyText = (await page.locator('body').innerText()).trim();
      expect(bodyText.length, `Страница ${route} почти пустая`).toBeGreaterThan(100);

      if (trainerProfileRoutes.includes(route)) {
        await expect(page.locator('h2.heading-page').first()).toBeVisible();
        await expect(page.getByRole('link', { name: 'Записаться к тренеру' })).toHaveAttribute(
          'href',
          '/forma-dlya-zayavki/',
        );
      } else if (!legalRoutes.has(route)) {
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      }
    });
  }
});
