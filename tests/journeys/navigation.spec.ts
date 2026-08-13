import { expect, test } from '@playwright/test';
import { blockNonEssentialResources } from '../support/network';

test.describe('Read-only пользовательские переходы', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    if (!baseURL) {
      throw new Error('Playwright baseURL is required');
    }

    await blockNonEssentialResources(page, baseURL);
  });

  test('главный CTA открывает актуальную форму заявки', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('a[href="/forma-dlya-zayavki/"]:visible').first().click();

    await expect(page).toHaveURL(/\/forma-dlya-zayavki\/$/);
    await expect(page.getByLabel('Имя')).toBeVisible();
  });

  test('карточки главной ведут во все три основных направления', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    for (const route of [
      '/trenazhernyj-zal/',
      '/gruppovye-trenirovki/',
      '/pilates-na-reformere/',
    ]) {
      await expect(page.locator(`a[href="${route}"]`).first()).toBeAttached();
    }
  });

  test('из каталога тренеров можно открыть профиль и перейти к записи', async ({ page }) => {
    await page.goto('/trenery/', { waitUntil: 'domcontentloaded' });
    const profileLink = page.locator('a[href^="/trenery/trener-"]:visible').first();
    const profileHref = await profileLink.getAttribute('href');
    expect(profileHref).toMatch(/^\/trenery\/trener-.+\/$/);
    await profileLink.click();

    await expect(page).toHaveURL(new RegExp(`${profileHref}$`));
    await expect(page.getByRole('link', { name: 'Записаться к тренеру' })).toHaveAttribute(
      'href',
      '/forma-dlya-zayavki/',
    );
  });

  test('юридические документы доступны из footer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const legal = page.getByRole('navigation', { name: 'Правовая информация' }).first();

    await expect(legal.getByRole('link', { name: 'Политика конфиденциальности' })).toHaveAttribute(
      'href',
      '/privacy/',
    );
    await expect(legal.getByRole('link', { name: /Политика оплаты/ })).toHaveAttribute(
      'href',
      '/payment-policy/',
    );
    await expect(legal.getByRole('link', { name: 'Публичная оферта' })).toHaveAttribute('href', '/offer/');
  });
});
