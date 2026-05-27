## Why

Users who forget their password have no way to recover their account — there is currently no password reset mechanism. This blocks account access and must be resolved before the application can be used in production.

## What Changes

- New `POST /api/auth/forgot-password` endpoint — accepts an email, generates a 6-digit OTP, stores it in the database with a 15-minute expiry, and logs it to the console (email delivery is out of scope)
- New `POST /api/auth/reset-password` endpoint — accepts an email, OTP, and new password; validates the OTP, hashes and saves the new password, and invalidates the OTP
- New `password_reset_otps` table in PostgreSQL to store pending OTPs (email, code, expiresAt, usedAt?)
- New Zod schemas (`ForgotPasswordSchema`, `ResetPasswordSchema`) and TypeScript types in `packages/shared`
- Invalid email, expired OTP, and already-used OTP all fail gracefully without revealing whether the email exists

## Capabilities

### New Capabilities

- `password-reset-request`: User can request a password reset for their email address; the system generates a 6-digit OTP, stores it with a 15-minute expiry, and logs the code to the console; the response is always `200 OK` regardless of whether the email is registered (prevents enumeration)
- `password-reset-otp`: User can submit their email, OTP, and new password to complete the reset; the system validates the OTP, hashes the new password with bcrypt, updates the user record, and marks the OTP as used; expired or invalid OTPs are rejected

### Modified Capabilities

<!-- None — no existing spec requirements change -->

## Impact

- **Database**: New `password_reset_otps` Prisma model; schema migration required
- **Backend**: Two new route handlers under `/api/auth`; no changes to existing auth endpoints
- **Shared package**: `ForgotPasswordSchema` (email), `ResetPasswordSchema` (email, otp, newPassword) and their TypeScript types
- **Dependencies**: No new dependencies — reuses existing `bcryptjs` and Prisma client
- **Environment**: No new env vars required
- **Security**: OTP is a 6-digit numeric code; response for forgot-password is always 200 to prevent user enumeration; OTPs are single-use and time-limited
