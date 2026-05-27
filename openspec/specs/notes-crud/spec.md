# notes-crud Specification

## Purpose
TBD - created by archiving change ab-1004-notes-crud. Update Purpose after archive.
## Requirements
### Requirement: Authenticated user can create a note
The system SHALL allow an authenticated user to create a note by sending `title` (required, 1–500 chars) and `content` (optional string, defaults to empty) with an optional array of `tagIds`. The note SHALL be owned by the requesting user. The response SHALL return the created note including its associated tags inside `{ success: true, data: note }`.

#### Scenario: Successful note creation without tags
- **WHEN** an authenticated user sends `POST /notes` with `{ "title": "My Note", "content": "Hello" }`
- **THEN** the system SHALL return HTTP 201 with `{ success: true, data: { id, userId, title, content, tags: [], deletedAt: null, createdAt, updatedAt } }`

#### Scenario: Successful note creation with tags
- **WHEN** an authenticated user sends `POST /notes` with `{ "title": "My Note", "content": "Hello", "tagIds": ["<valid-tag-id>"] }`
- **THEN** the system SHALL return HTTP 201 with the note and `tags` array containing the associated tag objects

#### Scenario: Note creation with missing title
- **WHEN** an authenticated user sends `POST /notes` with no `title` field
- **THEN** the system SHALL return HTTP 400 with `{ success: false, error: "Title is required" }`

#### Scenario: Note creation without authentication
- **WHEN** a request is sent to `POST /notes` without a valid JWT
- **THEN** the system SHALL return HTTP 401

---

### Requirement: Authenticated user can retrieve a single note by ID
The system SHALL allow an authenticated user to fetch a note by its ID. The note SHALL be returned only if it belongs to the requesting user and has not been soft-deleted. The response SHALL include associated tags.

#### Scenario: Successful fetch of own note
- **WHEN** an authenticated user sends `GET /notes/:id` where the note exists, belongs to that user, and is not soft-deleted
- **THEN** the system SHALL return HTTP 200 with `{ success: true, data: note }` including the `tags` array

#### Scenario: Note not found
- **WHEN** an authenticated user sends `GET /notes/:id` with a non-existent note ID
- **THEN** the system SHALL return HTTP 404 with `{ success: false, error: "Note not found" }`

#### Scenario: Access to another user's note
- **WHEN** an authenticated user sends `GET /notes/:id` for a note owned by a different user
- **THEN** the system SHALL return HTTP 404 with `{ success: false, error: "Note not found" }`

#### Scenario: Access to soft-deleted note
- **WHEN** an authenticated user sends `GET /notes/:id` for a note with a non-null `deletedAt`
- **THEN** the system SHALL return HTTP 404 with `{ success: false, error: "Note not found" }`

---

### Requirement: Authenticated user can list all their active notes
The system SHALL allow an authenticated user to retrieve their notes via `GET /notes` with optional query parameters for pagination, sorting, tag filtering, and deleted-note inclusion. The response SHALL use a paginated envelope. Soft-deleted notes (where `deletedAt IS NOT NULL`) SHALL be excluded by default unless `includeDeleted=true` is passed. Each note in the list SHALL include its associated tags but SHALL NOT include the `content` field to keep response payloads small. The endpoint SHALL accept and validate the following query params (all optional): `page` (positive integer, default 1), `limit` (integer 1–100, default 20), `sortBy` (`createdAt` | `updatedAt` | `title`, default `createdAt`), `sortOrder` (`asc` | `desc`, default `desc`), `tags` (comma-separated tag IDs), `includeDeleted` (boolean, default `false`). Invalid query params SHALL return HTTP 400.

#### Scenario: List notes returns paginated envelope
- **WHEN** an authenticated user sends `GET /notes` and has two active notes
- **THEN** the system SHALL return HTTP 200 with `{ success: true, data: { notes: [note1, note2], total: 2, page: 1, limit: 20 } }` where each item omits `content`

#### Scenario: List notes for user with no notes
- **WHEN** an authenticated user sends `GET /notes` and has no active notes
- **THEN** the system SHALL return HTTP 200 with `{ success: true, data: { notes: [], total: 0, page: 1, limit: 20 } }`

#### Scenario: Soft-deleted notes excluded from list by default
- **WHEN** an authenticated user has one active note and one soft-deleted note
- **THEN** `GET /notes` SHALL return `{ data: { notes: [activeNote], total: 1, page: 1, limit: 20 } }`

