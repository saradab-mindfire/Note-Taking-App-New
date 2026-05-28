## 1. Dependencies & Tooling

- [x] 1.1 Install `react-router-dom` in `apps/frontend`
- [x] 1.2 Install `react-hook-form` and `@hookform/resolvers` in `apps/frontend`
- [x] 1.3 Install and initialise shadcn/ui in `apps/frontend` (run `npx shadcn@latest init`)
- [x] 1.4 Add shadcn/ui components: Button, Input, Form, FormField, FormItem, FormLabel, FormControl, FormMessage, Card, CardHeader, CardTitle, CardContent

## 2. Shared Package — Form Schemas

- [x] 2.1 Add `confirmPassword` field (client-only) to a `registerFormSchema` in `packages/shared/src/schemas/auth.ts` (extends `registerSchema`, not sent to API)
- [x] 2.2 Add `confirmNewPassword` field (client-only) to a `resetPasswordFormSchema` in `packages/shared/src/schemas/auth.ts`
- [x] 2.3 Export `registerFormSchema` and `resetPasswordFormSchema` from `packages/shared/src/index.ts`

## 3. Auth State — Zustand Store

- [x] 3.1 Create `apps/frontend/src/store/authStore.ts` with `accessToken`, `user`, `isAuthLoading` state and `setAuth`, `clearAuth`, `logout` actions
- [x] 3.2 Persist refresh token to `localStorage['refresh_token']` inside `setAuth`; remove it inside `logout`

## 4. API Client

- [x] 4.1 Create `apps/frontend/src/lib/apiClient.ts` — a typed fetch wrapper that attaches `Authorization: Bearer <token>` from the auth store on every request
- [x] 4.2 Add 401 interceptor: on 401, call `POST /api/auth/refresh` with the stored refresh token, update the store with the new access token, and retry the original request once
- [x] 4.3 On refresh failure inside the interceptor, call `logout()` and navigate to `/login`

## 5. Silent Refresh on App Mount

- [x] 5.1 Create `apps/frontend/src/hooks/useInitAuth.ts` that reads `localStorage['refresh_token']` on mount, calls `POST /api/auth/refresh`, sets the store on success, and sets `isAuthLoading = false` on completion or failure
- [x] 5.2 Call `useInitAuth` in `App.tsx` so the silent refresh runs before any route renders

## 6. Router Setup & Route Guards

- [x] 6.1 Wrap `<App>` with `<BrowserRouter>` in `apps/frontend/src/main.tsx`
- [x] 6.2 Create `apps/frontend/src/components/ProtectedRoute.tsx` — shows spinner while `isAuthLoading`, redirects to `/login` (with `state.from`) if unauthenticated, otherwise renders children
- [x] 6.3 Create `apps/frontend/src/components/AuthRoute.tsx` — shows spinner while `isAuthLoading`, redirects to `/` if authenticated, otherwise renders children
- [x] 6.4 Define routes in `App.tsx`: auth pages wrapped in `<AuthRoute>`, all other pages wrapped in `<ProtectedRoute>`

## 7. TanStack Query Hooks

- [x] 7.1 Create `apps/frontend/src/hooks/useLogin.ts` — `useMutation` calling `POST /api/auth/login`, stores tokens on success
- [x] 7.2 Create `apps/frontend/src/hooks/useRegister.ts` — `useMutation` calling `POST /api/auth/register`
- [x] 7.3 Create `apps/frontend/src/hooks/useForgotPassword.ts` — `useMutation` calling `POST /api/auth/forgot-password`
- [x] 7.4 Create `apps/frontend/src/hooks/useResetPassword.ts` — `useMutation` calling `POST /api/auth/reset-password`

## 8. Login Page

- [x] 8.1 Create `apps/frontend/src/pages/LoginPage.tsx` with React Hook Form + `LoginSchema` validation
- [x] 8.2 Display inline field errors for email and password
- [x] 8.3 Show an error banner for HTTP 401 ("Invalid email or password") and HTTP 5xx ("Something went wrong. Please try again.")
- [x] 8.4 Disable submit button and show loading indicator while mutation is pending
- [x] 8.5 On success, redirect to `state.from ?? '/'`
- [x] 8.6 Add link to `/register`

## 9. Register Page

- [x] 9.1 Create `apps/frontend/src/pages/RegisterPage.tsx` with React Hook Form + `registerFormSchema` validation (includes confirmPassword check)
- [x] 9.2 Display inline field errors for email, password, and confirm-password
- [x] 9.3 Show an error banner for HTTP 409 ("An account with this email already exists.")
- [x] 9.4 Disable submit button and show loading indicator while mutation is pending
- [x] 9.5 On success, redirect to `/login` with success message "Account created. Please sign in."
- [x] 9.6 Add link to `/login`

## 10. Forgot-Password Page

- [x] 10.1 Create `apps/frontend/src/pages/ForgotPasswordPage.tsx` with React Hook Form + `ForgotPasswordSchema` validation
- [x] 10.2 Display inline field error for email
- [x] 10.3 Show error banner on unexpected failures
- [x] 10.4 Disable submit button and show loading indicator while mutation is pending
- [x] 10.5 On HTTP 200, navigate to `/reset-password` with submitted email in location state
- [x] 10.6 Add link back to `/login`

## 11. Reset-Password Page

- [x] 11.1 Create `apps/frontend/src/pages/ResetPasswordPage.tsx`; read email from `location.state` and redirect to `/forgot-password` if absent
- [x] 11.2 Wire React Hook Form + `resetPasswordFormSchema` (OTP, newPassword, confirmNewPassword)
- [x] 11.3 Display inline field errors for OTP, new password, and confirm-new-password
- [x] 11.4 Show error banner for HTTP 400 ("OTP is invalid or has expired.")
- [x] 11.5 Disable submit button and show loading indicator while mutation is pending
- [x] 11.6 On HTTP 200, redirect to `/login` with message "Password reset successful. Please sign in."

## 12. Build, Lint & Test

- [x] 12.1 Run `pnpm build` — resolve all TypeScript errors
- [x] 12.2 Run `pnpm lint --max-warnings 0` — fix all lint warnings
- [x] 12.3 Run `pnpm test` — ensure all existing tests pass
