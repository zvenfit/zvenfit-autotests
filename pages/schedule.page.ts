import { expect, type Locator, type Page } from '@playwright/test';

export class SchedulePage {
  readonly root: Locator;
  readonly typeFilters: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('[data-schedule-root]');
    this.typeFilters = page.getByRole('group', { name: 'Тип' });
    this.error = page.getByRole('alert');
  }

  async open(): Promise<void> {
    await this.page.goto('/raspisanie/', { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByRole('heading', { level: 1 })).toContainText('расписание');
    await expect(this.root).toBeVisible();
  }

  event(name: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(name, 'i') });
  }
}
