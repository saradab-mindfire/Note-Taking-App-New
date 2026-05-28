## 1. Shared Package — Schemas and Types

- [x] 1.1 Add `searchQuerySchema` to `packages/shared/src/schemas/` with `q` (non-empty string), `page` (positive int, default 1), `limit` (int 1–100, default 20)
- [x] 1.2 Add `searchResultItemSchema` to `packages/shared/src/schemas/` with `id`, `title`, `snippet`, `score`
- [x] 1.3 Export both schemas and their inferred TypeScript types from `packages/shared/src/index.ts`
- [x] 1.4 Run `pnpm build` in `packages/shared` and verify no type errors

## 2. Database Migration — tsvector Column and GIN Index

- [x] 2.1 Generate a new Prisma migration: `pnpm --filter backend prisma migrate dev --name add-notes-search-vector`
- [x] 2.2 Edit the generated SQL migration to add `search_vector tsvector` column to `notes`
- [x] 2.3 Add the trigger function that sets `search_vector = setweight(to_tsvector('english', coalesce(NEW.title,'')), 'A') || setweight(to_tsvector('english', coalesce(NEW.content,'')), 'B')`
- [x] 2.4 Attach `BEFORE INSERT OR UPDATE` trigger on `notes` calling the trigger function
- [x] 2.5 Add backfill `UPDATE notes SET search_vector = …` for existing rows
- [x] 2.6 Add `CREATE INDEX CONCURRENTLY notes_search_vector_gin ON notes USING GIN (search_vector)`
- [x] 2.7 Run `pnpm --filter backend prisma migrate dev` and confirm migration applies cleanly

## 3. Backend — Search Service

- [x] 3.1 Create `apps/api/src/services/searchService.ts` with a `searchNotes(userId, query, page, limit)` function
- [x] 3.2 Implement the `$queryRaw` SQL using `websearch_to_tsquery('english', $1)` with `@@` operator against `search_vector`
- [x] 3.3 Apply `WHERE "userId" = $userId AND "deletedAt" IS NULL` filters
- [x] 3.4 Add `ORDER BY ts_rank(search_vector, query) DESC`
- [x] 3.5 Add `ts_headline('english', content, query, 'MaxWords=50, MinWords=20, MaxFragments=2')` as `snippet`
- [x] 3.6 Add `COUNT(*) OVER()` window function for total count (avoids a second query)
- [x] 3.7 Map raw rows to `SearchResultItem` typed objects using the shared schema types

## 4. Backend — Search Route and Controller

- [x] 4.1 Create `apps/api/src/routes/searchRoutes.ts` with `GET /search` wired to the auth middleware
- [x] 4.2 Create `apps/api/src/controllers/searchController.ts` that parses and validates query params with `searchQuerySchema`
- [x] 4.3 Return 400 with validation errors when `searchQuerySchema` fails
- [x] 4.4 Call `searchNotes` from the controller and return the paginated envelope `{ success: true, data: { results, total, page, limit } }`
- [x] 4.5 Register `searchRoutes` in `apps/api/src/app.ts`

## 5. Tests

- [x] 5.1 Add unit tests for `searchQuerySchema` in `packages/shared`: empty `q` → invalid, valid defaults, invalid `page`/`limit`
- [x] 5.2 Add unit tests for `searchResultItemSchema` in `packages/shared`
- [x] 5.3 Add integration tests for `GET /search` covering: successful match, empty results, soft-deleted excluded, other user's notes excluded, 401 without auth, 400 on missing `q`, 400 on empty `q`, 400 on invalid `page`, 400 on invalid `limit`
- [x] 5.4 Add integration test verifying title-match ranks above content-only match

## 6. Verification

- [x] 6.1 Run `pnpm lint --max-warnings 0` and fix any lint errors
- [x] 6.2 Run `pnpm test` and confirm all tests pass
- [x] 6.3 Run `pnpm build` and confirm no TypeScript errors across the monorepo