#### Scenario: Unauthorized access returns 401
- **WHEN** a request is sent to `GET /notes` without a valid JWT
- **THEN** the system SHALL return HTTP 401

---

### Requirement: Authenticated user can update their note
The system SHALL allow an authenticated user to update the `title`, `content`, and/or `tagIds` of a note they own. All fields are optional (PATCH semantics). When `tagIds` is provided the full tag association set SHALL be replaced atomically. The response SHALL return the updated note with current tags.

#### Scenario: Successful partial update (title only)
- **WHEN** an authenticated user sends `PATCH /notes/:id` with `{ "title": "New Title" }`
- **THEN** the system SHALL return HTTP 200 with the note reflecting the new title and unchanged content and tags

#### Scenario: Successful tag replacement
- **WHEN** an authenticated user sends `PATCH /notes/:id` with `{ "tagIds": ["<tag-b-id>"] }` and the note previously had tag A
- **THEN** the system SHALL return HTTP 200 with `tags` containing only tag B

#### Scenario: Update of non-existent or unowned note
- **WHEN** an authenticated user sends `PATCH /notes/:id` for a note that does not exist or belongs to another user
- **THEN** the system SHALL return HTTP 404 with `{ success: false, error: "Note not found" }`

#### Scenario: Update of soft-deleted note
- **WHEN** an authenticated user sends `PATCH /notes/:id` for a soft-deleted note
- **THEN** the system SHALL return HTTP 404 with `{ success: false, error: "Note not found" }`

---

### Requirement: Authenticated user can soft-delete their note
The system SHALL allow an authenticated user to soft-delete a note by setting `deletedAt` to the current UTC timestamp. The note SHALL remain in the database. A subsequent `GET /notes/:id` or `GET /notes` SHALL no longer return the note. The response SHALL be HTTP 204 No Content.

#### Scenario: Successful soft delete
- **WHEN** an authenticated user sends `DELETE /notes/:id` for an active note they own
- **THEN** the system SHALL return HTTP 204 and the note's `deletedAt` field SHALL be set to the current timestamp in the database

#### Scenario: Delete of non-existent or unowned note
- **WHEN** an authenticated user sends `DELETE /notes/:id` for a note that does not exist or belongs to another user
- **THEN** the system SHALL return HTTP 404 with `{ success: false, error: "Note not found" }`

---

### Requirement: Authenticated user can restore a soft-deleted note within the recovery window
The system SHALL allow an authenticated user to restore a soft-deleted note by sending `POST /notes/:id/restore`, provided the note's `deletedAt` is within 30 days of the current time. Restoring SHALL set `deletedAt` back to `null`. After restoration the note SHALL appear in normal listing and fetch operations. If the recovery window has expired the system SHALL return an error.

#### Scenario: Successful restore within window
- **WHEN** an authenticated user sends `POST /notes/:id/restore` for a note deleted less than 30 days ago
- **THEN** the system SHALL return HTTP 200 with `{ success: true, data: note }` where `deletedAt` is `null`

#### Scenario: Restore of non-deleted note
- **WHEN** an authenticated user sends `POST /notes/:id/restore` for a note that is not soft-deleted
- **THEN** the system SHALL return HTTP 404 with `{ success: false, error: "Note not found" }`

#### Scenario: Restore after recovery window expired
- **WHEN** an authenticated user sends `POST /notes/:id/restore` for a note whose `deletedAt` is more than 30 days ago
- **THEN** the system SHALL return HTTP 410 with `{ success: false, error: "Recovery window expired" }`

#### Scenario: Restore of unowned note
- **WHEN** an authenticated user sends `POST /notes/:id/restore` for a note owned by a different user
- **THEN** the system SHALL return HTTP 404 with `{ success: false, error: "Note not found" }`

---

### Requirement: Shared Zod schemas for notes live in packages/shared
The `packages/shared` package SHALL export `createNoteSchema`, `updateNoteSchema`, and `noteResponseSchema`. `createNoteSchema` and `updateNoteSchema` SHALL include an optional `tagIds: z.string().array()` field. `noteResponseSchema` SHALL include a `tags` array of tag response objects. These schemas SHALL be the single source of truth consumed by both backend and (future) frontend.

#### Scenario: createNoteSchema rejects missing title
- **WHEN** `createNoteSchema.safeParse({ content: "hello" })` is called
- **THEN** the result SHALL have `success: false` with an error on the `title` field

#### Scenario: noteResponseSchema includes tags field
- **WHEN** `noteResponseSchema` is parsed with a valid note object containing a `tags` array
- **THEN** the result SHALL have `success: true`

