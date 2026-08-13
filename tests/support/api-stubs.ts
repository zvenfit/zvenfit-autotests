import type { Page, Route } from '@playwright/test';

export type LeadPayload = {
  submission_id: string;
  name: string;
  phone: string;
  service: string;
  telegram_username: string;
  company_website: string;
  utm?: Record<string, string>;
};

export async function installLeadRuntimeConfig(page: Page): Promise<void> {
  await page.route('**/js/lead-config.js*', route =>
    route.fulfill({
      contentType: 'text/javascript',
      body: "window.ZVENFIT_LEAD_API = 'https://api.local.test/lead';",
    }),
  );
}

export async function installScheduleRuntimeConfig(page: Page): Promise<void> {
  await page.route('**/js/schedule-config.js*', route =>
    route.fulfill({
      contentType: 'text/javascript',
      body: "window.ZVENFIT_SCHEDULE_API = 'https://api.local.test/schedule';",
    }),
  );
}

export async function fulfillJson(
  route: Route,
  status: number,
  body: Record<string, unknown>,
): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  });
}

export function scheduleResponse(requestUrl: string, description = 'Локальное тестовое занятие.') {
  const url = new URL(requestUrl);
  const from = url.searchParams.get('from') ?? '2026-01-05';
  const to = url.searchParams.get('to') ?? from;
  const items = [
    {
      id: 'group-test',
      date: from,
      timeStart: '10:00',
      timeEnd: '11:00',
      duration: 60,
      title: 'Пилатес на реформере',
      description,
      color: '#00d10e',
      trainers: [{ name: 'Тестовый тренер', photo: '' }],
      place: 'Зал реформеров',
      club: 'ZvenFit — фитнес-клуб',
      type: 'group',
      ageType: 'adult',
      cancelled: false,
      registrationClosed: false,
      registrationRequired: true,
      maxParticipants: 8,
      transfer: null,
    },
    {
      id: 'personal-test',
      date: from,
      timeStart: '12:00',
      timeEnd: '13:00',
      duration: 60,
      title: 'Персональная тренировка',
      description: 'Локальное индивидуальное занятие.',
      color: '#4da6ff',
      trainers: [{ name: 'Другой тестовый тренер', photo: '' }],
      place: 'Тренажёрный зал',
      club: 'ZvenFit — женская студия',
      type: 'personal',
      ageType: 'adult',
      cancelled: false,
      registrationClosed: false,
      registrationRequired: false,
      maxParticipants: null,
      transfer: null,
    },
  ];

  return { ok: true, from, to, count: items.length, items };
}
