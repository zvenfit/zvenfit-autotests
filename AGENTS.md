# Project rules — ZvenFit Autotests

- This is a local-only project. Never sync its files, test data, reports, traces, screenshots, videos, or knowledge to Stefania.
- Never use Stefania, its memory, Wiki, DataCatalog, remote knowledge-base adapters, or sync workflows for this project.
- Do not send real customer data or create real leads. Functional API tests must use Playwright request interception or a local mock.
- Do not commit secrets, real `.env*` files, browser storage state, traces, screenshots, or videos.
- Branch names use conventional prefixes such as `feature/`, `bugfix/`, `hotfix/`, `refactor/`, `test/`, or `chore/`. Never use `codex` in a branch name.
- Stack: TypeScript and `@playwright/test`.
- Prefer accessible locators (`getByRole`, `getByLabel`) and user-visible assertions. Keep CSS selectors inside page objects when no accessible contract exists.
- The adjacent `../zvenfit-frontend` repository is the source of truth for routes and UI behavior. Do not edit it from this repository unless the task explicitly asks for frontend changes.
