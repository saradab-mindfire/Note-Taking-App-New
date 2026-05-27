## MODIFIED Requirements

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
