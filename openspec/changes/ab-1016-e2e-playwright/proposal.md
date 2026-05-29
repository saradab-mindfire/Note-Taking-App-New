## Why

The application has unit and integration tests but no end-to-end coverage verifying that all features work together as a real user would experience them. A full Playwright E2E suite is needed to catch regressions across the complete user journey — auth, notes, tags, search, sharing, and version history — before each release.

## What Changes

- New `apps/e2e/` workspace package containing all Playwright configuration, fixtures, page objects, and test suites
- E2E tests covering 7 happy-path scenarios and 4 critical failure scenarios (see below)
- Dedicated test user creation and teardown utilities
- Seed/cleanup helpers that run per test to ensure isolation and repeatability
- CI-ready Playwright config targeting the local dev environment

**Scenarios covered:**
- Registration → login → redirect to notes page
- Create note → edit → autosave → reload → verify persistence
- Create tags → assign → filter notes by tag
- Search note content → verify results → open matching note
- Generate share link → access public URL → verify read-only + view count
- Edit note multiple times → view version history → restore historical version → verify content
- Logout → verify protected routes redirect to login

**Failure scenarios:**
- Invalid login credentials
- Expired share link access
- Unauthorized route access
- API failure handling (network error simulation)

## Capabilities

### New Capabilities
- `e2e-tests`: End-to-end Playwright test suite covering the full user journey across all application features

### Modified Capabilities
<!-- No existing spec-level requirements are changing — this change adds tests only. -->

## Impact

- New `apps/e2e/` pnpm workspace package
- `playwright.config.ts` at repo root or within the new package
- Depends on the local dev server (`apps/frontend` + `apps/backend`) being running
- No changes to production code, shared schemas, or existing specs
- Affects CI pipeline — new `pnpm test:e2e` script needed
