## 1. Backend — shareUrl points to frontend

- [x] 1.1 In `apps/backend/src/features/sharing/sharing.service.ts`, replace `process.env['APP_URL'] ?? 'http://localhost:3000'` with `process.env['FRONTEND_URL'] ?? 'http://localhost:5173'` for `shareUrl` construction in both `generateShareLink` and `listShareLinks`
- [x] 1.2 Add `FRONTEND_URL=http://localhost:5173` to `apps/backend/.env.example` (or root `.env.example` if it exists)

## 2. Frontend — public share service

- [x] 2.1 Add `fetchPublicNote(token: string): Promise<PublicNoteResponse>` to `apps/frontend/src/services/sharing.service.ts` — calls `GET /api/public/share/:token` via `apiRequest`

## 3. Frontend — PublicSharePage component

- [x] 3.1 Create `apps/frontend/src/pages/PublicSharePage.tsx` with a TanStack Query `useQuery` for `fetchPublicNote(token)`
- [x] 3.2 Render loading skeleton while the query is in-flight
- [x] 3.3 Render note title as an `<h1>` heading and note content using TipTap `useEditor({ editable: false })` with `EditorContent` and `prose prose-sm max-w-none` styling
- [x] 3.4 Map each error state to a specific UI message:
  - HTTP 403 + "expired" → "This share link has expired."
  - HTTP 403 + "revoked" → "This share link has been revoked."
  - HTTP 403 + "no longer available" → "This note is no longer available."
  - HTTP 404 → "Share link not found."
  - Other errors → generic error message
- [x] 3.5 Wrap content in a responsive container (`mx-auto max-w-3xl px-4 py-8`)

## 4. Frontend — router

- [x] 4.1 In `apps/frontend/src/App.tsx`, add `<Route path="/share/:token" element={<PublicSharePage />} />` outside the `<ProtectedRoute>` wrapper, before the fallback route

## 5. Tests — update E2E share assertion

- [x] 5.1 In `apps/frontend/e2e/tests/share.spec.ts`, update the `shareUrl` assertion from `toContain('/public/share/')` to `toContain('/share/')`

## 6. Verification

- [x] 6.1 Run `pnpm build` — no TypeScript errors
- [x] 6.2 Run `pnpm lint --max-warnings 0` — no lint warnings
- [x] 6.3 Run `pnpm test` — all existing tests pass (200/200 unit tests)
- [x] 6.4 Run `pnpm test:e2e --project=chromium` — E2E share tests pass with updated assertion
