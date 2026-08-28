import { expect, type Locator, type Page } from '@playwright/test';

import {
  TrainingPricesPage,
} from '../../pages/training-prices.page';

type CardExpectation = {
  details?: Array<RegExp | string>;
  name: string;
  price: string;
};

type TabbedPriceContract = {
  club: CardExpectation[];
  route: string;
  sectionId: string;
  standard: CardExpectation[];
};

type StandalonePriceContract = {
  cards: CardExpectation[];
  route: string;
  sectionId: string;
};

const tabbedPriceContracts: TabbedPriceContract[] = [
  {
    route: '/personalnye-trenirovki/',
    sectionId: '#prices',
    standard: [
      { name: '1 тренировка', price: '3400₽' },
      { name: '5 тренировок', price: '14500₽' },
      { name: '10 тренировок', price: '26000₽' },
    ],
    club: [
      { name: '1 тренировка', price: '2600₽' },
      {
        name: '5 тренировок',
        price: '12000₽',
        details: [/2400\s*руб за\s*тренировку/i, /Выгоднее\s*на\s*7%/i],
      },
      {
        name: '10 тренировок',
        price: '21000₽',
        details: [/2100\s*руб за\s*тренировку/i, /Выгоднее\s*на\s*19%/i],
      },
    ],
  },
  {
    route: '/parnye-trenirovki/',
    sectionId: '#prices',
    standard: [
      { name: '1 тренировка', price: '6000₽' },
      { name: '5 тренировок', price: '25000₽' },
      { name: '10 тренировок', price: '42000₽' },
    ],
    club: [
      { name: '1 тренировка', price: '4400₽' },
      {
        name: '5 тренировок',
        price: '20000₽',
        details: [/4000\s*руб за\s*тренировку/i, /Выгоднее\s*на\s*9%/i],
      },
      {
        name: '10 тренировок',
        price: '35000₽',
        details: [/3500\s*руб за\s*тренировку/i, /Выгоднее\s*на\s*20%/i],
      },
    ],
  },
  {
    route: '/personalnye-trenirovki/',
    sectionId: '#teen-prices',
    standard: [
      { name: '1 тренировка', price: '3000₽' },
      {
        name: '5 тренировок',
        price: '13000₽',
        details: [/2600\s*руб за\s*тренировку/i, /Выгоднее\s*на\s*13%/i],
      },
      {
        name: '10 тренировок',
        price: '25000₽',
        details: [/2500\s*руб за\s*тренировку/i, /Выгоднее\s*на\s*16%/i],
      },
    ],
    club: [
      { name: '1 тренировка', price: '2400₽' },
      {
        name: '5 тренировок',
        price: '11000₽',
        details: [/2200\s*руб за\s*тренировку/i, /Выгоднее\s*на\s*8%/i],
      },
      {
        name: '10 тренировок',
        price: '19000₽',
        details: [/1900\s*руб за\s*тренировку/i, /Выгоднее\s*на\s*20%/i],
      },
    ],
  },
];

const standalonePriceContracts: StandalonePriceContract[] = [
  {
    route: '/pilates-na-reformere/individualnyy/',
    sectionId: '#prices',
    cards: [
      { name: '1 тренировка', price: '3500₽' },
      {
        name: '10 тренировок',
        price: '26000₽',
        details: [/2600\s*руб за\s*тренировку/i, /Выгоднее\s*на\s*25%/i],
      },
      {
        name: '25 тренировок',
        price: '55000₽',
        details: [/2200\s*руб за\s*тренировку/i, /Выгоднее\s*на\s*37%/i],
      },
    ],
  },
  {
    route: '/pilates-na-reformere/gruppovye/',
    sectionId: '#prices',
    cards: [
      { name: '1 тренировка', price: '2200₽' },
      {
        name: '5 тренировок',
        price: '10000₽',
        details: [/2000\s*руб за\s*тренировку/i, /Выгоднее\s*на\s*9%/i],
      },
      {
        name: '10 тренировок',
        price: '19000₽',
        details: [/1900\s*руб за\s*тренировку/i, /Выгоднее\s*на\s*13%/i],
      },
      {
        name: '20 тренировок',
        price: '35000₽',
        details: [/1750\s*руб за\s*тренировку/i, /Выгоднее\s*на\s*20%/i],
      },
    ],
  },
];

async function expectCards(
  prices: TrainingPricesPage,
  container: Locator,
  expectedCards: CardExpectation[],
): Promise<void> {
  await expect(prices.priceCards(container)).toHaveCount(expectedCards.length);

  for (const expectedCard of expectedCards) {
    const card = prices.priceCard(container, expectedCard.name);
    await expect(card).toHaveCount(1);
    await expect(prices.price(card)).toHaveText(expectedCard.price);

    for (const detail of expectedCard.details ?? []) {
      await expect(card).toContainText(detail);
    }
  }
}

async function expectSuccessfulNavigation(
  prices: TrainingPricesPage,
  route: string,
): Promise<void> {
  const response = await prices.goto(route);
  expect(response, `Нет document response для ${route}`).not.toBeNull();
  expect(response?.status(), `HTTP status для ${route}`).toBeLessThan(400);
}

