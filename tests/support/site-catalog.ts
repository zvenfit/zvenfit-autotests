import { readFileSync } from 'node:fs';
import path from 'node:path';

const frontendRoot = process.env.ZVENFIT_FRONTEND_PATH
  ? path.resolve(process.env.ZVENFIT_FRONTEND_PATH)
  : path.resolve(__dirname, '../../../zvenfit-frontend');

const sitemap = readFileSync(path.join(frontendRoot, 'dist/sitemap.xml'), 'utf8');

export const siteRoutes = [...sitemap.matchAll(/<loc>https:\/\/zvenfit\.ru([^<]*)<\/loc>/g)].map(
  match => match[1] || '/',
);

if (siteRoutes.length === 0) {
  throw new Error('В dist/sitemap.xml не найдено ни одного маршрута zvenfit.ru');
}

export const trainerProfileRoutes = siteRoutes.filter(route => route.startsWith('/trenery/trener-'));
export const legalRoutes = new Set(['/offer/', '/privacy/', '/payment-policy/']);
