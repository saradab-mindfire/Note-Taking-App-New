## Context

Share links are currently generated as `http://localhost:3000/public/share/:token` — the backend's public API URL. When a recipient opens this link, their browser hits the Express server directly and receives raw JSON. The frontend has no route for `/share/:token` and the backend has no awareness of the frontend origin.

**Current state:**
- `sharing.service.ts`: constructs `shareUrl` using `process.env['APP_URL'] ?? 'http://localhost:3000'`, pointing to the backend
- `App.tsx`: no `/share/:token` route exists; all protected routes require auth
- `packages/shared`: `PublicNoteResponse` type and `publicNoteResponseSchema` already exist and are exported — no new shared types needed
- Backend `GET /public/share/:token` works correctly and is already auth-free

## Goals / Non-Goals

**Goals:**
- Generated `shareUrl` points to the frontend (`<FRONTEND_URL>/share/:token`)
- Frontend route `/share/:token` is publicly accessible (no auth required)
- Public share page renders the note title and content in read-only mode
- Expired, revoked, invalid-token, and load-failure states each show a user-friendly error

**Non-Goals:**
- Commenting, reactions, or any interactivity on the public page
- SEO meta tags or server-side rendering
- Changes to the public backend API endpoint (`GET /public/share/:token`)
- Rich text toolbar on the public page

## Decisions

### 1. `shareUrl` uses a separate `FRONTEND_URL` env var
Add `FRONTEND_URL = process.env['FRONTEND_URL'] ?? 'http://localhost:5173'` to `sharing.service.ts` for `shareUrl` construction. The existing `APP_URL` (backend URL) is kept for other uses. This makes the two concerns explicit and independently configurable in production.

**Alternative considered:** Rename `APP_URL` to point to the frontend — rejected; `APP_URL` is a backend identity variable and conflating it with the frontend origin would confuse future configuration.

### 2. `/share/:token` route is placed outside `ProtectedRoute`
Add the route directly in `App.tsx` at the top level, not inside the `<Route element={<ProtectedRoute />}>` wrapper. This allows unauthenticated users to open share links without being redirected to `/login`.

**Alternative considered:** A dedicated `PublicRoute` wrapper (redirect to `/notes` if already logged in) — rejected; public share links should be accessible regardless of auth state. A logged-in user should also be able to open a share link.

### 3. Read-only rendering via TipTap `useEditor` with `editable: false`
The `PublicSharePage` uses `useEditor({ editable: false })` with `EditorContent` to render the TipTap JSON content. This reuses the existing prose styles (`prose prose-sm max-w-none`) without the edit affordances.

**Alternative considered:** `generateHTML` from `@tiptap/html` to render static HTML — rejected; it requires importing all TipTap extensions twice. `useEditor(editable: false)` reuses the existing extension set in the app.

**Alternative considered:** Rendering the raw JSON as plain text — rejected; loses all formatting.

### 4. Service function in `sharing.service.ts` (frontend)
Add `fetchPublicNote(token: string)` to the existing `apps/frontend/src/services/sharing.service.ts`. The call hits `/api/public/share/:token` through the existing `apiRequest` helper which proxies to the backend. This follows the established pattern of all API calls going through `services/`.

### 5. Error state mapping
The backend returns `403` with `{ error: "Link has expired" | "Link has been revoked" | "Note is no longer available" }` and `404` for unknown tokens. The frontend reads the error message from the response body and maps it to specific UI states: Expired, Revoked, Unavailable, Not Found, and generic load failure.

## Risks / Trade-offs

- [Existing E2E tests] `share.spec.ts` asserts `shareUrl` contains `/public/share/` — this will fail after the backend change. → Update the assertion in that test.
- [FRONTEND_URL default] Defaulting to `http://localhost:5173` only works in local dev. Production deployments must set `FRONTEND_URL` explicitly. → Document in `.env.example`; the default is safe for dev.
- [TipTap bundle size] Loading the full TipTap editor for a read-only public page increases JS bundle for unauthenticated visitors. → Acceptable for now; code-splitting is out of scope.
- [CORS on public endpoint] `GET /public/share/:token` must allow unauthenticated cross-origin requests from the frontend origin. → Already auth-free; verify CORS config allows the frontend origin.

## Migration Plan

1. Update `sharing.service.ts` (backend) to use `FRONTEND_URL`
2. Add `FRONTEND_URL=http://localhost:5173` to `.env.example`
3. Add `PublicSharePage` and route to frontend
4. Update the E2E test assertion that checks `shareUrl`
5. Run full test suite — existing share tests should pass with updated assertion
