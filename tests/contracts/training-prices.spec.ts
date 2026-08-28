import { test } from '@playwright/test';

import { blockNonEssentialResources } from '../support/network';
import {
  expectStandaloneReformerPrices,
  expectTabbedTrainingPrices,
  expectTeenPriceTabs,
  expectTrainingPriceCopy,
} from '../support/training-price-contracts';

test.describe('Актуальные тарифы тренировок', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required');
    await blockNonEssentialResources(page, baseURL);
  });

  test('персональные, парные и подростковые тарифы соответствуют матрице', async ({
    page,
  }) => {
    await expectTabbedTrainingPrices(page);
  });

  test('индивидуальный и групповой реформер соответствуют матрице', async ({
    page,
  }) => {
    await expectStandaloneReformerPrices(page);
  });

  test('пробные занятия, сплит реформера и JSON-LD синхронизированы', async ({
    page,
  }) => {
    await expectTrainingPriceCopy(page);
  });

});

test.describe('Переключение вкладок тарифов', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required');
    await blockNonEssentialResources(page, baseURL, {
      allowLayoutResources: true,
      allowRuntimeResources: true,
    });
  });

  test('подростковые вкладки переключают соответствующие тарифы', async ({ page }) => {
    await expectTeenPriceTabs(page);
  });
});
