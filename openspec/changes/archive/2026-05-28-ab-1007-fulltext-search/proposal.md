## Why

Users currently have no way to find notes without scrolling through the full list. Full-text search over titles and content is a core note-taking feature needed before the app is production-ready.

## What Changes

- New `GET /search` API endpoint accepting `q`, `page`, and `limit` query params
- PostgreSQL full-text search using `tsvector`, `tsquery`, `ts_rank`, and a GIN index on notes
- Highlighted content snippets in results using `ts_headline`
- Relevance-ranked, paginated result set scoped to the authenticated user
- Soft-deleted notes excluded by default
- Shared Zod validation schemas for search query and response in `packages/shared`

## Capabilities

### New Capabilities

- `notes-search`: Full-text search across note title and content for the authenticated user, with keyword highlighting, relevance ranking, and pagination

### Modified Capabilities

<!-- No existing spec-level requirements are changing -->

## Impact

- **Backend**: New route `GET /search` in `apps/api`; Prisma raw query or `$queryRaw` for full-text search; GIN index migration
- **Shared package**: New `SearchQuerySchema`, `SearchResultSchema`, and response types
- **Database**: New migration adding `tsvector` column and GIN index on `notes`
- **No breaking changes** to existing endpoints
