import { expect, type Locator, type Page } from '@playwright/test';

export class ApplicationPage {
  readonly name: Locator;
  readonly phone: Locator;
  readonly contactMethod: Locator;
  readonly telegramUsername: Locator;
  readonly submit: Locator;
  readonly success: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByLabel('Имя');
    this.phone = page.getByLabel('Номер');
    this.contactMethod = page.getByLabel('Как с вами связаться?');
    this.telegramUsername = page.getByLabel('Ваш username в Telegram');
    this.submit = page.getByRole('button', { name: 'Отправить' });
    this.success = page.locator('#tg-send .success-message');
    this.error = page.locator('#tg-send .error-message');
  }

  async open(query = ''): Promise<void> {
    await this.page.goto(`/forma-dlya-zayavki/${query}`, { waitUntil: 'domcontentloaded' });
    await expect(this.page).toHaveTitle(/Запись в ZvenFit/);
    await expect(this.name).toBeVisible();
  }

  async fill(values: {
    name?: string;
    phone?: string;
    contactMethod?: 'Позвонить' | 'WhatsApp' | 'Макс' | 'Telegram';
    telegramUsername?: string;
  } = {}): Promise<void> {
    await this.name.fill(values.name ?? 'Тестовый посетитель');
    await this.phone.fill(values.phone ?? '+7 (999) 000-00-00');
    await this.contactMethod.selectOption(values.contactMethod ?? 'Позвонить');

    if (values.contactMethod === 'Telegram' && values.telegramUsername) {
      await this.telegramUsername.fill(values.telegramUsername);
    }
  }
}
