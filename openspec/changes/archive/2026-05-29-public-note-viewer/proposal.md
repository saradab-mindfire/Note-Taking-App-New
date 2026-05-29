## Why

Share links currently point directly to the backend API endpoint (`/public/share/:token`), which returns raw JSON. Recipients see machine-readable output instead of a human-readable note. A dedicated frontend page is needed so shared notes open in the application UI.

## What Changes

- Add a public frontend route at `/share/:token` that renders a note in read-only mode — no authentication required
- Create a `PublicSharePage` component with title, content, and user-friendly error states (expired, revoked, invalid, load failure)
- Change the backend `shareUrl` to use a `FRONTEND_URL` env var so generated links point to the frontend (`/share/:token`) instead of the backend API

## Capabilities

### New Capabilities
- `public-share-page`: Public frontend route at `/share/:token` — unauthenticated read-only note viewer with error handling for all link states

### Modified Capabilities
- `note-sharing`: `shareUrl` in `POST /notes/:id/share` and `GET /notes/:id/shares` responses must now be generated using a `FRONTEND_URL` env var pointing to the frontend origin, producing URLs of the form `<FRONTEND_URL>/share/:token`

## Impact

- `apps/backend/src/features/sharing/sharing.service.ts` — replace `APP_URL` with `FRONTEND_URL` for `shareUrl` construction; add `FRONTEND_URL` env var (default `http://localhost:5173`)
- `apps/frontend/src/pages/PublicSharePage.tsx` — new page component
- `apps/frontend/src/services/` — new public share API call
- `apps/frontend/src/App.tsx` — add `/share/:token` route outside `ProtectedRoute`
- No database or schema changes
- Existing E2E share tests that assert `shareUrl` contains `/public/share/` will need updating
