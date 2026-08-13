export const interactionKinds = [
  'internal-navigation',
  'fragment-navigation',
  'external-navigation',
  'phone',
  'email',
  'history-back',
  'lead-submit',
  'mobile-menu',
  'webflow-slider',
  'reviews-carousel',
  'horizontal-accordion',
  'coaches-toggle',
] as const;

export type InteractionKind = (typeof interactionKinds)[number];

export type InteractionSnapshot = {
  tag: string;
  type: string;
  role: string;
  href: string;
  classes: string[];
  text: string;
  ariaLabel: string;
  dataBack: boolean;
  dataCoachesToggle: boolean;
  selectorHint: string;
};

export type ClassifiedInteraction = InteractionSnapshot & { kind: InteractionKind | 'unknown' };

export const interactiveSelector = [
  'a[href]',
  'button',
  'input[type="submit"]',
  '[role="button"]',
  '.w-dropdown-toggle',
  '.w-slider-arrow-left',
  '.w-slider-arrow-right',
  '.btn-prev',
  '.btn-next',
  '.accordion_horizontal-component',
].join(',');

export function classifyInteraction(item: InteractionSnapshot): ClassifiedInteraction {
  const hasClass = (className: string) => item.classes.includes(className);
  let kind: InteractionKind | 'unknown' = 'unknown';

  if (item.tag === 'a') {
    if (item.dataBack && item.href === '#') {
      kind = 'history-back';
    } else if (item.href.startsWith('#') && item.href.length > 1) {
      kind = 'fragment-navigation';
    } else if (item.href.startsWith('/')) {
      kind = 'internal-navigation';
    } else if (item.href.startsWith('tel:')) {
      kind = 'phone';
    } else if (item.href.startsWith('mailto:')) {
      kind = 'email';
    } else if (/^https?:\/\//.test(item.href)) {
      kind = 'external-navigation';
    }
  } else if (item.tag === 'input' && item.type === 'submit') {
    kind = 'lead-submit';
  } else if (item.dataCoachesToggle) {
    kind = 'coaches-toggle';
  } else if (hasClass('w-dropdown-toggle')) {
    kind = 'mobile-menu';
  } else if (hasClass('w-slider-arrow-left') || hasClass('w-slider-arrow-right')) {
    kind = 'webflow-slider';
  } else if (hasClass('btn-prev') || hasClass('btn-next')) {
    kind = 'reviews-carousel';
  } else if (hasClass('accordion_horizontal-component')) {
    kind = 'horizontal-accordion';
  }

  return { ...item, kind };
}

export const behaviorCoverage: Record<Exclude<InteractionKind, 'external-navigation' | 'phone' | 'email'>, string> = {
  'internal-navigation': 'tests/journeys/navigation.spec.ts',
  'fragment-navigation': 'tests/features/ui-controls.spec.ts',
  'history-back': 'tests/features/ui-controls.spec.ts',
  'lead-submit': 'tests/features/application.spec.ts (API always intercepted)',
  'mobile-menu': 'tests/features/ui-controls.spec.ts',
  'webflow-slider': 'tests/features/ui-controls.spec.ts',
  'reviews-carousel': 'tests/features/ui-controls.spec.ts',
  'horizontal-accordion': 'tests/features/ui-controls.spec.ts',
  'coaches-toggle': 'tests/contracts/current-product.spec.ts',
};
