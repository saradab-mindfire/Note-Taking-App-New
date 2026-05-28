# note-versions Specification

## Purpose
TBD - created by archiving change version-history. Update Purpose after archive.
## Requirements
### Requirement: Authenticated user can list all versions of a note
The system SHALL allow an authenticated user to retrieve a paginated list of all versions for a note they own via `GET /notes/:id/versions`. The list SHALL be ordered by `createdAt DESC`. Each item SHALL include `id`, `title`, `content`, and `createdAt`. Versions of soft-deleted notes SHALL still be accessible. The endpoint SHALL accept optional `page` (positive integer, default 1) and `limit` (integer 1–100, default 20) query params. Invalid query params SHALL return HTTP 400.

#### Scenario: Successful list of versions
- **WHEN** an authenticated user sends `GET /notes/:id/versions` and the note has two saved versions
- **THEN** the system SHALL return HTTP 200 with `{ success: true, data: { versions: [v2, v1], total: 2, page: 1, limit: 20 } }` ordered newest-first

#### Scenario: Note with no versions
- **WHEN** an authenticated user sends `GET /notes/:id/versions` and no versions exist for the note
- **THEN** the system SHALL return HTTP 200 with `{ success: true, data: { versions: [], total: 0, page: 1, limit: 20 } }`

#### Scenario: Listing versions for another user's note
- **WHEN** an authenticated user sends `GET /notes/:id/versions` for a note owned by a different user
- **THEN** the system SHALL return HTTP 404 with `{ success: false, error: "Note not found" }`

#### Scenario: Note does not exist
- **WHEN** an authenticated user sends `GET /notes/:id/versions` with a non-existent note ID
- **THEN** the system SHALL return HTTP 404 with `{ success: false, error: "Note not found" }`

#### Scenario: Unauthenticated request
- **WHEN** a request is sent to `GET /notes/:id/versions` without a valid JWT
- **THEN** the system SHALL return HTTP 401

---

### Requirement: Authenticated user can view a specific historical version
The system SHALL allow an authenticated user to fetch a single version by ID via `GET /notes/:id/versions/:versionId`. The response SHALL include `id`, `title`, `content`, and `createdAt`. The version SHALL only be accessible if the parent note belongs to the requesting user.

#### Scenario: Successful version retrieval
- **WHEN** an authenticated user sends `GET /notes/:id/versions/:versionId` for a valid version of their note
- **THEN** the system SHALL return HTTP 200 with `{ success: true, data: { id, title, content, createdAt } }`

#### Scenario: Version not found
- **WHEN** an authenticated user sends `GET /notes/:id/versions/:versionId` with a non-existent versionId
- **THEN** the system SHALL return HTTP 404 with `{ success: false, error: "Version not found" }`

#### Scenario: Version belongs to another user's note
- **WHEN** an authenticated user sends `GET /notes/:id/versions/:versionId` for a note owned by a different user
- **THEN** the system SHALL return HTTP 404 with `{ success: false, error: "Note not found" }`

#### Scenario: Unauthenticated request
- **WHEN** a request is sent to `GET /notes/:id/versions/:versionId` without a valid JWT
- **THEN** the system SHALL return HTTP 401

---

### Requirement: Authenticated user can restore a historical version
The system SHALL allow an authenticated user to restore a previous version of their note via `POST /notes/:id/versions/:versionId/restore`. The restore operation SHALL copy the snapshot's `title` and `content` into the live note AND create a new snapshot capturing the restored state, both atomically in a single transaction. The response SHALL return the updated live note.

#### Scenario: Successful restore
- **WHEN** an authenticated user sends `POST /notes/:id/versions/:versionId/restore` for a valid version of their note
- **THEN** the system SHALL return HTTP 200 with `{ success: true, data: note }` where the live note reflects the restored title and content and a new snapshot exists in `note_versions`

#### Scenario: Restoring version of another user's note
- **WHEN** an authenticated user sends `POST /notes/:id/versions/:versionId/restore` for a note owned by a different user
- **THEN** the system SHALL return HTTP 404 with `{ success: false, error: "Note not found" }`

#### Scenario: Version not found during restore
- **WHEN** an authenticated user sends `POST /notes/:id/versions/:versionId/restore` with a non-existent versionId
- **THEN** the system SHALL return HTTP 404 with `{ success: false, error: "Version not found" }`

#### Scenario: Unauthenticated restore request
- **WHEN** a request is sent to `POST /notes/:id/versions/:versionId/restore` without a valid JWT
- **THEN** the system SHALL return HTTP 401

---

### Requirement: Versions are auto-purged after the retention period
The system SHALL automatically delete `note_versions` rows whose `createdAt` is older than the configured retention period. The retention period SHALL default to 30 days and SHALL be configurable via the `VERSION_RETENTION_DAYS` environment variable. The purge job SHALL run on a daily schedule. Purge SHALL apply regardless of the parent note's `deletedAt` state.

#### Scenario: Old versions are purged on schedule
- **WHEN** the daily purge job runs and a version's `createdAt` is older than `VERSION_RETENTION_DAYS`
- **THEN** that version row SHALL be deleted from `note_versions`

#### Scenario: Recent versions are not purged
- **WHEN** the daily purge job runs and a version's `createdAt` is within the retention window
- **THEN** that version row SHALL remain in `note_versions`

#### Scenario: Purge applies to versions of soft-deleted notes
- **WHEN** the daily purge job runs and a version belongs to a soft-deleted note whose `createdAt` exceeds the retention period
- **THEN** that version row SHALL be deleted from `note_versions`

---

### Requirement: Shared Zod schemas for note versions live in packages/shared
The `packages/shared` package SHALL export `noteVersionSchema`, `noteVersionListSchema`, and `noteVersionListQuerySchema`. `noteVersionSchema` SHALL include `id`, `title`, `content`, and `createdAt`. `noteVersionListSchema` SHALL wrap an array of `noteVersionSchema` in a paginated envelope (`versions`, `total`, `page`, `limit`). `noteVersionListQuerySchema` SHALL define and validate `page` and `limit` query params. These schemas SHALL be the single source of truth consumed by both backend and (future) frontend.

#### Scenario: noteVersionSchema rejects missing createdAt
- **WHEN** `noteVersionSchema.safeParse({ id: "1", title: "t", content: "c" })` is called
- **THEN** the result SHALL have `success: false` with an error on the `createdAt` field

#### Scenario: noteVersionListQuerySchema applies defaults
- **WHEN** `noteVersionListQuerySchema.safeParse({})` is called with no params
- **THEN** the result SHALL have `success: true` with `page: 1` and `limit: 20`
