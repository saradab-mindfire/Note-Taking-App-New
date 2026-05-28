## Context

The notes table has `title` (varchar) and `content` (text) columns. Users need to locate notes by keyword without scrolling the full list. PostgreSQL 16 is available and provides mature full-text search primitives (`tsvector`, `tsquery`, `ts_rank`, `ts_headline`, GIN indexes). Prisma ORM is the only allowed data layer, but it supports `$queryRaw` for cases where the query planner needs native SQL.

## Goals / Non-Goals

**Goals:**
- Keyword search across `title` and `content` of the authenticated user's active notes
- Relevance-ranked results via `ts_rank`
- Highlighted content snippets via `ts_headline`
- Paginated response matching the existing envelope (`total`, `page`, `limit`)
- Shared Zod schemas and TypeScript types in `packages/shared`
- GIN index for sub-100 ms query time on typical datasets

**Non-Goals:**
- Fuzzy / typo-tolerant search (trigram or `pg_trgm`)
- Semantic / vector search
- Autocomplete / search suggestions
- Searching across other users' notes or shared links
- Frontend UI (out of scope for this ticket)

## Decisions

### 1. Stored `tsvector` column vs. computed on the fly

**Decision**: Add a generated `tsvector` column (`search_vector`) maintained by a `BEFORE INSERT OR UPDATE` trigger.

**Rationale**: Computing `to_tsvector` inline in every query re-parses the document on each call and cannot use a GIN index. A stored column keeps the index tight and the query fast. The trigger keeps it automatically in sync with `title`/`content` edits.

**Alternative considered**: `CREATE INDEX … ON notes USING GIN (to_tsvector('english', title || ' ' || content))` – a functional GIN index. Works without a trigger but the index expression must be repeated exactly in every query, creating coupling. The stored-column approach is cleaner and easier to extend (e.g. adding tag names later).

**Why title weighted higher**: `setweight(to_tsvector('english', title), 'A') || setweight(to_tsvector('english', content), 'B')` assigns label A to title tokens. `ts_rank` uses label weights so title matches score higher than body matches. This matches user expectation (a note titled "GraphQL" is more relevant than one that merely mentions it in passing).

### 2. Prisma `$queryRaw` vs. Prisma client fluent API

**Decision**: Use `$queryRaw` with parameterized queries for the search query.

**Rationale**: Prisma's fluent API has no native support for `ts_rank`, `ts_headline`, or `@@ tsquery` operator. `$queryRaw` with tagged-template literals provides full SQL power while keeping parameterization (no injection risk). All other operations (tag listing, CRUD) remain on the fluent API.

### 3. Query parsing: `plainto_tsquery` vs. `to_tsquery` vs. `websearch_to_tsquery`

**Decision**: Use `websearch_to_tsquery('english', $1)`.

**Rationale**: `to_tsquery` requires lexeme syntax (`foo & bar`) and throws on raw user input. `plainto_tsquery` treats every token as AND-joined, which is fine but discards quoted phrases. `websearch_to_tsquery` (Postgres 11+) supports Google-style syntax (`"exact phrase"`, `-exclude`, `OR`) without query injection risk — best UX for zero configuration.

### 4. Highlighting approach

**Decision**: Return a single `snippet` field using `ts_headline(content, query, 'MaxWords=50, MinWords=20, MaxFragments=2')`.

**Rationale**: `ts_headline` marks matched tokens with `<b>…</b>` HTML tags by default. The frontend can strip or render them. Limiting to 50 words keeps response size bounded. Two fragments cover discontinuous matches well.

### 5. Migration strategy

**Decision**: Single migration adds the `search_vector` column, trigger function, trigger, and GIN index.

**Rationale**: Keeping all related DDL in one migration makes rollback atomic. The migration will be slow on large datasets (backfill + index build) but is acceptable for a development-phase schema change. Index is created `CONCURRENTLY` to avoid locking.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| `$queryRaw` bypasses Prisma type safety | Map raw rows to typed objects in a service layer; add unit tests that catch column renames |
| GIN index build time on large tables | Create index `CONCURRENTLY`; document expected duration in migration comments |
| `ts_headline` on very large `content` is slow | Cap `content` length in headline options; add a response-time test |
| `websearch_to_tsquery` returns empty on stop-word-only queries | Return empty results gracefully (no 500); validated by spec scenario |
| Language is hard-coded to `'english'` | Acceptable for v1; locale-aware search deferred to a future ticket |

## Migration Plan

1. Generate migration: `prisma migrate dev --name add-notes-search-vector`
2. Migration SQL:
   - Add `search_vector tsvector` column (nullable initially)
   - Create trigger function that sets `search_vector = setweight(to_tsvector('english', coalesce(NEW.title,'')), 'A') || setweight(to_tsvector('english', coalesce(NEW.content,'')), 'B')`
   - Attach `BEFORE INSERT OR UPDATE` trigger
   - Backfill: `UPDATE notes SET search_vector = setweight(to_tsvector('english', coalesce(title,'')), 'A') || setweight(to_tsvector('english', coalesce(content,'')), 'B')`
   - `CREATE INDEX CONCURRENTLY notes_search_vector_gin ON notes USING GIN (search_vector)`
3. Rollback: `DROP TRIGGER`, `DROP FUNCTION`, `DROP INDEX`, `ALTER TABLE notes DROP COLUMN search_vector`

## Open Questions

- None — all decisions above are resolved for this scope.
