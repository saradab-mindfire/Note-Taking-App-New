## Why

The application currently has no authentication layer, meaning any user can access any data without identifying themselves. Implementing JWT-based authentication is the foundational requirement before any user-scoped features (notes, tags, sharing) can be built.

## What Changes

- Add `users` table to store registered accounts (email + hashed password)
- Add `refresh_tokens` table to persist and revoke refresh token sessions
- New `POST /auth/register` endpoint — creates a user account
- New `POST /auth/login` endpoint — validates credentials and issues JWT access + refresh tokens
- New `POST /auth/refresh` endpoint — exchanges a valid refresh token for a new access token
- New `POST /auth/logout` endpoint — revokes the caller's refresh token
- New `authMiddleware` — validates the `Authorization: Bearer <token>` header on protected routes
- Shared Zod schemas and TypeScript types for all auth payloads in `packages/shared`
- Password hashing with bcrypt (salt rounds ≥ 12)

## Capabilities

### New Capabilities

- `user-registration`: User can create an account using a unique email and password; duplicate emails are rejected
- `user-login`: User can authenticate with email/password and receive a short-lived JWT access token (15 min) and a long-lived refresh token (7 days) stored in PostgreSQL
- `token-refresh`: Client can exchange a valid, non-revoked refresh token for a new access token without re-entering credentials
- `auth-logout`: User can log out by revoking their current refresh token, preventing future token exchanges
- `auth-middleware`: All protected API routes verify the `Authorization: Bearer` header; expired or invalid tokens are rejected with `401 Unauthorized`

### Modified Capabilities

<!-- None — no existing specs are affected by this change -->

## Impact

- **Database**: Two new Prisma models — `User` and `RefreshToken`; schema migration required
- **Backend**: New `auth` router mounted at `/api/auth`; `authMiddleware` exported for use in all subsequent feature routers
- **Shared package**: New Zod schemas (`RegisterSchema`, `LoginSchema`, `RefreshSchema`) and inferred TypeScript types exported from `packages/shared`
- **Dependencies**: `bcrypt`, `jsonwebtoken`, `@types/bcrypt`, `@types/jsonwebtoken` added to backend; no new frontend dependencies
- **Environment**: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_EXPIRY`, `REFRESH_TOKEN_EXPIRY` env vars required
