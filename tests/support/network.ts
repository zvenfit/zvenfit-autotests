import type { Page } from '@playwright/test';

const layoutResourcePrefixes = [
  'https://storage.yandexcloud.net/zvenfit/v2/css/',
  'https://storage.yandexcloud.net/zvenfit/v2/fonts/',
  'https://fonts.bunny.net/',
  // The Bunny Fonts stylesheet now points every Roboto and Roboto Condensed
  // file at the Fontsource packages on jsDelivr. Without them the fallback
  // font is wider and the layout contracts measure a page visitors never see.
  'https://cdn.jsdelivr.net/fontsource/fonts/',
] as const;
const runtimeResourcePrefixes = [
  'https://storage.yandexcloud.net/zvenfit/v2/js/',
] as const;

// Hosts the suite deliberately lets the browser reach when layout or runtime
// resources are allowed. The staging config sends them past its CONNECT proxy.
export const directResourceHosts = [
  ...new Set([...layoutResourcePrefixes, ...runtimeResourcePrefixes].map(prefix => new URL(prefix).hostname)),
];

type NetworkOptions = {
  allowExternalDocuments?: boolean;
  allowLayoutResources?: boolean;
  allowRuntimeResources?: boolean;
};

export async function blockNonEssentialResources(
  page: Page,
  baseURL: string,
  {
    allowExternalDocuments = true,
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
    const isAllowedExternalDocument =
      allowExternalDocuments && resourceType === 'document';

    if (['image', 'media'].includes(resourceType)) {
      return route.abort();
    }

    if (
      requestOrigin !== allowedOrigin &&
      !isAllowedExternalDocument &&
      !isAllowedLayoutResource &&
      !isAllowedRuntimeResource
    ) {
      return route.abort();
    }

    return route.continue();
  });
}
