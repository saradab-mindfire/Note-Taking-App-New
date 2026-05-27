# notes-filtering Specification

## Purpose
TBD - created by syncing change ab-1005-notes-filtering. Update Purpose after archive.
## Requirements
### Requirement: Authenticated user can paginate the notes list
The system SHALL support `page` (positive integer, default 1) and `limit` (integer 1–100, default 20) query parameters on `GET /notes`. The response SHALL return only the notes for the requested page window. When `page` exceeds the available pages the `notes` array SHALL be empty.

#### Scenario: Default pagination applied when no params given
- **WHEN** an authenticated user sends `GET /notes` with no query params
- **THEN** the system SHALL return HTTP 200 with `{ success: true, data: { notes: [...], total: <n>, page: 1, limit: 20 } }`

#### Scenario: First page with custom limit
- **WHEN** an authenticated user sends `GET /notes?page=1&limit=5` and has 12 active notes
- **THEN** the system SHALL return HTTP 200 with `data.notes` containing 5 items and `data.total` equal to 12

#### Scenario: Second page retrieves correct window
- **WHEN** an authenticated user sends `GET /notes?page=2&limit=5` and has 12 active notes
- **THEN** the system SHALL return HTTP 200 with `data.notes` containing 5 items (notes 6–10) and `data.total` equal to 12

#### Scenario: Page beyond available data returns empty array
- **WHEN** an authenticated user sends `GET /notes?page=99&limit=20` and has fewer than 20 notes
- **THEN** the system SHALL return HTTP 200 with `data.notes` equal to `[]` and `data.total` reflecting the actual count

#### Scenario: Invalid page value returns 400
- **WHEN** an authenticated user sends `GET /notes?page=0`
- **THEN** the system SHALL return HTTP 400 with `{ success: false, error: <validation message> }`

#### Scenario: Invalid limit value returns 400
- **WHEN** an authenticated user sends `GET /notes?limit=200`
- **THEN** the system SHALL return HTTP 400 with `{ success: false, error: <validation message> }`

---

### Requirement: Authenticated user can sort the notes list
The system SHALL support a `sortBy` query parameter accepting `createdAt`, `updatedAt`, or `title` (default `createdAt`) and a `sortOrder` parameter accepting `asc` or `desc` (default `desc`) on `GET /notes`.

#### Scenario: Sort by title ascending
- **WHEN** an authenticated user sends `GET /notes?sortBy=title&sortOrder=asc`
- **THEN** the system SHALL return HTTP 200 with `data.notes` ordered alphabetically by title A→Z

#### Scenario: Sort by createdAt descending (default)
- **WHEN** an authenticated user sends `GET /notes` with no sort params
- **THEN** the system SHALL return HTTP 200 with `data.notes` ordered by `createdAt` descending (newest first)

#### Scenario: Sort by updatedAt ascending
- **WHEN** an authenticated user sends `GET /notes?sortBy=updatedAt&sortOrder=asc`
- **THEN** the system SHALL return HTTP 200 with `data.notes` ordered by `updatedAt` ascending (oldest-updated first)

#### Scenario: Invalid sortBy value returns 400
- **WHEN** an authenticated user sends `GET /notes?sortBy=unknown`
- **THEN** the system SHALL return HTTP 400 with `{ success: false, error: <validation message> }`

#### Scenario: Invalid sortOrder value returns 400
- **WHEN** an authenticated user sends `GET /notes?sortOrder=random`
- **THEN** the system SHALL return HTTP 400 with `{ success: false, error: <validation message> }`

---

### Requirement: Authenticated user can filter notes by tags
The system SHALL support a `tags` query parameter on `GET /notes` accepting a comma-separated list of tag IDs. Only notes that have **all** specified tags SHALL be included. If a tag ID does not exist or does not belong to the user, the result SHALL simply be an empty list (no error).

#### Scenario: Filter by a single tag
- **WHEN** an authenticated user sends `GET /notes?tags=<tagId>` and has 3 notes, 2 of which have that tag
- **THEN** the system SHALL return HTTP 200 with `data.notes` containing the 2 tagged notes and `data.total` equal to 2

#### Scenario: Filter by multiple tags (AND semantics)
- **WHEN** an authenticated user sends `GET /notes?tags=<tagA>,<tagB>` and only 1 note has both tags
- **THEN** the system SHALL return HTTP 200 with `data.notes` containing only the 1 note that has both tagA and tagB

#### Scenario: Filter by tag with no matching notes
- **WHEN** an authenticated user sends `GET /notes?tags=<tagId>` and no active notes have that tag
- **THEN** the system SHALL return HTTP 200 with `{ success: true, data: { notes: [], total: 0, page: 1, limit: 20 } }`

#### Scenario: Tag filter is combined with pagination
- **WHEN** an authenticated user sends `GET /notes?tags=<tagId>&page=1&limit=2` and 5 notes have that tag
- **THEN** the system SHALL return HTTP 200 with `data.notes` containing 2 items and `data.total` equal to 5

---

### Requirement: Authenticated user can include soft-deleted notes in the list
The system SHALL support an `includeDeleted` query parameter (boolean, default `false`) on `GET /notes`. When `includeDeleted=true` the response SHALL include both active and soft-deleted notes for the requesting user.

#### Scenario: includeDeleted defaults to false (soft-deleted notes excluded)
- **WHEN** an authenticated user sends `GET /notes` with no `includeDeleted` param and has 1 active and 1 soft-deleted note
- **THEN** the system SHALL return HTTP 200 with `data.notes` containing only the active note and `data.total` equal to 1

#### Scenario: includeDeleted=true returns all notes
- **WHEN** an authenticated user sends `GET /notes?includeDeleted=true` and has 1 active and 1 soft-deleted note
- **THEN** the system SHALL return HTTP 200 with `data.notes` containing both notes and `data.total` equal to 2

#### Scenario: includeDeleted does not expose another user's notes
- **WHEN** an authenticated user sends `GET /notes?includeDeleted=true`
- **THEN** the system SHALL return only notes belonging to that authenticated user, regardless of `includeDeleted`

---

### Requirement: Shared Zod schemas for notes list query and paginated response live in packages/shared
The `packages/shared` package SHALL export `listNotesQuerySchema` and `notesListResponseSchema`. `listNotesQuerySchema` SHALL validate and coerce all query params with their defaults and constraints. `notesListResponseSchema` SHALL describe the paginated envelope `{ notes: NoteListItem[], total: number, page: number, limit: number }`. These schemas SHALL be the single source of truth consumed by both backend and (future) frontend.

#### Scenario: listNotesQuerySchema applies defaults for missing params
- **WHEN** `listNotesQuerySchema.safeParse({})` is called
- **THEN** the result SHALL have `success: true` with `{ page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc', includeDeleted: false }`

#### Scenario: listNotesQuerySchema rejects page=0
- **WHEN** `listNotesQuerySchema.safeParse({ page: '0' })` is called
- **THEN** the result SHALL have `success: false` with an error on the `page` field

#### Scenario: listNotesQuerySchema rejects limit above 100
- **WHEN** `listNotesQuerySchema.safeParse({ limit: '101' })` is called
- **THEN** the result SHALL have `success: false` with an error on the `limit` field

#### Scenario: listNotesQuerySchema parses tags as array of strings
- **WHEN** `listNotesQuerySchema.safeParse({ tags: 'id1,id2' })` is called
- **THEN** the result SHALL have `success: true` with `tags` equal to `['id1', 'id2']`
