import type { Page } from '@playwright/test';

const layoutResourcePrefixes = [
  'https://storage.yandexcloud.net/zvenfit/v2/css/',
  'https://storage.yandexcloud.net/zvenfit/v2/fonts/',
  'https://fonts.bunny.net/',
] as const;
const runtimeResourcePrefixes = [
  'https://storage.yandexcloud.net/zvenfit/v2/js/',
] as const;

type NetworkOptions = {
  allowLayoutResources?: boolean;
  allowRuntimeResources?: boolean;
};

export async function blockNonEssentialResources(
  page: Page,
  baseURL: string,
  {
    allowLayoutResources = false,
    allowRuntimeResources = false,
  }: NetworkOptions = {},
): Promise<void> {
  const allowedOrigin = new URL(baseURL).origin;

  await page.route('**/*', route => {
    const request = route.request();
    const requestUrl = request.url();
    const resourceType = request.resourceType();
    const requestOrigin = new URL(requestUrl).origin;
    const isAllowedLayoutResource =
      allowLayoutResources &&
      ['font', 'stylesheet'].includes(resourceType) &&
      layoutResourcePrefixes.some(prefix => requestUrl.startsWith(prefix));
    const isAllowedRuntimeResource =
      allowRuntimeResources &&
      resourceType === 'script' &&
      runtimeResourcePrefixes.some(prefix => requestUrl.startsWith(prefix));

    if (['image', 'media'].includes(resourceType)) {
      return route.abort();
    }

    if (
      requestOrigin !== allowedOrigin &&
      resourceType !== 'document' &&
      !isAllowedLayoutResource &&
      !isAllowedRuntimeResource
    ) {
      return route.abort();
    }

    return route.continue();
  });
}
