import { expect, test } from '@playwright/test';

import { ClubCardPage } from '../../pages/club-card.page';
import { blockNonEssentialResources } from '../support/network';

const tariffs = [
  ['Карта «Утро» (365)', '34 000 ₽'],
  ['Карта «День» (365)', '29 000 ₽'],
  ['Карта «Безлимит» (365)', '42 000 ₽'],
  ['Карта «3 месяца»', '15 000 ₽'],
  ['Карта «Месяц»', '6 000 ₽'],
  ['Разовое посещение', '1 000 ₽'],
] as const;

test.describe('Клубная карта', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required');
    await blockNonEssentialResources(page, baseURL, {
      allowLayoutResources: true,
      allowRuntimeResources: true,
    });
  });

  test('показывает виды карт, актуальные тарифы и безопасные CTA', async ({ page }) => {
    const clubCard = new ClubCardPage(page);
    await clubCard.goto();

    await expect(clubCard.heading).toBeVisible();
    await expect(clubCard.typeCards).toHaveCount(5);
    await expect(clubCard.priceCards).toHaveCount(tariffs.length);

    for (const [name, price] of tariffs) {
      const card = clubCard.priceCard(name);
      await expect(card).toBeVisible();
      await expect(card).toContainText(price);
    }

    const leadLinks = page.getByRole('link', { name: 'оставить заявку' });
    expect(await leadLinks.count()).toBeGreaterThanOrEqual(8);
    for (const link of await leadLinks.all()) {
      await expect(link).toHaveAttribute('href', '/forma-dlya-zayavki/');
    }

    const duplicateIds = await page.locator('[id]').evaluateAll(elements => {
      const ids = elements.map(element => element.id);
      return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    });
    expect(duplicateIds).toEqual([]);
  });

  test('доступна по пути Главная → Фитнес-зал → Самостоятельно', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('a[href="/trenazhernyj-zal/"]:visible').first().click();
    await expect(page).toHaveURL(/\/trenazhernyj-zal\/$/);

    const selfTrainingCard = page.locator('.cat_card.areas_page').filter({
      has: page.getByRole('heading', { level: 3, name: 'Самостоятельно' }),
    });
    const clubCardLink = selfTrainingCard.getByRole('link', { name: 'подробнее' });
    await expect(clubCardLink).toHaveAttribute('href', '/klubnaya-karta/');
    await clubCardLink.click();

    await expect(page).toHaveURL(/\/klubnaya-karta\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Клубная карта' })).toBeVisible();
  });

  test('карусель отзывов управляется семантическими кнопками', async ({ page }) => {
    const clubCard = new ClubCardPage(page);
    await clubCard.goto();

    await expect(clubCard.reviewCards).toHaveCount(7);
    await expect(clubCard.previousReview).toBeDisabled();

    for (const button of [clubCard.previousReview, clubCard.nextReview]) {
      const box = await button.boundingBox();
      expect(box).not.toBeNull();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }

    const initialScroll = await clubCard.reviewsWrapper.evaluate(element => element.scrollLeft);
    await clubCard.nextReview.click();
    await expect
      .poll(() => clubCard.reviewsWrapper.evaluate(element => element.scrollLeft))
      .toBeGreaterThan(initialScroll);
    await expect(clubCard.previousReview).toBeEnabled();
  });

  test('мобильное меню приводит к тарифам без перекрытия заголовка', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Мобильный якорь проверяется в mobile-проекте');
    const clubCard = new ClubCardPage(page);
    await clubCard.goto();

    await page.getByRole('button', { name: 'меню' }).click();
    await page.getByRole('link', { name: 'тарифы', exact: true }).click();

    await expect(page).toHaveURL(/#prices$/);
    await expect
      .poll(() =>
        page.locator('#prices').evaluate(element =>
          Math.round(element.getBoundingClientRect().top),
        ),
      )
      .toBe(104);
    await expect(page.getByRole('heading', { level: 2, name: 'тарифы и цены' })).toBeVisible();
  });

  test('контакты доступны из мобильного меню на обеих мобильных раскладках', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Обе мобильные раскладки проверяются в mobile-проекте');

    for (const width of [375, 600]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/klubnaya-karta/', { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'меню' }).click();
      await page.getByRole('link', { name: 'контакты', exact: true }).click();

      await expect(page).toHaveURL(/#contacts$/);
      await expect
        .poll(() =>
          page.locator('#contacts').evaluate(element =>
            Math.round(element.getBoundingClientRect().top),
          ),
        )
        .toBe(104);

      const visibleFooter = width < 480 ? page.locator('.section-3') : page.locator('.section-4');
      await expect(visibleFooter).toBeVisible();
    }
  });

  test('skip-link переносит клавиатурный фокус к основному содержимому', async ({ page }) => {
    const clubCard = new ClubCardPage(page);
    await clubCard.goto();

    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'К содержимому' });
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.locator('#main-content')).toBeFocused();
  });
});
