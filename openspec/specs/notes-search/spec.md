# Notes Search Spec

## Requirements

### Requirement: Authenticated user can search their notes by keyword
The system SHALL provide a `GET /search` endpoint that performs full-text search across `title` and `content` of the authenticated user's active (non-soft-deleted) notes. The endpoint SHALL accept query parameters `q` (required, non-empty string), `page` (optional positive integer, default 1), and `limit` (optional integer 1–100, default 20). Results SHALL be ordered by relevance score descending. The response SHALL use the standard paginated envelope.

#### Scenario: Successful search returns matching notes
- **WHEN** an authenticated user sends `GET /search?q=graphql` and has two active notes containing "graphql"
- **THEN** the system SHALL return HTTP 200 with `{ success: true, data: { results: [{ id, title, snippet, score }, ...], total: 2, page: 1, limit: 20 } }`

#### Scenario: Search returns empty results for no matches
- **WHEN** an authenticated user sends `GET /search?q=nonexistentterm` and no notes match
- **THEN** the system SHALL return HTTP 200 with `{ success: true, data: { results: [], total: 0, page: 1, limit: 20 } }`

#### Scenario: Search without authentication
- **WHEN** a request is sent to `GET /search?q=test` without a valid JWT
- **THEN** the system SHALL return HTTP 401

---

### Requirement: Search results are relevance-ranked with title weighted higher than content
The system SHALL rank results using `ts_rank` with title tokens weighted at level A and content tokens weighted at level B, so notes whose title matches the query score higher than notes that only match in content.

#### Scenario: Title match ranks above content-only match
- **WHEN** an authenticated user has note A with "typescript" in the title and note B with "typescript" only in the content
- **THEN** `GET /search?q=typescript` SHALL return note A before note B

---

### Requirement: Search results include a highlighted content snippet
The system SHALL return a `snippet` field for each result containing a highlighted excerpt from `content` using `ts_headline`, with matched tokens wrapped in `<b>` tags. The snippet SHALL be at most 50 words across at most 2 fragments.

#### Scenario: Snippet contains highlighted keyword
- **WHEN** an authenticated user sends `GET /search?q=graphql` and a matching note contains "GraphQL is great"
- **THEN** the `snippet` field in the result SHALL contain `<b>graphql</b>` or `<b>GraphQL</b>` (case-insensitive match)

---

### Requirement: Search excludes soft-deleted notes
The system SHALL exclude notes where `deletedAt IS NOT NULL` from search results.

#### Scenario: Soft-deleted note not returned in search
- **WHEN** an authenticated user has a soft-deleted note matching the query and one active note matching the query
- **THEN** `GET /search?q=<term>` SHALL return only the active note

---

### Requirement: Search is scoped to the authenticated user's notes
The system SHALL only search notes owned by the requesting user. Notes owned by other users SHALL never appear in results.

#### Scenario: Other users' notes not returned
- **WHEN** user A sends `GET /search?q=secret` and user B owns a note containing "secret"
- **THEN** the response SHALL not include user B's note

---

### Requirement: Search query validation returns 400 on invalid input
The system SHALL validate all query parameters. An empty or missing `q` parameter SHALL return HTTP 400. Invalid `page` or `limit` values SHALL return HTTP 400.

#### Scenario: Missing q parameter
- **WHEN** an authenticated user sends `GET /search` with no `q` parameter
- **THEN** the system SHALL return HTTP 400 with `{ success: false, error: <validation message> }`

#### Scenario: Empty q parameter
- **WHEN** an authenticated user sends `GET /search?q=` (empty string)
- **THEN** the system SHALL return HTTP 400 with `{ success: false, error: <validation message> }`

#### Scenario: Invalid page parameter
- **WHEN** an authenticated user sends `GET /search?q=test&page=0`
- **THEN** the system SHALL return HTTP 400 with `{ success: false, error: <validation message> }`

#### Scenario: Invalid limit parameter
- **WHEN** an authenticated user sends `GET /search?q=test&limit=200`
- **THEN** the system SHALL return HTTP 400 with `{ success: false, error: <validation message> }`

---

### Requirement: Shared Zod schemas for search live in packages/shared
The `packages/shared` package SHALL export `searchQuerySchema` (validates `q`, `page`, `limit`) and `searchResultItemSchema` (validates `id`, `title`, `snippet`, `score`). These SHALL be the single source of truth consumed by the backend and future frontend.

#### Scenario: searchQuerySchema rejects empty q
- **WHEN** `searchQuerySchema.safeParse({ q: "" })` is called
- **THEN** the result SHALL have `success: false` with an error on the `q` field

#### Scenario: searchQuerySchema accepts valid input with defaults
- **WHEN** `searchQuerySchema.safeParse({ q: "notes" })` is called
- **THEN** the result SHALL have `success: true` with `page` defaulting to `1` and `limit` defaulting to `20`

#### Scenario: searchResultItemSchema validates a result object
- **WHEN** `searchResultItemSchema.safeParse({ id: "abc", title: "My Note", snippet: "...highlighted...", score: 0.75 })` is called
- **THEN** the result SHALL have `success: true`
