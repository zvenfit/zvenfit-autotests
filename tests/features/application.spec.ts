import { expect, test } from '@playwright/test';
import { ApplicationPage } from '../../pages/application.page';
import { fulfillJson, installLeadRuntimeConfig, type LeadPayload } from '../support/api-stubs';

test.describe('Форма заявки с полностью локальным API', () => {
  test.beforeEach(async ({ page }) => installLeadRuntimeConfig(page));

  test('не отправляет неполную форму благодаря browser validation', async ({ page }) => {
    let apiCalls = 0;
    await page.route('https://api.local.test/lead', route => {
      apiCalls += 1;
      return fulfillJson(route, 200, { ok: true });
    });

    const application = new ApplicationPage(page);
    await application.open();
    await application.name.fill('Без телефона');
    await application.submit.click();

    expect(apiCalls).toBe(0);
    const validationMessage = await application.phone.evaluate(
      element => (element as HTMLInputElement).validationMessage,
    );
    expect(validationMessage).not.toBe('');
  });

  test('Telegram username появляется и становится обязательным только для Telegram', async ({ page }) => {
    const application = new ApplicationPage(page);
    await application.open();

    await expect(application.telegramUsername).toBeHidden();
    await application.contactMethod.selectOption('Telegram');
    await expect(application.telegramUsername).toBeVisible();
    await expect(application.telegramUsername).toHaveAttribute('required', '');
    await expect(application.telegramUsername).toHaveAttribute('aria-required', 'true');

    await application.contactMethod.selectOption('WhatsApp');
    await expect(application.telegramUsername).toBeHidden();
    await expect(application.telegramUsername).not.toHaveAttribute('required', '');
  });

  test('успешно отправляет только ожидаемый payload в mock', async ({ page }) => {
    let payload: LeadPayload | undefined;
    await page.route('https://api.local.test/lead', async route => {
      payload = route.request().postDataJSON() as LeadPayload;
      await fulfillJson(route, 200, { ok: true, lead_id: 'local-only' });
    });

    const application = new ApplicationPage(page);
    await application.open();
    await application.fill({ contactMethod: 'Telegram', telegramUsername: '@local_test' });
    await application.submit.click();

    await expect(application.success).toContainText('Спасибо! Ваша заявка получена!');
    expect(payload).toMatchObject({
      name: 'Тестовый посетитель',
      phone: '+7 (999) 000-00-00',
      service: 'Telegram',
      telegram_username: '@local_test',
      company_website: '',
    });
    expect(payload?.submission_id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  test('передаёт актуальную UTM-атрибуцию', async ({ page }) => {
    let payload: LeadPayload | undefined;
    await page.route('https://api.local.test/lead', async route => {
      payload = route.request().postDataJSON() as LeadPayload;
      await fulfillJson(route, 200, { ok: true });
    });

    const application = new ApplicationPage(page);
    await application.open('?utm_source=e2e&utm_medium=local&utm_campaign=current-site&gclid=test-click');
    await application.fill();
    await application.submit.click();

    await expect(application.success).toBeVisible();
    expect(payload?.utm).toEqual({
      utm_source: 'e2e',
      utm_medium: 'local',
      utm_campaign: 'current-site',
      gclid: 'test-click',
    });
  });

  test('повторяет временно упавшую отправку с тем же submission_id', async ({ page }) => {
    const payloads: LeadPayload[] = [];
    await page.route('https://api.local.test/lead', async route => {
      payloads.push(route.request().postDataJSON() as LeadPayload);
      const isFirstAttempt = payloads.length === 1;
      await fulfillJson(route, isFirstAttempt ? 503 : 200, { ok: !isFirstAttempt });
    });

    const application = new ApplicationPage(page);
    await application.open();
    await application.fill({ name: 'Повторяемая заявка' });
    await application.submit.click();
    await expect(application.error).toContainText('Не удалось отправить заявку');
    await expect(application.name).toHaveValue('Повторяемая заявка');

    await application.submit.click();
    await expect(application.success).toBeVisible();
    expect(payloads).toHaveLength(2);
    expect(payloads[1].submission_id).toBe(payloads[0].submission_id);
  });

  test('показывает отдельное сообщение при rate limit', async ({ page }) => {
    await page.route('https://api.local.test/lead', route =>
      fulfillJson(route, 429, { ok: false, error: 'rate_limited' }),
    );

    const application = new ApplicationPage(page);
    await application.open();
    await application.fill();
    await application.submit.click();

    await expect(application.error).toContainText('Слишком много попыток');
    await expect(application.submit).toBeEnabled();
  });
});
