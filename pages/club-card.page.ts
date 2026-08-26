import type { Locator, Page } from '@playwright/test';

export class ClubCardPage {
  readonly heading: Locator;
  readonly nextReview: Locator;
  readonly previousReview: Locator;
  readonly priceCards: Locator;
  readonly reviewCards: Locator;
  readonly reviewsSection: Locator;
  readonly reviewsWrapper: Locator;
  readonly typeCards: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Клубная карта' });
    this.nextReview = page.getByRole('button', { name: 'Следующий отзыв' });
    this.previousReview = page.getByRole('button', { name: 'Предыдущий отзыв' });
    this.priceCards = page.locator('.club-card-price');
    this.reviewCards = page.locator('.club-card-reviews .review');
    this.reviewsSection = page.locator('#reviews');
    this.reviewsWrapper = page.locator('[data-reviews-wrapper]');
    this.typeCards = page.locator('.club-card-type');
  }

  async goto(): Promise<void> {
    await this.page.goto('/klubnaya-karta/', { waitUntil: 'domcontentloaded' });
  }

  priceCard(name: string | RegExp): Locator {
    return this.priceCards.filter({
      has: this.page.getByRole('heading', { level: 3, name }),
    });
  }
}
