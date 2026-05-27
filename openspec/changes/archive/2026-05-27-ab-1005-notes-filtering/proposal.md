## Why

The existing `GET /notes` endpoint returns a flat, unfiltered array of all active notes for a user. As note collections grow, clients have no way to paginate results, sort by relevance or recency, or narrow the list to specific tags — making the API impractical for any real-world usage.

## What Changes

- **BREAKING** `GET /notes` response format changes from `{ success: true, data: Note[] }` to a paginated envelope `{ success: true, data: { notes: Note[], total: number, page: number, limit: number } }`
- Add `page`, `limit` query params for pagination (defaults: page=1, limit=20, max limit=100)
- Add `sortBy` query param supporting `createdAt`, `updatedAt`, `title`; default `createdAt`
- Add `sortOrder` query param supporting `asc`, `desc`; default `desc`
- Add `tags` query param (comma-separated tag IDs) to filter notes that have ALL specified tags
- Add `includeDeleted` query param (boolean) to optionally include soft-deleted notes
- All query params validated with shared Zod schemas in `packages/shared`
- Invalid query params return HTTP 400 with descriptive error messages

## Capabilities

### New Capabilities
- `notes-filtering`: Pagination, sorting, and tag-based filtering for the notes list endpoint

### Modified Capabilities
- `notes-crud`: The `GET /notes` list requirement changes — response shape becomes a paginated envelope and the endpoint now accepts query parameters for pagination, sorting, and filtering

## Impact

- **Backend**: `apps/api` — notes router and controller updated; new query-building logic in notes service
- **Shared**: `packages/shared` — new `listNotesQuerySchema` and `notesListResponseSchema` added
- **API contract**: Breaking change to `GET /notes` response format; existing clients expecting a plain array must be updated
- **Database**: No schema changes; filtering uses existing `tags` relation and `deletedAt` column
