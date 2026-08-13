import { expect, test } from '@playwright/test';
import { SchedulePage } from '../../pages/schedule.page';
import {
  fulfillJson,
  installScheduleRuntimeConfig,
  scheduleResponse,
} from '../support/api-stubs';

test.describe('Расписание с полностью локальным API', () => {
  test.beforeEach(async ({ page }) => installScheduleRuntimeConfig(page));

  test('запрашивает двухнедельный диапазон и показывает занятия', async ({ page }) => {
    let requestUrl = '';
    await page.route('https://api.local.test/schedule?**', async route => {
      requestUrl = route.request().url();
      await fulfillJson(route, 200, scheduleResponse(requestUrl));
    });

    const schedule = new SchedulePage(page);
    await schedule.open();

    await expect(schedule.event('Пилатес на реформере')).toBeVisible();
    await expect(schedule.event('Персональная тренировка')).toBeVisible();
    const url = new URL(requestUrl);
    const from = new Date(`${url.searchParams.get('from')}T12:00:00Z`);
    const to = new Date(`${url.searchParams.get('to')}T12:00:00Z`);
    expect((to.getTime() - from.getTime()) / 86_400_000).toBe(13);
  });

  test('фильтрует по типу, клубу и залу и умеет сбрасывать фильтры', async ({ page }) => {
    await page.route('https://api.local.test/schedule?**', route =>
      fulfillJson(route, 200, scheduleResponse(route.request().url())),
    );

    const schedule = new SchedulePage(page);
    await schedule.open();
    const group = schedule.event('Пилатес на реформере');
    const personal = schedule.event('Персональная тренировка');

    await schedule.typeFilters.getByRole('button', { name: 'Групповые' }).click();
    await expect(group).toBeVisible();
    await expect(personal).toBeHidden();
    await page.getByRole('button', { name: 'Сбросить' }).click();
    await expect(personal).toBeVisible();

    await page.getByRole('combobox', { name: 'Клуб', exact: true }).selectOption('ZvenFit — женская студия');
    await expect(group).toBeHidden();
    await expect(personal).toBeVisible();
    await page.getByRole('button', { name: 'Сбросить' }).click();

    await page.getByRole('combobox', { name: 'Зал', exact: true }).selectOption('Зал реформеров');
    await expect(group).toBeVisible();
    await expect(personal).toBeHidden();
  });

  test('открывает dialog с клавиатуры и очищает небезопасное HTML-описание', async ({ page }) => {
    const unsafeDescription =
      '<strong>Безопасное описание</strong><script>window.__scheduleXss = true</script><a href="javascript:alert(1)">bad</a>';
    await page.route('https://api.local.test/schedule?**', route =>
      fulfillJson(route, 200, scheduleResponse(route.request().url(), unsafeDescription)),
    );

    const schedule = new SchedulePage(page);
    await schedule.open();
    const event = schedule.event('Пилатес на реформере');
    await event.focus();
    await event.press('Enter');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Безопасное описание');
    await expect(dialog.locator('script')).toHaveCount(0);
    await expect(dialog.locator('a[href^="javascript:"]')).toHaveCount(0);
    expect(await page.evaluate(() => (window as typeof window & { __scheduleXss?: boolean }).__scheduleXss)).toBeUndefined();
    await dialog.getByRole('button', { name: 'Закрыть' }).click();
    await expect(dialog).toBeHidden();
  });

  test('показывает пустую следующую неделю без повторного запроса API', async ({ page }) => {
    let calls = 0;
    await page.route('https://api.local.test/schedule?**', route => {
      calls += 1;
      return fulfillJson(route, 200, scheduleResponse(route.request().url()));
    });

    const schedule = new SchedulePage(page);
    await schedule.open();
    await page.getByRole('button', { name: 'Следующая неделя' }).click();

    await expect(page.getByText('На этой неделе занятий нет')).toBeVisible();
    expect(calls).toBe(1);
  });

  test('различает HTTP-ошибку и некорректный payload', async ({ page }) => {
    let responseMode: 'http' | 'invalid' = 'http';
    await page.route('https://api.local.test/schedule?**', route =>
      responseMode === 'http'
        ? fulfillJson(route, 503, { ok: false })
        : fulfillJson(route, 200, { ok: true, items: 'not-an-array' }),
    );

    const schedule = new SchedulePage(page);
    await schedule.open();
    await expect(schedule.error).toContainText('API вернул ошибку');

    responseMode = 'invalid';
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(schedule.error).toContainText('API вернул некорректный ответ');
  });
});
