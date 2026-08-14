import { expect, test, type Locator, type Page } from '@playwright/test';

import { blockNonEssentialResources } from '../support/network';
import { siteRoutes } from '../support/site-catalog';

const layoutTolerance = 1;
const breakpointWidths = [
  320, 375, 479, 480, 767, 768, 991, 992, 1440,
] as const;

type HorizontalLayout = {
  bodyWidth: number;
  documentWidth: number;
  landmarks: Array<{
    left: number;
    overflowX: string;
    right: number;
    selector: string;
    width: number;
  }>;
  maxScrollX: number;
  viewportWidth: number;
  widestElements: Array<{
    left: number;
    right: number;
    selector: string;
    width: number;
  }>;
};

async function readHorizontalLayout(page: Page): Promise<HorizontalLayout> {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const initialScrollX = window.scrollX;
    const landmarkSelectors = [
      '.slider-2',
      '.mask-3',
      '.right-arrow-copy',
      '.section-4',
      '.txt_cont',
      '.right_cont',
    ];
    const selectorFor = (element: Element): string => {
      if (element.id) return `#${CSS.escape(element.id)}`;

      const classNames = [...element.classList]
        .slice(0, 3)
        .map((name) => `.${CSS.escape(name)}`)
        .join('');
      return `${element.tagName.toLowerCase()}${classNames}`;
    };

    const widestElements = [...document.body.querySelectorAll('*')]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          left: Math.round(rect.left * 100) / 100,
          right: Math.round(rect.right * 100) / 100,
          selector: selectorFor(element),
          width: Math.round(rect.width * 100) / 100,
        };
      })
      .filter(
        (rect) =>
          (rect.left < -1 || rect.right > viewportWidth + 1) &&
          rect.left < viewportWidth * 1.5,
      )
      .sort((a, b) => b.right - viewportWidth - (a.right - viewportWidth))
      .slice(0, 5);

    window.scrollTo(document.documentElement.scrollWidth, window.scrollY);
    const maxScrollX = window.scrollX;
    window.scrollTo(initialScrollX, window.scrollY);

    return {
      bodyWidth: document.body.scrollWidth,
      documentWidth: document.documentElement.scrollWidth,
      landmarks: landmarkSelectors.flatMap((selector) => {
        const element = document.querySelector(selector);
        if (!element) return [];

        const rect = element.getBoundingClientRect();
        return [
          {
            left: Math.round(rect.left * 100) / 100,
            overflowX: getComputedStyle(element).overflowX,
            right: Math.round(rect.right * 100) / 100,
            selector,
            width: Math.round(rect.width * 100) / 100,
          },
        ];
      }),
      maxScrollX,
      viewportWidth,
      widestElements,
    };
  });
}

async function expectNoHorizontalOverflow(
  page: Page,
  context: string,
): Promise<void> {
  const layout = await readHorizontalLayout(page);

  expect(
    layout.maxScrollX,
    `${context}: viewport=${layout.viewportWidth}, body=${layout.bodyWidth}, document=${layout.documentWidth}, ` +
      `landmarks=${JSON.stringify(layout.landmarks)}, overflowing=${JSON.stringify(layout.widestElements)}`,
  ).toBeLessThanOrEqual(layoutTolerance);
}

async function gotoWithLayoutStyles(page: Page, route: string): Promise<void> {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() =>
    [
      ...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
    ].every((link) => Boolean(link.sheet)),
  );
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('body')).toHaveCSS('margin', '0px');
}

async function expectLocatorSpansContainer(
  locator: Locator,
  container: Locator,
  context: string,
): Promise<void> {
  const [elementBox, containerBox] = await Promise.all([
    locator.boundingBox(),
    container.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const styles = getComputedStyle(element);
      const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;
      const paddingRight = Number.parseFloat(styles.paddingRight) || 0;

      return {
        width: rect.width - paddingLeft - paddingRight,
        x: rect.x + paddingLeft,
      };
    }),
  ]);

  expect(
    elementBox,
    `${context}: элемент не участвует в раскладке`,
  ).not.toBeNull();
  expect(
    containerBox,
    `${context}: контейнер не участвует в раскладке`,
  ).not.toBeNull();

  if (!elementBox) return;

  expect(
    Math.abs(elementBox.x - containerBox.x),
    `${context}: левый край`,
  ).toBeLessThanOrEqual(2);
  expect(
    Math.abs(
      elementBox.x + elementBox.width - (containerBox.x + containerBox.width),
    ),
    `${context}: правый край`,
  ).toBeLessThanOrEqual(2);
}

test.describe('Responsive layout contracts', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required');
    await blockNonEssentialResources(page, baseURL, {
      allowLayoutResources: true,
    });
  });

  test('страницы sitemap не создают горизонтальную прокрутку', async ({
    page,
  }) => {
    test.setTimeout(120_000);

    for (const route of siteRoutes) {
      await gotoWithLayoutStyles(page, route);
      await expectNoHorizontalOverflow(page, route);
    }
  });

  for (const width of breakpointWidths) {
    test(`страницы sitemap сохраняют layout-контракт при ширине ${width}px`, async ({
      page,
      isMobile,
    }) => {
      test.skip(
        Boolean(isMobile),
        'Breakpoint-матрица выполняется один раз в desktop-проекте',
      );
      test.setTimeout(180_000);
      await page.setViewportSize({ width, height: 1000 });

      for (const route of siteRoutes) {
        await gotoWithLayoutStyles(page, route);
        await expectNoHorizontalOverflow(page, `${route} at ${width}px`);

        if (route !== '/trenazhernyj-zal/mini-gruppy/') continue;

        await expect(page.locator('html')).toHaveAttribute(
          'data-wf-page',
          /^[a-f0-9]{24}$/,
        );
        await expect(page.locator('.reviews-section')).toBeVisible();
        await expect(
          page.getByRole('heading', { name: 'Отзывы о клубе' }),
        ).toBeVisible();

        if (width <= 767) {
          const factsHeading = page.getByRole('heading', {
            name: /Максимум возможностей/,
          });
          await expectLocatorSpansContainer(
            factsHeading.locator('..'),
            factsHeading.locator('xpath=ancestor::section[1]'),
            `${width}px facts heading`,
          );
        }

        const stepsHeading = page
          .getByRole('heading', { name: /свой путь к идеальному телу/i })
          .locator('..');
        await expectLocatorSpansContainer(
          stepsHeading,
          stepsHeading.locator('xpath=ancestor::section[1]'),
          `${width}px steps heading`,
        );

        const coachesHeading = page.getByRole('heading', {
          name: /наша команда тренеров/i,
        });
        await expectLocatorSpansContainer(
          coachesHeading,
          coachesHeading.locator('xpath=ancestor::section[1]'),
          `${width}px coaches heading`,
        );
      }
    });
  }
});
