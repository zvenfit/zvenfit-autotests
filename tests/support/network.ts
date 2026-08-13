import type { Page } from '@playwright/test';

export async function blockNonEssentialResources(page: Page, baseURL: string): Promise<void> {
  const allowedOrigin = new URL(baseURL).origin;

  await page.route('**/*', route => {
    const request = route.request();
    const resourceType = request.resourceType();
    const requestOrigin = new URL(request.url()).origin;

    if (['font', 'image', 'media'].includes(resourceType)) {
      return route.abort();
    }

    if (requestOrigin !== allowedOrigin && resourceType !== 'document') {
      return route.abort();
    }

    return route.continue();
  });
}
