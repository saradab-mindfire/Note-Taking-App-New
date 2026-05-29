## Context

The application has unit tests (Vitest) and API integration tests (Supertest) but no browser-level E2E coverage. All existing tests run against isolated units; no test verifies that the frontend, backend, and database work together as a real user would experience them. The goal is a Playwright suite that covers the full user journey across all shipped features.

## Goals / Non-Goals

**Goals:**
- New `apps/e2e/` pnpm workspace package containing all E2E test code
- Page Object Model (POM) pattern for maintainable selectors
- Playwright fixtures for authentication state and test data seeding
- 7 happy-path scenarios + 4 failure scenarios matching the spec
- Tests run against a locally running dev stack (`http://localhost:5173` + `http://localhost:3000`)
- Per-test data isolation: unique users / unique note titles per test run
- Full cleanup of test data after each test
- CI-ready `playwright.config.ts` with HTML reporter and retry on CI

**Non-Goals:**
- Performance or load testing
- Cross-browser matrix beyond Chromium for the initial suite
- Testing against staging or production environments
- Visual regression / screenshot diffing

## Decisions

### Decision 1: `apps/e2e/` as a separate workspace package
**Rationale**: Keeps E2E deps (Playwright, `@playwright/test`) isolated from the frontend and backend. The package has its own `package.json` and `tsconfig.json` and is registered in the root `pnpm-workspace.yaml`. A root-level `pnpm test:e2e` script delegates to this package.

**Alternative considered**: Colocate tests inside `apps/frontend/e2e/`. Rejected because it pollutes the frontend build config and couples Playwright's Node environment with Vite's browser environment.

### Decision 2: Page Object Model
**Rationale**: Centralises selectors and actions so that a UI change only requires updating one POM class rather than every test that touches that page. Each page has its own `*Page.ts` class under `apps/e2e/src/pages/`.

**Alternative considered**: Direct locator calls inline in tests. Rejected for long-term maintainability.

### Decision 3: Playwright fixtures for auth and data
**Rationale**: Playwright's fixture system composes cleanly — an `authenticatedPage` fixture can call the backend API directly (via `request` context) to register and log in a user, set the auth token in `localStorage`, and yield the page. This avoids repeating login UI steps in every test and is faster.

Data fixtures (create note, create tag, etc.) also use the API context directly so tests start with the right state without relying on prior test steps.

**Alternative considered**: `beforeEach` hooks with UI login. Rejected because it is slow and fragile.

### Decision 4: Unique identifiers per test
**Rationale**: Tests generate unique emails (`test-<uuid>@e2e.test`) and note titles (`Test Note <uuid>`) to prevent cross-test contamination when running in parallel.

### Decision 5: Cleanup via API DELETE in `afterEach`
**Rationale**: After each test the fixture tears down created users and notes via authenticated DELETE requests. This keeps the database clean without needing a full DB reset between runs.

**Alternative considered**: Truncate tables before/after suite. Rejected because it requires direct DB access and breaks parallel execution.

### Decision 6: Chromium only (initial)
**Rationale**: Covering the full scenario suite on one browser first provides most of the value. Firefox and WebKit can be added in a follow-on ticket.

## Risks / Trade-offs

- **Flakiness on autosave timing** → Use `waitForRequest` / `waitForResponse` to wait for the autosave API call rather than fixed `waitForTimeout` delays.
- **TipTap rich text editor interaction** → Playwright's `fill` does not work on contenteditable. Use `locator.pressSequentially()` or `page.keyboard.type()` after clicking the editor. Document the pattern in `README.md`.
- **Share link expiry in tests** → Use a long expiry (or no expiry) for E2E-created share links; test the expired-link failure scenario by creating a link via API with `expiresAt` set to a past timestamp.
- **Version history ordering** → Tests must wait for each save to complete (via API response) before triggering the next edit to ensure a predictable version list.
- **Test parallelism** → Playwright runs tests in parallel by default. Each test must be fully isolated (unique users, unique data) to avoid conflicts.

## Migration Plan

1. Add `apps/e2e/` package and register in `pnpm-workspace.yaml`
2. Install `@playwright/test` and install browsers (`npx playwright install --with-deps chromium`)
3. Add `test:e2e` script to root `package.json`
4. Wire up in CI after unit/integration tests pass
5. No rollback needed — test code does not affect production

## Open Questions

- Should the E2E suite run against a seeded test database snapshot or rely entirely on per-test API setup? (Current decision: per-test API setup for simplicity.)
- Should expired share link testing mock the clock or create past-expiry records via API? (Current decision: create past-expiry records via API.)
