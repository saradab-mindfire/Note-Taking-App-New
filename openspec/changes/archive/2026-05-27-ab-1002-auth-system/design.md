## Context

The application is a full-stack note-taking monorepo (React 19 + Express 5 + PostgreSQL via Prisma). Currently there is no authentication layer — no users table, no session management, no protected routes. All planned features (notes, tags, sharing, version history) are user-scoped, so authentication must be in place first.

The architecture mandates:
- Zod schemas and TypeScript types live exclusively in `packages/shared`
- Prisma ORM is the only DB access layer
- Soft delete via `deletedAt` on all user-owned entities

## Goals / Non-Goals

**Goals:**
- Stateless access token (JWT, 15-min expiry) for per-request authentication
- Stateful refresh token (JWT, 7-day expiry) persisted in PostgreSQL for session management and revocation
- bcrypt password hashing (salt rounds ≥ 12)
- `authMiddleware` that validates `Authorization: Bearer <token>` headers and attaches `req.user` for downstream handlers
- Shared Zod validation schemas and TypeScript types in `packages/shared`
- Standard API response shape: `{ success, data?, error? }`

**Non-Goals:**
- OAuth / social login (Google, GitHub)
- Email verification or OTP flows
- Forgot-password / password-reset
- Multi-device session listing or management UI
- Rate limiting on auth endpoints (deferred to infrastructure layer)

## Decisions

### 1. Access Token + Refresh Token Pair (vs. Session Cookies)

**Decision**: Use a short-lived JWT access token and a long-lived refresh token stored in the database.

**Rationale**: Stateless access tokens require no DB lookup on every request (performance), while storing refresh tokens in PostgreSQL enables explicit revocation (logout, suspicious activity). This is the standard approach aligned with the project's stated architecture.

**Alternatives considered**:
- *Session cookies*: simpler but requires sticky sessions or Redis; not suitable for a potential future mobile client.
- *Single long-lived JWT*: no revocation capability without a blocklist.

---

### 2. Refresh Token Storage in PostgreSQL (vs. Redis)

**Decision**: Store refresh tokens in the `refresh_tokens` table via Prisma.

**Rationale**: PostgreSQL is already the project's primary store. Adding Redis purely for token storage introduces operational complexity with no meaningful performance gain at this scale. The refresh endpoint is not a hot path.

**Alternatives considered**:
- *Redis*: faster TTL-based expiry, but adds a new infrastructure dependency.

---

### 3. Two Separate JWT Secrets (`JWT_SECRET` + `JWT_REFRESH_SECRET`)

**Decision**: Use different signing secrets for access and refresh tokens.

**Rationale**: If the access token secret is ever leaked, refresh tokens remain uncompromised, and vice versa. Defence in depth.

---

### 4. bcrypt for Password Hashing (vs. Argon2)

**Decision**: Use `bcrypt` with salt rounds ≥ 12.

**Rationale**: bcrypt is battle-tested, well-supported in the Node.js ecosystem, and the `bcrypt` npm package has no native addon compilation issues on common CI environments. Argon2 is theoretically stronger but adds native binding complexity with no practical gain at this user scale.

---

### 5. Shared Package for Schemas and Types

**Decision**: `RegisterSchema`, `LoginSchema`, `RefreshSchema` and their inferred TypeScript types are defined in `packages/shared` and imported by both backend and (future) frontend.

**Rationale**: Enforced by project architecture rules. Prevents schema drift between client and server validation.

---

### 6. Auth Router Mounted at `/api/auth`

**Decision**: All auth endpoints are grouped under a dedicated Express router at `/api/auth`.

**Rationale**: Clean separation of concerns; easy to apply rate-limiting middleware to the entire prefix later.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Refresh token theft (XSS / network intercept) | Tokens are opaque to the client in this phase; future iteration can move to `httpOnly` cookies. Revocation support limits blast radius. |
| JWT_SECRET exposure via repo | Secrets loaded from environment variables only; `.env` is gitignored; `JWT_SECRET` documented in `.env.example` |
| bcrypt blocking the event loop on high concurrency | `bcrypt.hash` / `bcrypt.compare` run in a libuv thread pool — non-blocking for typical Express workloads. Acceptable at this scale. |
| Token clock skew | `jsonwebtoken` uses `iat`/`exp` in UTC seconds; server-side validation uses `Date.now()` — no skew risk. |
| Refresh token not cleaned up after expiry | A background job (out of scope) or a Prisma `deleteMany` on login can prune expired tokens. Low priority for MVP. |

## Migration Plan

1. Add `bcrypt`, `jsonwebtoken` and their `@types` packages to `apps/backend`
2. Add Prisma models `User` and `RefreshToken`; run `prisma migrate dev`
3. Add shared Zod schemas to `packages/shared` and rebuild the package
4. Implement auth router handlers and middleware
5. Mount router in `apps/backend/src/app.ts` at `/api/auth`
6. Add required env vars to `.env.example`

**Rollback**: Because this is a net-new feature with new tables and no modifications to existing tables, rollback is a Prisma migration rollback (`prisma migrate resolve --rolled-back`) with no data loss risk.

## Open Questions

- Should refresh token rotation be implemented from the start (i.e., issue a new refresh token on each `/auth/refresh` call and revoke the old one)? → **Recommended: yes**, but deferred to a follow-up ticket to keep this scope tight.
- Maximum concurrent refresh tokens per user (all devices vs. single session)? → **Current decision**: unlimited per user, tracked by `deviceId` or `userAgent` in a future iteration.
