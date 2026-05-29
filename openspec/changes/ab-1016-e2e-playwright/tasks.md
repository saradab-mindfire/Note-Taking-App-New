## 1. Package Setup

- [x] 1.1 Create `apps/e2e/` directory and add `package.json` with `@playwright/test` dependency
- [x] 1.2 Add `apps/e2e` to root `pnpm-workspace.yaml`
- [x] 1.3 Create `apps/e2e/tsconfig.json` extending root config
- [x] 1.4 Create `apps/e2e/playwright.config.ts` with baseURL, Chromium-only project, HTML reporter, and CI retry (2 retries when `CI=true`)
- [x] 1.5 Add `test:e2e` script to root `package.json` delegating to `apps/e2e`
- [x] 1.6 Install Playwright browsers: `npx playwright install --with-deps chromium`

## 2. Fixtures and Utilities

- [x] 2.1 Create `apps/e2e/src/fixtures/auth.fixture.ts` — registers a unique test user via API, sets JWT in `localStorage`, and deletes the user on teardown
- [x] 2.2 Create `apps/e2e/src/fixtures/data.fixture.ts` — helpers to create/delete notes, tags, and share links via API within a test
- [x] 2.3 Create `apps/e2e/src/fixtures/index.ts` — compose and export combined `test` object extending Playwright base with auth and data fixtures

## 3. Page Objects

- [x] 3.1 Create `apps/e2e/src/pages/LoginPage.ts` — `goto()`, `login(email, password)`, `getErrorMessage()`
- [x] 3.2 Create `apps/e2e/src/pages/RegisterPage.ts` — `goto()`, `register(name, email, password)`, `getErrorMessage()`
- [x] 3.3 Create `apps/e2e/src/pages/NotesListPage.ts` — `goto()`, `openNote(title)`, `filterByTag(tag)`, `getNoteTitles()`
- [x] 3.4 Create `apps/e2e/src/pages/NoteEditorPage.ts` — `typeContent(text)`, `getContent()`, `waitForAutosave()`, `openHistory()`, `openShare()`, `save()`
- [x] 3.5 Create `apps/e2e/src/pages/SearchPage.ts` — `goto()`, `search(query)`, `getResults()`, `openResult(title)`
- [x] 3.6 Create `apps/e2e/src/pages/SharePage.ts` — `goto(token)`, `getContent()`, `isReadOnly()`
- [x] 3.7 Create `apps/e2e/src/pages/VersionHistoryDrawer.ts` — `getVersionCount()`, `restoreVersion(index)`

## 4. Scenario Tests

- [x] 4.1 Create `apps/e2e/src/tests/auth.spec.ts` — Scenario 1: registration → login → redirect; invalid login error
- [x] 4.2 Create `apps/e2e/src/tests/notes.spec.ts` — Scenario 2: create note → type content → wait for autosave → reload → verify persistence
- [x] 4.3 Create `apps/e2e/src/tests/tags.spec.ts` — Scenario 3: create tags → assign to note → filter by tag → verify results
- [x] 4.4 Create `apps/e2e/src/tests/search.spec.ts` — Scenario 4: search keyword → verify result appears → open note
- [x] 4.5 Create `apps/e2e/src/tests/share.spec.ts` — Scenario 5: generate share link → open in unauthenticated context → verify read-only; expired link error
- [x] 4.6 Create `apps/e2e/src/tests/versions.spec.ts` — Scenario 6: edit note multiple times → open history drawer → restore version → verify content
- [x] 4.7 Create `apps/e2e/src/tests/logout.spec.ts` — Scenario 7: logout → verify redirect; direct navigation to `/notes` redirects to `/login`
- [x] 4.8 Create `apps/e2e/src/tests/unauthorized.spec.ts` — cross-user note access returns 403/404

## 5. Verification

- [ ] 5.1 Run `pnpm test:e2e` against local dev stack — all tests pass
- [ ] 5.2 Run `pnpm lint` — no lint errors in `apps/e2e`
- [ ] 5.3 Run `pnpm build` — monorepo builds cleanly
