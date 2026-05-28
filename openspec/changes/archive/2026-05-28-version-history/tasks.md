## 1. Database Schema

- [x] 1.1 Add `NoteVersion` model to `prisma/schema.prisma` with fields: `id`, `noteId` (FK → Note), `title`, `content`, `createdAt`; add index on `(noteId, createdAt DESC)`
- [x] 1.2 Create and run Prisma migration for `note_versions` table

## 2. Shared Package — Schemas & Types

- [x] 2.1 Add `noteVersionSchema` (id, title, content, createdAt) to `packages/shared`
- [x] 2.2 Add `noteVersionListSchema` (paginated envelope: versions, total, page, limit) to `packages/shared`
- [x] 2.3 Add `noteVersionListQuerySchema` (page, limit with defaults) to `packages/shared`
- [x] 2.4 Export all new schemas from `packages/shared` index

## 3. Backend — Version Snapshot on Note Update

- [x] 3.1 Wrap `notesService.update` in a Prisma `$transaction` that updates the note row AND inserts a `note_versions` row capturing the pre-update title and content
- [x] 3.2 Write unit tests for `notesService.update` verifying snapshot creation and transaction rollback on snapshot failure

## 4. Backend — Versions Service

- [x] 4.1 Create `versionsService.listVersions(noteId, userId, page, limit)` — verifies note ownership, returns paginated versions ordered by `createdAt DESC`
- [x] 4.2 Create `versionsService.getVersion(noteId, versionId, userId)` — verifies note ownership, returns single version or throws 404
- [x] 4.3 Create `versionsService.restoreVersion(noteId, versionId, userId)` — verifies ownership, updates live note and inserts new snapshot in a single transaction, returns updated note
- [x] 4.4 Create `versionsService.purgeOldVersions(retentionDays)` — deletes `note_versions` rows older than retention window

## 5. Backend — Versions Router & Endpoints

- [x] 5.1 Create `versionsRouter` with `GET /notes/:id/versions` — validate query with `noteVersionListQuerySchema`, call `listVersions`, return paginated response
- [x] 5.2 Add `GET /notes/:id/versions/:versionId` to `versionsRouter` — call `getVersion`, return version or 404
- [x] 5.3 Add `POST /notes/:id/versions/:versionId/restore` to `versionsRouter` — call `restoreVersion`, return updated note
- [x] 5.4 Mount `versionsRouter` on the Express app (nested under `/notes`)

## 6. Backend — Auto-Purge Job

- [x] 6.1 Add `node-cron` (or equivalent) dependency to backend `package.json`
- [x] 6.2 Implement daily cron job that calls `versionsService.purgeOldVersions(VERSION_RETENTION_DAYS)` on server startup; read `VERSION_RETENTION_DAYS` env var with default 30

## 7. Backend — Integration Tests

- [x] 7.1 Write Supertest integration tests for `GET /notes/:id/versions` (success, empty, 401, 404 for other user)
- [x] 7.2 Write Supertest integration tests for `GET /notes/:id/versions/:versionId` (success, 404 version, 404 note ownership)
- [x] 7.3 Write Supertest integration tests for `POST /notes/:id/versions/:versionId/restore` (success, 404 cases, 401)
- [x] 7.4 Write unit tests for `versionsService.purgeOldVersions` verifying old rows deleted and recent rows retained

## 8. Build & Quality

- [x] 8.1 Run `pnpm build` and resolve any TypeScript errors
- [x] 8.2 Run `pnpm lint --max-warnings 0` and fix all lint issues
- [x] 8.3 Run `pnpm test` and confirm all tests pass
