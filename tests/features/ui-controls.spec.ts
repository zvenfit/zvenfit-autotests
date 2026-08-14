import { expect, test } from '@playwright/test';
import { blockNonEssentialResources } from '../support/network';

test.describe('Поведение классов UI-кнопок', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required');
    await blockNonEssentialResources(page, baseURL, {
      allowLayoutResources: true,
      allowRuntimeResources: true,
    });
  });

  test('мобильное меню раскрывает навигацию', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Мобильное меню проверяется на mobile viewport');
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const toggle = page.locator('.w-dropdown-toggle').first();
    const menu = page.locator('.w-dropdown-list').first();
    await toggle.click();

    await expect(menu).toBeVisible();
    await expect(menu.locator('a[href="/forma-dlya-zayavki/"]')).toBeVisible();
  });

  test('Webflow-слайдер переключает активный слайд', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const slides = page.locator('.w-slider .w-slide');
    const activeBefore = await slides.evaluateAll(items => items.findIndex(item => item.getAttribute('aria-hidden') !== 'true'));
    await page.getByRole('button', { name: 'Следующий слайд' }).click();
    await expect
      .poll(() => slides.evaluateAll(items => items.findIndex(item => item.getAttribute('aria-hidden') !== 'true')))
      .not.toBe(activeBefore);
  });

  test('карусель отзывов не оставляет активных кнопок внутри скрытого блока', async ({ page }) => {
    await page.goto('/gruppovye-trenirovki/', { waitUntil: 'domcontentloaded' });

    const section = page.locator('.reviews-section');
    const wrapper = page.locator('.reviews-wrapper');
    const next = page.getByRole('button', { name: 'Следующий отзыв', includeHidden: true });
    const previous = page.getByRole('button', { name: 'Предыдущий отзыв', includeHidden: true });

    await expect(next).toBeAttached();
    await expect(previous).toBeAttached();

    if (await section.isVisible()) {
      const start = await wrapper.evaluate(element => element.scrollLeft);
      await next.click();
      await expect.poll(() => wrapper.evaluate(element => element.scrollLeft)).toBeGreaterThan(start);
      await previous.click();
      await expect.poll(() => wrapper.evaluate(element => element.scrollLeft)).toBeLessThanOrEqual(start);
    } else {
      await expect(section).toBeHidden();
      await expect(next).toBeHidden();
      await expect(previous).toBeHidden();
    }
  });

  test('горизонтальный аккордеон переносит active-состояние', async ({ page, isMobile }) => {
    test.skip(isMobile, 'На mobile используется отдельная вертикальная раскладка без кнопок');
    await page.goto('/personalnye-trenirovki/', { waitUntil: 'domcontentloaded' });

    const components = page.locator('.accordions_horizontal .accordion_horizontal-component');
    await expect(components.first()).toHaveClass(/\bactive\b/);
    await components.nth(1).click();

    await expect(components.first()).not.toHaveClass(/\bactive\b/);
    await expect(components.nth(1)).toHaveClass(/\bactive\b/);
    await expect(components.nth(1).locator('.accordion_horizontal-bottom')).toHaveClass(/\bactive\b/);
  });

  test('fragment-кнопка приводит к существующему разделу', async ({ page }) => {
    await page.goto('/gruppovye-trenirovki/', { waitUntil: 'domcontentloaded' });
    await page.locator('a[href="#app"]:visible').first().click();

    await expect(page).toHaveURL(/#app$/);
    await expect(page.locator('#app')).toBeVisible();
  });

  test('кнопка назад возвращает на предыдущую страницу', async ({ page }) => {
    await page.goto('/trenery/', { waitUntil: 'domcontentloaded' });
    await page.goto('/trenery/trener-anna/', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-back]').click();

    await expect(page).toHaveURL(/\/trenery\/$/);
  });
});
