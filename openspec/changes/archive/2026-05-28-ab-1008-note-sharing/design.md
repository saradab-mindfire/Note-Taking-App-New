## Context

Notes are currently private — accessible only to authenticated owners. There is no mechanism to share note content externally. This change introduces a tokenized public-link system so owners can generate read-only URLs that recipients can open without authenticating.

The backend is Express 5 + Prisma + PostgreSQL 16. Authentication is JWT (access + refresh). Shared schemas live in `packages/shared`. Soft delete uses `deletedAt`.

## Goals / Non-Goals

**Goals:**
- Allow note owners to generate a secure random token-based share link
- Allow owners to revoke a share link at any time
- Expose a public, unauthenticated endpoint that serves a note via its token
- Support optional link expiry (`expiresAt`)
- Track view counts atomically on every public access
- Enforce: revoked → 403, expired → 403, soft-deleted note → 403, wrong owner → 403

**Non-Goals:**
- Password-protected links
- Writable shared notes
- Per-recipient sharing / ACL
- Analytics dashboard
- Email delivery
- Frontend UI (out of scope for this ticket)
- Rate limiting on public endpoint (separate concern)

## Decisions

### Token generation: `crypto.randomBytes(32).toString('hex')` (64-char hex)
Alternatives: UUID v4 (only 122 bits of entropy, widely predictable format), nanoid (extra dependency). `crypto` is built-in, 256-bit entropy is sufficient, hex string is URL-safe. Stored as a unique indexed column.

### Atomic view count: Prisma `update` with `{ increment: 1 }`
Prisma translates this to `SET view_count = view_count + 1` at the database level, avoiding read-modify-write races without needing a transaction or advisory lock.

### Single `shared_links` table (not a column on `notes`)
A link can be revoked and re-created independently of the note. Keeping it separate avoids nullable columns on `notes` and allows future multi-link-per-note if needed.

### Public endpoint at `/public/share/:token` bypasses JWT middleware
The route is mounted before auth middleware (or explicitly excluded). No session or user context is needed — token is the sole credential.

### Expiry check in application layer (not DB constraint)
`expiresAt IS NULL OR expiresAt > NOW()` evaluated in the route handler. Simple, explicit, testable. A cron cleanup job is out of scope; expired rows remain but are blocked at query time.

### Zod schemas in `packages/shared`
Consistent with existing project convention. Backend validates request bodies against shared schemas; frontend can reuse without duplication.

## Risks / Trade-offs

- **Token enumeration**: 64-char hex tokens are practically un-enumerable. No additional rate limiting this ticket — acceptable for MVP.
- **View count on every GET**: Minor write overhead on a read endpoint. For MVP scale this is fine; a queue-based approach would be needed at high traffic.
- **No multi-link support**: Only one active link per note is implied by the design (the latest token). If a second `POST /notes/:id/share` is called, a new token is issued; the old one remains valid until explicitly revoked. This is acceptable — revoking first is documented.

## Migration Plan

1. Add Prisma migration: create `shared_links` table.
2. Deploy backend with new routes.
3. No data migration required — table starts empty.

**Rollback**: Drop the `shared_links` table and remove the new router registration. No existing tables are modified.

## Open Questions

- Should a second `POST /notes/:id/share` auto-revoke the previous link, or allow multiple active links? Current decision: issue new token, old token remains valid. Revisit if product requires single-link semantics.
