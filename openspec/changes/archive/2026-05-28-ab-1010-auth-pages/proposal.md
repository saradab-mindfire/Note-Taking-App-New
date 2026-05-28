## Why

The backend auth APIs (login, register, password reset, token refresh) are implemented but the application has no frontend UI — users cannot authenticate. This change delivers all auth-facing pages so users can register, sign in, and recover their accounts.

## What Changes

- Add `/login` page with email/password form
- Add `/register` page with name, email, password form
- Add `/forgot-password` page to request a password reset link/OTP
- Add `/reset-password` page to submit a new password using the reset token/OTP
- Add global auth state management (Zustand store) holding access token and user profile
- Add silent token refresh via TanStack Query and interceptors
- Add protected route wrapper that redirects unauthenticated users to `/login`
- Add auth-aware redirect: authenticated users visiting auth pages are sent to `/` (notes)
- Add shared Zod schemas for login, register, forgot-password, and reset-password forms in `packages/shared`

## Capabilities

### New Capabilities

- `login-page`: Login form UI with validation, error display, and redirect on success
- `register-page`: Registration form UI with validation and post-register redirect
- `forgot-password-page`: Forgot-password form UI that submits to the password-reset-request API
- `reset-password-page`: Reset-password form UI that validates OTP/token and sets a new password
- `auth-state`: Zustand store for access token, user profile, loading state, and auth actions
- `protected-routes`: React Router route guards that enforce authentication and handle redirects

### Modified Capabilities

*(none — backend auth specs are unchanged)*

## Impact

- **packages/shared**: New Zod schemas and TypeScript types for auth form payloads
- **apps/frontend**: New pages, components, Zustand store, TanStack Query hooks, and route configuration
- **Backend APIs consumed**: `POST /auth/login`, `POST /auth/register`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/refresh` (existing)
- **No backend changes required**
