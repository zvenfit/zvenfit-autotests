# ZvenFit autotests

Новый проект e2e-автотестов для [zvenfit.ru](https://zvenfit.ru) на TypeScript и Playwright.

По умолчанию Playwright раздаёт свежую сборку соседнего `../zvenfit-frontend/dist` на `http://127.0.0.1:4173` встроенным локальным сервером в режиме read-only. Соседний репозиторий не пересобирается и не изменяется. Маршруты автоматически читаются из актуального `dist/sitemap.xml`, поэтому новые страницы попадают в контрактный набор без ручного списка.

Функциональные тесты формы и расписания подменяют runtime-конфиги и перехватывают API-запросы в браузере: заявки не создаются, YDB/Fitbase не используются. Production-набор остаётся строго read-only.

На всех 40 URL из sitemap работает реестр интерактивных элементов. Он инвентаризирует ссылки, кнопки, submit, меню, слайдеры, карусели и кастомные контролы, проверяет их назначение и падает при появлении неизвестного action-класса. Поведение каждого класса проверяется отдельным сценарием; одинаковые CTA на десятках страниц не прокликиваются по одному, а проходят единый контракт.

## Требования

- Node.js 22.6+
- установленный соседний репозиторий `../zvenfit-frontend`
- в соседнем frontend существует актуальный `dist/` после `npm run build`

## Быстрый старт

```bash
npm install
npx playwright install chromium
npm test
```

Основные команды:

```bash
npm run typecheck     # строгая проверка TypeScript
npm run test:contracts # sitemap, SEO и актуальные продуктовые блоки
npm run test:features  # форма и расписание с локальными API mocks
npm run test:headed   # браузер с интерфейсом
npm run test:ui       # Playwright UI mode
npm run test:prod     # read-only проверка https://zvenfit.ru
npm run test:staging  # protected staging smoke; нужны только Basic Auth env
npm run report        # открыть последний HTML-отчёт
```

## Автоматические проверки

GitHub Actions использует два checkout: текущий `zvenfit-autotests` и
`zvenfit-frontend/main`. Frontend собирается в development-режиме, после чего
запускаются TypeScript и весь локальный Playwright suite.

- **Playwright quality** — на каждый PR и push в `master`;
- **Production read-only smoke** — ежедневно и вручную, только
  `tests/contracts` + `tests/journeys` против `https://zvenfit.ru`.
- **Staging smoke** — reusable workflow, который вызывает
  `zvenfit-frontend` после успешного staging deploy. Frontend передаёт только
  staging Basic Auth secrets, а autotests revision закрепляется commit SHA.

Quality и production CI не получают secrets. Staging job получает только Basic
Auth от вызывающего frontend workflow. Ни один CI job не загружает artifacts;
HTML report, trace, screenshots и video отключены. Production browser requests
помечаются заголовком `X-Zvenfit-Test-Run: playwright-read-only`, staging —
`playwright-staging-read-only`; внешние analytics/media запросы блокируются до
отправки.

Если frontend расположен в другом месте:

```bash
ZVENFIT_FRONTEND_PATH=/absolute/path/to/zvenfit-frontend npm test
```

Для другого уже запущенного стенда запускайте только read-only каталоги:

```bash
PLAYWRIGHT_BASE_URL=https://example.test npx playwright test tests/contracts tests/journeys
```

Staging suite нельзя перенаправить на другой origin: отдельный config принимает
только точный `https://staging.zvenfit.ru` и требует
`STAGING_BASIC_AUTH_USERNAME`/`STAGING_BASIC_AUTH_PASSWORD`.

Полный `npm test` предназначен для локального frontend: только feature-тесты формы выполняют submit, и их API всегда подменён через `page.route()`.

## Структура

```text
pages/                 page objects и устойчивые локаторы
scripts/               локальный read-only static server
tests/contracts/       все sitemap-страницы, SEO и продуктовые блоки
tests/journeys/        read-only пользовательские переходы
tests/features/        форма и расписание с локальными API mocks
tests/staging/         authenticated read-only smoke изолированного staging
tests/support/         sitemap loader, network helpers и API fixtures
playwright.config.ts   окружение, webServer и браузерные профили
playwright.staging.config.ts  fail-closed конфиг только для staging
```

## Как тестируется заявка без спама

Текущий и основной режим — полностью локальный mock:

1. Перед загрузкой формы Playwright подменяет `/js/lead-config.js`.
2. Форма получает endpoint `https://api.local.test/lead`.
3. `page.route()` перехватывает запрос внутри браузера, проверяет payload и возвращает нужный ответ (`200`, `429` или `503`).
4. Если запрос не был перехвачен, тест падает; реальный production endpoint не используется.

Так проверяются native validation, Telegram, UTM, UUID, повторная отправка и обработка ошибок без единой реальной заявки.

Если позже понадобится проверять серверную интеграцию, безопасные варианты такие:

- отдельный staging endpoint с отдельной БД;
- backend `dry-run`, который валидирует запрос, но не пишет заявку;
- специальный test tenant/sink, полностью отделённый от рабочих уведомлений и CRM.

Production canary с созданием и последующим удалением заявки здесь не используется: он всё равно создаёт шум и требует доступа к рабочим данным.

## Ветки и безопасность

Используем `feature/*`, `bugfix/*`, `hotfix/*`, `refactor/*`, `test/*`, `chore/*`. Префикс `codex` запрещён.

Исходный код и документация хранятся в публичном
[`zvenfit/zvenfit-autotests`](https://github.com/zvenfit/zvenfit-autotests).
Стефания, её память и синхронизация базы знаний здесь не используются. Не
добавляйте в Git `.env`, реальные данные клиентов, storage state, отчёты,
trace, screenshot и video. Локальные browser artifacts не публикуются в GitHub
Actions и внешние хранилища.

Документация:

- [текущее тестовое покрытие](docs/test-plan.md);
- [целевая архитектура полноценной экосистемы и roadmap](docs/target-architecture.md).
