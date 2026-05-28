## Context

The backend auth APIs are fully implemented (login, register, forgot-password, reset-password, token refresh). The frontend is a bare Vite + React 19 app with Zustand and TanStack Query already wired in. There is no routing library yet and no UI component library bootstrapped. The shared package already contains all required Zod schemas (`LoginSchema`, `RegisterSchema`, `ForgotPasswordSchema`, `ResetPasswordSchema`).

## Goals / Non-Goals

**Goals:**
- Ship four auth pages (`/login`, `/register`, `/forgot-password`, `/reset-password`) with full form validation
- Global Zustand auth store (access token + user profile, in-memory)
- Silent access-token refresh via a custom API client interceptor
- Protected route wrapper — unauthenticated users redirect to `/login`; authenticated users redirect away from auth pages

**Non-Goals:**
- OAuth / social login
- Multi-factor authentication
- Notes, search, sharing, or tags UI
- Backend changes of any kind

## Decisions

### Routing: react-router-dom v6
React Router is the de-facto standard for React SPAs and already assumed by the stack. No alternative considered; it must be added as a dependency.

### Form management: React Hook Form + Zod resolver
shadcn/ui Form primitives are built on React Hook Form. Zod schemas already exist in `packages/shared`, so `@hookform/resolvers/zod` gives zero-duplication validation. Alternative (controlled state + manual validation) would re-implement what RHF provides.

### shadcn/ui setup
Components (Button, Input, Form, Card, Label) will be added via the `shadcn` CLI. Tailwind + postcss are already configured. Radix UI primitives are installed transitively.

### Token storage strategy
- **Access token**: Zustand in-memory only (lost on page reload — acceptable for 15 min TTL). Never written to localStorage or cookies.
- **Refresh token**: `localStorage` under key `refresh_token`. The backend returns it in the response body (not a `Set-Cookie`), so `HttpOnly` cookie storage is not available without a backend change, which is out of scope.

Risk: localStorage is readable by JS, making it vulnerable to XSS. Mitigation: Content-Security-Policy headers (backend concern) and no `dangerouslySetInnerHTML` in this codebase.

### API client: custom fetch wrapper with interceptor
A thin `apiClient` module wraps `fetch`, attaches the `Authorization: Bearer <token>` header from the Zustand store, and on a `401` response automatically calls `POST /api/auth/refresh`, updates the store, then retries the original request once. This avoids Axios as an additional dependency while providing the retry behavior needed for transparent token refresh.

TanStack Query is used for data fetching mutations (login, register, etc.) and will consume the `apiClient` for its `queryFn`/`mutationFn` calls.

### Auth page redirect strategy
- `<ProtectedRoute>` wraps app routes: if no access token in store, redirect to `/login` (stores the intended path in `location.state` for post-login redirect).
- `<AuthRoute>` wraps auth pages: if an access token is present, redirect to `/` (notes root).
- On page reload, attempt a silent refresh using the stored refresh token before rendering. If refresh fails, clear state and show login.

## Risks / Trade-offs

- **Refresh token in localStorage** → XSS risk. Mitigation: strict CSP, avoid raw HTML injection.
- **Access token lost on reload** → silent refresh on app mount adds a ~200 ms loading flash. Mitigation: show a skeleton/spinner during the initial auth check.
- **No refresh token rotation** → compromised refresh token can be used until expiry (7 days). Mitigation: out of scope per backend spec; backend can add rotation later.
- **react-router-dom not yet installed** → tasks must add it before routing can be tested.

## Migration Plan

1. Install new deps (`react-router-dom`, `react-hook-form`, `@hookform/resolvers`, shadcn/ui CLI components).
2. Bootstrap router in `main.tsx`, wrapping `<App>` with `<BrowserRouter>`.
3. Create Zustand auth store.
4. Create `apiClient` with refresh interceptor.
5. Add TanStack Query hooks for each auth mutation.
6. Build page components using shadcn/ui primitives.
7. Wire `<ProtectedRoute>` / `<AuthRoute>` guards.
8. Add shared Zod schema extensions (e.g., `confirmPassword` field for register form — client-only, not sent to API).

## Open Questions

- Should the register form include a `name` field? The backend `registerSchema` only requires `email` + `password`. Confirm with backend team before adding to the form.
- Should a "Remember me" checkbox affect refresh token TTL? Backend currently hardcodes 7 days — out of scope unless backend supports it.
