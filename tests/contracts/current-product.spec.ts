import { expect, test } from '@playwright/test';

import { blockNonEssentialResources } from '../support/network';

const appLinks = [
  ['Скачать ZvenFit в App Store', 'https://apps.apple.com/ru/app/id6748636800'],
  ['Скачать ZvenFit в RuStore', 'https://www.rustore.ru/catalog/app/io.fitbase.zvenfit'],
  ['Скачать APK ZvenFit для Android', 'https://mobile.fitbase.io/public/android-build/zvenfit/app-release.apk'],
] as const;

test.describe('Актуальные продуктовые блоки', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    if (!baseURL) {
      throw new Error('Playwright baseURL is required');
    }

    await blockNonEssentialResources(page, baseURL);
  });

  test('главная отражает три направления, две площадки и мобильное приложение', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { level: 1, name: 'zvenfit' })).toBeVisible();
    await expect(page.locator('a[href="/trenazhernyj-zal/"]').first()).toBeAttached();
    await expect(page.locator('a[href="/gruppovye-trenirovki/"]').first()).toBeAttached();
    await expect(page.locator('a[href="/pilates-na-reformere/"]').first()).toBeAttached();
    await expect(page.locator('.footer-location__address:visible').filter({ hasText: 'Чехова 13А' }).first()).toBeVisible();
    await expect(
      page.locator('.footer-location__address:visible').filter({ hasText: /Нахабинское шоссе.*7А/ }).first(),
    ).toBeVisible();
    await expect(page.getByText('мобильное приложение', { exact: true }).first()).toBeAttached();
  });

  test('страница групповых программ содержит актуальные тарифы и раскрывает всю команду', async ({ page }) => {
    await page.goto('/gruppovye-trenirovki/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Групповые тренировки для девушек');
    await expect(page.getByText('1000₽', { exact: true })).toBeVisible();
    await expect(page.getByText('57600₽', { exact: true })).toBeAttached();

    const toggle = page.locator('[data-coaches-toggle]');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toContainText('СКРЫТЬ');
    await expect(page.getByRole('heading', { name: 'Ксения Ощепкова' })).toBeVisible();
  });

  test('страница контактов содержит площадки, мессенджеры и ссылки на приложение', async ({ page }) => {
    await page.goto('/contacts/platforms/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('link', { name: /фитнес-клуб ZvenFit.*Яндекс Картах/ })).toHaveCount(1);
    await expect(page.getByRole('link', { name: /женскую студию ZvenFit.*Яндекс Картах/ })).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Открыть Telegram ZvenFit' })).toHaveAttribute(
      'href',
      'https://t.me/zvenfit',
    );
    await expect(page.getByRole('link', { name: 'Написать в WhatsApp ZvenFit' })).toHaveAttribute(
      'href',
      'https://wa.me/79253082323',
    );

    for (const [name, href] of appLinks) {
      await expect(page.getByRole('link', { name })).toHaveAttribute('href', href);
    }
  });

  test('промо приложения объясняет скидку и ведёт в три магазина', async ({ page }) => {
    await page.goto('/promos/apps/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { level: 1 })).toContainText('скидку 15%');
    await expect(page.locator('#promo-terms')).toContainText('Скидка 15%');
    await expect(page.locator('#promo-terms')).toContainText('первый абонемент');

    for (const [name, href] of appLinks) {
      await expect(page.getByRole('link', { name })).toHaveAttribute('href', href);
    }
  });
});