export async function expectTabbedTrainingPrices(page: Page): Promise<void> {
  const prices = new TrainingPricesPage(page);

  for (const contract of tabbedPriceContracts) {
    await expectSuccessfulNavigation(prices, contract.route);
    const section = prices.section(contract.sectionId);
    await expect(section).toBeAttached();
    await expectCards(prices, prices.tabPane(contract.sectionId, 'standard'), contract.standard);
    await expectCards(prices, prices.tabPane(contract.sectionId, 'club'), contract.club);

    if (contract.route === '/parnye-trenirovki/') {
      await expect(section).toContainText(/Все цены указаны за\s*двоих/i);
    }
  }

  await expectSuccessfulNavigation(prices, '/trenazhernyj-zal/');
  const teenCard = prices.areaCard(/Персональные тренировки для\s*подростков/i);
  await expect(teenCard).toContainText(/выгодой до\s*20%/i);
  const teenPricesLink = teenCard.getByRole('link', { name: 'подробнее' });
  await expect(teenPricesLink).toHaveAttribute(
    'href',
    '/personalnye-trenirovki/#teen-prices',
  );
  await expect(prices.section('#teen-prices')).toHaveCount(0);

  await teenPricesLink.click();
  await expect(page).toHaveURL(/\/personalnye-trenirovki\/#teen-prices$/);
  await expect(prices.section('#teen-prices')).toBeAttached();
}

export async function expectStandaloneReformerPrices(page: Page): Promise<void> {
  const prices = new TrainingPricesPage(page);

  for (const contract of standalonePriceContracts) {
    await expectSuccessfulNavigation(prices, contract.route);
    await expectCards(prices, prices.section(contract.sectionId), contract.cards);
  }
}

export async function expectTrainingPriceCopy(page: Page): Promise<void> {
  const prices = new TrainingPricesPage(page);

  await expectSuccessfulNavigation(prices, '/pilates-na-reformere/');
  await expect(
    page.getByRole('heading', { level: 3, name: 'Всего 1000₽' }),
  ).toBeAttached();
  await expect(prices.areaCard(/мини-группе/i)).toContainText(/от\s*2\s*до\s*4\s*человек/i);
  const reformerSplit = prices.areaCard('В паре');
  await expect(reformerSplit).toContainText(/5\s*000\s*₽ за\s*двоих/i);
  await expect(reformerSplit).toContainText(/44\s*000\s*₽/i);
  await expect(reformerSplit).toContainText(/Выгоднее\s*на\s*12%/i);

  const trialContracts: Array<[string, RegExp]> = [
    ['/personalnye-trenirovki/', /первую тренировку с\s*тренером всего за\s*1\s*000₽/i],
    ['/parnye-trenirovki/', /Первая тренировка в\s*паре — всего 1\s*000₽/i],
    [
      '/pilates-na-reformere/individualnyy/',
      /Первая индивидуальная тренировка на\s*реформере — всего 1\s*000₽/i,
    ],
    [
      '/pilates-na-reformere/gruppovye/',
      /Первая тренировка в\s*мини-группе — всего 1\s*000₽/i,
    ],
    ['/trenazhernyj-zal/mini-gruppy/', /первую тренировку в\s*мини-группе всего за\s*1\s*000р/i],
  ];

  for (const [route, trialText] of trialContracts) {
    await expectSuccessfulNavigation(prices, route);
    await expect(page.getByText(trialText).first()).toBeAttached();
  }

  await expectSuccessfulNavigation(prices, '/promos/');
  await expect(prices.promoCard('Пробная тренировка')).toContainText('1000₽');
  await expect(prices.promoCard('Пробное на реформере')).toContainText('1000₽');

  const structuredNodes = (
    await prices.structuredDataScripts().allTextContents()
  ).flatMap((text) => {
    const value = JSON.parse(text) as Record<string, unknown>;
    return Array.isArray(value['@graph'])
      ? (value['@graph'] as Array<Record<string, unknown>>)
      : [value];
  });
  const reformerTrialOffer = structuredNodes.find((node) =>
    String(node['@id']).endsWith('#offer-pilates-trial-1000'),
  );
  expect(reformerTrialOffer).toMatchObject({
    '@type': 'Offer',
    name: 'Пробное занятие пилатесом 1000 ₽',
    price: '1000',
    priceCurrency: 'RUB',
  });
}

export async function expectTeenPriceTabs(page: Page): Promise<void> {
  const prices = new TrainingPricesPage(page);
  await expectSuccessfulNavigation(prices, '/personalnye-trenirovki/');

  const standardTab = prices.tab('#teen-prices', 'Стандартные');
  const clubTab = prices.tab('#teen-prices', 'С Клубной картой');
  const standardPane = prices.tabPane('#teen-prices', 'standard');
  const clubPane = prices.tabPane('#teen-prices', 'club');

  await expect(standardTab).toHaveAttribute('aria-selected', 'true');
  await expect(standardPane).toBeVisible();
  await expect(clubPane).toBeHidden();

  await clubTab.click();
  await expect(clubTab).toHaveAttribute('aria-selected', 'true');
  await expect(clubPane).toBeVisible();
  await expect(standardPane).toBeHidden();

  await standardTab.click();
  await expect(standardTab).toHaveAttribute('aria-selected', 'true');
  await expect(standardPane).toBeVisible();
  await expect(clubPane).toBeHidden();
}
