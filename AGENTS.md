# Project rules — ZvenFit Autotests

- Source code and documentation may be synced only to the official GitHub repository `zvenfit/zvenfit-autotests`.
- Never publish test data, reports, traces, screenshots, videos, browser state, secrets, or local knowledge with the source code.
- Never use Stefania, its memory, Wiki, DataCatalog, remote knowledge-base adapters, or sync workflows for this project.
- Do not send real customer data or create real leads. Functional API tests must use Playwright request interception or a local mock.
- Do not commit secrets, real `.env*` files, browser storage state, traces, screenshots, or videos.
- Branch names use conventional prefixes such as `feature/`, `bugfix/`, `hotfix/`, `refactor/`, `test/`, or `chore/`. Never use `codex` in a branch name.
- Stack: TypeScript and `@playwright/test`.
- This repository is the sole owner of ZvenFit Playwright dependencies, browser E2E specs, configs, fixtures, and reusable browser-test workflows. Never move or duplicate them into `zvenfit-frontend`.
- `zvenfit-frontend` may only call a reusable workflow from this repository, pinning both the workflow reference and checkout input to the same full immutable commit SHA.
- Publish and validate browser-test changes here first; update the pinned frontend SHA only afterwards.
- Prefer accessible locators (`getByRole`, `getByLabel`) and user-visible assertions. Keep CSS selectors inside page objects when no accessible contract exists.
- The adjacent `../zvenfit-frontend` repository is the source of truth for routes and UI behavior. Do not edit it from this repository unless the task explicitly asks for frontend changes.
