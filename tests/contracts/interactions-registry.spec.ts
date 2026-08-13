import { expect, test } from '@playwright/test';
import {
  behaviorCoverage,
  classifyInteraction,
  interactiveSelector,
  type InteractionSnapshot,
} from '../support/interaction-registry';
import { blockNonEssentialResources } from '../support/network';
import { siteRoutes } from '../support/site-catalog';

test.describe('Реестр всех интерактивных элементов', () => {
  test('каждый action-класс связан с поведенческим тестом', () => {
    expect(Object.keys(behaviorCoverage).sort()).toEqual(
      [
        'coaches-toggle',
        'fragment-navigation',
        'history-back',
        'horizontal-accordion',
        'internal-navigation',
        'lead-submit',
        'mobile-menu',
        'reviews-carousel',
        'webflow-slider',
      ].sort(),
    );
  });

  for (const route of siteRoutes) {
    test(`${route} не содержит неизвестных или битых действий`, async ({ page }, testInfo) => {
      const baseURL = String(testInfo.project.use.baseURL);
      await blockNonEssentialResources(page, baseURL);
      await page.goto(route, { waitUntil: 'domcontentloaded' });

      const snapshots = await page.locator(interactiveSelector).evaluateAll(elements =>
        elements.map((element, index) => {
          const htmlElement = element as HTMLElement;
          const anchor = element instanceof HTMLAnchorElement ? element : null;
          const input = element instanceof HTMLInputElement ? element : null;

          return {
            tag: element.tagName.toLowerCase(),
            type: input?.type ?? '',
            role: element.getAttribute('role') ?? '',
            href: anchor?.getAttribute('href')?.trim() ?? '',
            classes: [...element.classList],
            text: (htmlElement.innerText || input?.value || '').replace(/\s+/g, ' ').trim().slice(0, 120),
            ariaLabel: element.getAttribute('aria-label') ?? '',
            dataBack: element.hasAttribute('data-back'),
            dataCoachesToggle: element.hasAttribute('data-coaches-toggle'),
            selectorHint: `${element.tagName.toLowerCase()}[${index}]${element.id ? `#${element.id}` : ''}`,
          } satisfies InteractionSnapshot;
        }),
      );

      expect(snapshots.length, `На ${route} не найдено интерактивных элементов`).toBeGreaterThan(0);
      const classified = snapshots.map(classifyInteraction);
      const unknown = classified.filter(item => item.kind === 'unknown');
      expect(unknown, `Добавьте новые элементы ${route} в interaction-registry.ts и поведенческий тест`).toEqual([]);

      for (const item of classified) {
        if (item.kind === 'internal-navigation') {
          const destination = new URL(item.href, baseURL).pathname;
          expect(siteRoutes, `${route}: неизвестный внутренний URL ${item.href}`).toContain(destination);
        }

        if (item.kind === 'fragment-navigation') {
          const fragment = decodeURIComponent(item.href.slice(1));
          await expect(page.locator(`[id="${fragment}"]`), `${route}: нет target для ${item.href}`).toHaveCount(1);
        }

        if (item.kind === 'external-navigation') {
          expect(() => new URL(item.href), `${route}: невалидный внешний URL ${item.href}`).not.toThrow();
        }

        if (item.kind === 'phone') {
          expect(item.href, `${route}: невалидный телефон ${item.href}`).toMatch(/^tel:\+\d{11}$/);
        }

        if (item.kind === 'email') {
          expect(item.href, `${route}: невалидный email ${item.href}`).toMatch(/^mailto:[^@\s]+@[^@\s]+$/);
        }

        if (item.kind === 'lead-submit') {
          expect(route).toBe('/forma-dlya-zayavki/');
        }
      }
    });
  }
});
