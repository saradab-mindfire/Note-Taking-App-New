## 1. Dependencies & Environment

- [x] 1.1 Add `bcrypt` and `@types/bcrypt` to `apps/backend` package.json
- [x] 1.2 Add `jsonwebtoken` and `@types/jsonwebtoken` to `apps/backend` package.json
- [x] 1.3 Add `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_EXPIRY` (15m), `REFRESH_TOKEN_EXPIRY` (7d) to `.env.example`
- [x] 1.4 Run `pnpm install` to install new dependencies

## 2. Shared Package — Zod Schemas & Types

- [x] 2.1 Add `RegisterSchema` to `packages/shared/src/schemas/auth.ts` (email: string, password: min 8 chars)
- [x] 2.2 Add `LoginSchema` to `packages/shared/src/schemas/auth.ts` (email: string, password: string)
- [x] 2.3 Add `RefreshSchema` to `packages/shared/src/schemas/auth.ts` (refreshToken: string)
- [x] 2.4 Add `LogoutSchema` to `packages/shared/src/schemas/auth.ts` (refreshToken: string)
- [x] 2.5 Export all schemas and their inferred TypeScript types from `packages/shared/src/index.ts`
- [x] 2.6 Build `packages/shared` and verify exported types compile

## 3. Database — Prisma Models & Migration

- [x] 3.1 Add `User` model to `apps/backend/prisma/schema.prisma` (fields: `id` UUID, `email` unique, `passwordHash`, `createdAt`, `updatedAt`, `deletedAt?`)
- [x] 3.2 Add `RefreshToken` model to `apps/backend/prisma/schema.prisma` (fields: `id` UUID, `token` unique, `userId` FK → User, `expiresAt`, `revokedAt?`, `createdAt`)
- [x] 3.3 Add `refreshTokens` relation to `User` model
- [ ] 3.4 Run `pnpm --filter backend prisma migrate dev --name add-users-and-refresh-tokens` ⚠️ requires DATABASE_URL in .env
- [ ] 3.5 Regenerate Prisma client (`pnpm --filter backend prisma generate`) ⚠️ requires DATABASE_URL in .env

## 4. Backend — Auth Utilities

- [x] 4.1 Create `apps/backend/src/lib/jwt.ts` — implement `generateAccessToken(payload)` (signs with `JWT_SECRET`, 15-min expiry)
- [x] 4.2 Add `generateRefreshToken(payload)` to `jwt.ts` (signs with `JWT_REFRESH_SECRET`, 7-day expiry)
- [x] 4.3 Add `verifyAccessToken(token)` to `jwt.ts` (throws on invalid/expired)
- [x] 4.4 Add `verifyRefreshToken(token)` to `jwt.ts` (throws on invalid/expired)
- [x] 4.5 Create `apps/backend/src/lib/password.ts` — implement `hashPassword(plain)` using bcrypt (salt rounds 12)
- [x] 4.6 Add `comparePassword(plain, hash)` to `password.ts`

## 5. Backend — Extend Express Request Type

- [x] 5.1 Create `apps/backend/src/types/express.d.ts` — augment `Express.Request` to include `user?: { userId: string; email: string }`

## 6. Backend — Auth Middleware

- [x] 6.1 Create `apps/backend/src/middleware/auth.middleware.ts` — implement `authMiddleware` that reads `Authorization: Bearer <token>`, verifies access token, sets `req.user`, calls `next()` or returns 401
- [x] 6.2 Handle missing header, wrong scheme (`Authorization: Token ...`), expired token, and tampered token — all return `401 { success: false, error: "Unauthorized" }`

## 7. Backend — Auth Route Handlers

- [x] 7.1 Create `apps/backend/src/features/auth/auth.controller.ts` with `register` handler — validate `RegisterSchema`, check duplicate email (409), hash password, create User, return 201 `{ id, email }`
- [x] 7.2 Add `login` handler — validate `LoginSchema`, look up user, compare password (401 on mismatch or user not found), generate access + refresh tokens, persist refresh token to DB, return 200 `{ accessToken, refreshToken }`
- [x] 7.3 Add `refresh` handler — validate `RefreshSchema`, verify refresh token JWT, look up token in DB (check not revoked and not expired), generate new access token, return 200 `{ accessToken }`
- [x] 7.4 Add `logout` handler — validate `LogoutSchema`, set `revokedAt` on matching refresh token (no-op if not found), return 200 `{ success: true }`

## 8. Backend — Auth Router & App Wiring

- [x] 8.1 Create `apps/backend/src/features/auth/auth.router.ts` — wire POST routes to controller handlers
- [x] 8.2 Mount auth router at `/api/auth` in `apps/backend/src/app.ts`
- [x] 8.3 Add `validateBody(schema)` middleware (or inline `schema.parse`) for request validation, returning 400 on Zod errors

## 9. Tests

- [x] 9.1 Unit tests for `generateAccessToken` / `verifyAccessToken` — valid token, expired token, tampered token
- [x] 9.2 Unit tests for `generateRefreshToken` / `verifyRefreshToken` — valid token, expired token
- [x] 9.3 Unit tests for `hashPassword` and `comparePassword`
- [x] 9.4 Integration tests for `POST /api/auth/register` — success (201), duplicate email (409), invalid input (400)
- [x] 9.5 Integration tests for `POST /api/auth/login` — success (200 with tokens), wrong password (401), unknown email (401), missing fields (400)
- [x] 9.6 Integration tests for `POST /api/auth/refresh` — success (200 new access token), expired token (401), revoked token (401), tampered token (401), missing field (400)
- [x] 9.7 Integration tests for `POST /api/auth/logout` — success (200), already-revoked (200 idempotent), unknown token (200), missing field (400)
- [x] 9.8 Integration tests for `authMiddleware` — valid token (passes), no header (401), expired token (401), wrong scheme (401), tampered token (401)

## 10. Build, Lint & Verify

- [x] 10.1 Run `pnpm build` — fix any TypeScript errors
- [x] 10.2 Run `pnpm lint --max-warnings 0` — fix any lint violations
- [x] 10.3 Run `pnpm test` — all tests must pass
