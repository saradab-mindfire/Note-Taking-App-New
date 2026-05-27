## 1. Shared Package — Zod Schemas & Types

- [x] 1.1 Add `ForgotPasswordSchema` to `packages/shared/src/schemas/auth.ts` (email: string)
- [x] 1.2 Add `ResetPasswordSchema` to `packages/shared/src/schemas/auth.ts` (email: string, otp: 6-digit string, newPassword: min 8 chars)
- [x] 1.3 Add `ForgotPasswordDto` and `ResetPasswordDto` inferred types to `packages/shared/src/types/index.ts`
- [x] 1.4 Build `packages/shared` and verify exported types compile

## 2. Database — Prisma Model & Migration

- [x] 2.1 Add `PasswordResetOtp` model to `apps/backend/prisma/schema.prisma` (fields: `id` cuid, `email` String, `code` String, `expiresAt` DateTime, `usedAt` DateTime?, `createdAt` DateTime default now; unique index on `email`)
- [ ] 2.2 Run `pnpm exec prisma migrate dev --name add-password-reset-otps` from `apps/backend` ⚠️ requires DATABASE_URL in .env
- [x] 2.3 Regenerate Prisma client (`pnpm exec prisma generate`) ⚠️ requires DATABASE_URL in .env

## 3. Backend — Forgot Password Handler

- [x] 3.1 Create `apps/backend/src/features/auth/password-reset.controller.ts` with `forgotPassword` handler
- [x] 3.2 In `forgotPassword`: validate `ForgotPasswordSchema`; if email not found, return 200 silently; generate 6-digit OTP using `crypto.randomInt(100000, 999999)`
- [x] 3.3 Upsert `PasswordResetOtp` row (replace existing for same email): set `code`, `expiresAt = now + 15 min`, `usedAt = null`
- [x] 3.4 Log OTP to console: `console.log(\`[OTP] Reset code for ${email}: ${code}\`)`
- [x] 3.5 Return HTTP 200 `{ success: true }` regardless of whether email exists

## 4. Backend — Reset Password Handler

- [x] 4.1 Add `resetPassword` handler to `password-reset.controller.ts`
- [x] 4.2 Validate `ResetPasswordSchema`; return 400 on invalid input
- [x] 4.3 Look up `PasswordResetOtp` by email; reject (400 `"OTP is invalid or has expired"`) if: no record found, code mismatch, `expiresAt` is in the past, or `usedAt` is set
- [x] 4.4 Hash `newPassword` using `hashPassword` from `lib/password.ts`
- [x] 4.5 Update `user.passwordHash` in the `users` table via Prisma
- [x] 4.6 Set `usedAt = new Date()` on the `PasswordResetOtp` row
- [x] 4.7 Return HTTP 200 `{ success: true }`

## 5. Backend — Router Wiring

- [x] 5.1 Add `POST /forgot-password` and `POST /reset-password` routes to `apps/backend/src/features/auth/auth.router.ts`

## 6. Tests

- [x] 6.1 Integration tests for `POST /api/auth/forgot-password` — success (200, OTP logged), unknown email (200 silent), missing email (400), invalid email format (400)
- [x] 6.2 Integration tests for `POST /api/auth/reset-password` — success (200, password updated, OTP used), expired OTP (400), invalid OTP (400), already-used OTP (400), missing fields (400), short password (400)

## 7. Build, Lint & Verify

- [x] 7.1 Run `pnpm build` — fix any TypeScript errors
- [x] 7.2 Run `pnpm lint --max-warnings 0` — fix any lint violations
- [x] 7.3 Run `pnpm test` — all tests must pass
