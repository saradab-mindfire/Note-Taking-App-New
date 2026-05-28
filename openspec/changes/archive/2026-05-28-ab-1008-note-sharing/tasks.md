## 1. Database

- [x] 1.1 Add `SharedLink` model to `prisma/schema.prisma` with fields: `id`, `token` (unique), `noteId` (FK → Note), `expiresAt` (nullable DateTime), `revokedAt` (nullable DateTime), `viewCount` (Int default 0), `createdAt`, `updatedAt`
- [x] 1.2 Generate and apply Prisma migration: `pnpm prisma migrate dev --name add-shared-links`
- [x] 1.3 Verify migration runs cleanly and `shared_links` table exists in the database

## 2. Shared Package

- [x] 2.1 Add `CreateShareLinkSchema` Zod schema to `packages/shared` (body: `expiresAt?: string (ISO datetime)`)
- [x] 2.2 Add `ShareLinkResponseSchema` Zod schema (fields: `token`, `shareUrl`, `expiresAt`)
- [x] 2.3 Add `PublicNoteResponseSchema` Zod schema (fields: `id`, `title`, `content`, `createdAt`, `updatedAt`, `viewCount`)
- [x] 2.4 Export all new schemas and inferred TypeScript types from `packages/shared/src/index.ts`
- [x] 2.5 Build shared package: `pnpm --filter @notepad/shared build`

## 3. Backend — Sharing Router

- [x] 3.1 Create `apps/api/src/routes/sharing.router.ts` with the three endpoints registered
- [x] 3.2 Implement `POST /notes/:id/share` — validate owner, check `deletedAt`, generate `crypto.randomBytes(32).toString('hex')` token, insert `SharedLink`, return `201` with `ShareLinkResponseSchema`
- [x] 3.3 Implement `DELETE /share/:token` — find link, verify requester owns the linked note, set `revokedAt = new Date()`, return `204`
- [x] 3.4 Implement `GET /public/share/:token` (no auth middleware) — find link, check revocation, check expiry, check note `deletedAt`, atomically increment `viewCount` via Prisma `{ increment: 1 }`, return `200` with `PublicNoteResponseSchema`
- [x] 3.5 Register the sharing router in `apps/api/src/app.ts`; mount the public endpoint before auth middleware

## 4. Error Handling

- [x] 4.1 Return `403` with `{ error: "Link has expired" }` when `expiresAt` is in the past
- [x] 4.2 Return `403` with `{ error: "Link has been revoked" }` when `revokedAt` is non-null
- [x] 4.3 Return `403` with `{ error: "Note is no longer available" }` when the linked note's `deletedAt` is non-null
- [x] 4.4 Return `403` on owner-mismatch for `POST /notes/:id/share` and `DELETE /share/:token`
- [x] 4.5 Return `404` for non-existent note, non-existent token

## 5. Tests

- [x] 5.1 Write Supertest integration test: generate share link — success (no expiry), success (with expiry), 403 wrong owner, 404 deleted note
- [x] 5.2 Write Supertest integration test: revoke share link — success (204), 403 non-owner, 404 unknown token
- [x] 5.3 Write Supertest integration test: public access — 200 valid token (verify viewCount increments), 403 expired, 403 revoked, 403 deleted note, 404 unknown token
- [x] 5.4 Write concurrent view-count test to verify atomic increment (two simultaneous requests, final viewCount === 2)

## 6. Validation

- [x] 6.1 Run `pnpm build` — no TypeScript errors
- [x] 6.2 Run `pnpm lint --max-warnings 0` — no lint warnings
- [x] 6.3 Run `pnpm test` — all tests pass
