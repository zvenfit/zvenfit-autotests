import type { Locator, Page, Response } from '@playwright/test';

export type PriceTab = 'club' | 'standard';

const tabIds: Record<PriceTab, string> = {
  standard: 'Tab 1',
  club: 'Tab 2',
};

export class TrainingPricesPage {
  constructor(readonly page: Page) {}

  async goto(route: string): Promise<Response | null> {
    return this.page.goto(route, { waitUntil: 'domcontentloaded' });
  }

  section(sectionId: string): Locator {
    return this.page.locator(sectionId);
  }

  tab(sectionId: string, name: string): Locator {
    return this.section(sectionId).getByRole('tab', { name, exact: true });
  }

  tabPane(sectionId: string, tab: PriceTab): Locator {
    return this.section(sectionId).locator(
      `.w-tab-pane[data-w-tab="${tabIds[tab]}"]`,
    );
  }

  priceCards(container: Locator): Locator {
    return container.locator('.div-block-6');
  }

  price(card: Locator): Locator {
    return card.locator('.text-price');
  }

  priceCard(container: Locator, heading: string): Locator {
    return this.priceCards(container).filter({
      has: this.page.getByRole('heading', {
        includeHidden: true,
        level: 3,
        name: heading,
      }),
    });
  }

  areaCard(heading: string | RegExp): Locator {
    return this.page.locator('.cat_card.areas_page').filter({
      has: this.page.getByRole('heading', { level: 3, name: heading }),
    });
  }

  promoCard(heading: string): Locator {
    return this.page.locator('.promos-card').filter({
      has: this.page.getByRole('heading', { level: 2, name: heading }),
    });
  }

  structuredDataScripts(): Locator {
    return this.page.locator('script[type="application/ld+json"]');
  }
}
