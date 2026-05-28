# openspec/project.md — Living Project Context

Derived from `docs/FRS.md` + `docs/SDS.md`. Updated after each archived change.

---

## Project Summary

Full-stack Note-Taking Application. Authenticated users can create and manage notes, organize with tags, search using full-text search, share notes via public links, and view/restore version history.

---

## Current System State

Last updated: 2026-05-27 (after AB-1005)

### Implemented Capabilities

| Capability                            | Spec                                     | Change  |
| ------------------------------------- | ---------------------------------------- | ------- |
| Monorepo workspace setup              | `openspec/specs/monorepo-workspace/`     | AB-1001 |
| Dev tooling (ESLint, Prettier, Husky) | `openspec/specs/dev-tooling/`            | AB-1001 |
| Database schema (all tables)          | `openspec/specs/database-schema/`        | AB-1001 |
| User registration                     | `openspec/specs/user-registration/`      | AB-1002 |
| User login                            | `openspec/specs/user-login/`             | AB-1002 |
| Auth logout                           | `openspec/specs/auth-logout/`            | AB-1002 |
| Token refresh                         | `openspec/specs/token-refresh/`          | AB-1002 |
| Auth middleware                       | `openspec/specs/auth-middleware/`        | AB-1002 |
| Password reset (OTP)                  | `openspec/specs/password-reset-otp/`     | AB-1003 |
| Password reset request                | `openspec/specs/password-reset-request/` | AB-1003 |
| Notes CRUD                            | `openspec/specs/notes-crud/`             | AB-1004 |
| Notes filtering                       | `openspec/specs/notes-filtering/`        | AB-1005 |

### Not Yet Implemented

| Feature          | FRS Reference                |
| ---------------- | ---------------------------- |
| Tags CRUD        | FR-3.1, FR-3.2               |
| Full-text search | FR-4.1, FR-4.2               |
| Public sharing   | FR-5.1, FR-5.2, FR-5.3       |
| Version history  | FR-6.1, FR-6.2, FR-6.3       |
| Frontend (all)   | FR-1 through FR-6 (UI layer) |

---

## Architecture

### Monorepo Structure

```
apps/
  backend/     — Express 5 + Prisma + PostgreSQL
  frontend/    — React 19 + Vite + TanStack Query + Zustand
packages/
  shared/      — Zod schemas + TypeScript types (consumed by both apps)
```

### Backend Layer Order

`routes → controllers → services → repositories → prisma`

### Auth Flow

- Access token: JWT, 15-minute expiry
- Refresh token: stored in DB (`refresh_tokens` table), 7-day expiry
- Password reset: OTP logged to console only (no email service)

### API Base

`/api/v1`

### Response Envelope

```json
// Success
{ "success": true, "data": {} }

// Error
{ "success": false, "error": { "message": "", "code": "" } }
```

---

## Data Model Summary

| Table            | Key Fields                                                                |
| ---------------- | ------------------------------------------------------------------------- |
| `users`          | id, email, passwordHash, createdAt, updatedAt                             |
| `refresh_tokens` | id, userId, token, expiresAt, revokedAt                                   |
| `notes`          | id, userId, title, content, deletedAt (soft delete), createdAt, updatedAt |
| `tags`           | id, userId, name, color                                                   |
| `note_tags`      | noteId + tagId (composite PK)                                             |
| `shared_links`   | id, noteId, token, expiresAt, revokedAt, viewCount                        |
| `note_versions`  | id, noteId, title, content, createdAt                                     |

---

## Invariants (never violate)

- Notes are **soft deleted** via `deletedAt` — never hard deleted
- All Zod schemas live in `packages/shared/src/schemas/` — never duplicated in apps
- Prisma ORM only — no raw SQL except `$queryRaw` for full-text search
- JWT required on all routes except `/register`, `/login`, `/reset-password`, `/public` share view
- Branch naming: `feature/{domain}/AB-{ticket}-{name}`
- Commit format: `feat(scope): description AB#ticket`
