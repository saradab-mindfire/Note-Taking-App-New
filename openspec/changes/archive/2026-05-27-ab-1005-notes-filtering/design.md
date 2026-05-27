## Context

The current `GET /notes` endpoint returns a flat `NoteListItem[]` with no pagination, sorting, or filtering. The `NotesService.listNotes()` uses a hardcoded `orderBy: { updatedAt: 'desc' }` with no query parameters. As note collections grow, the lack of these capabilities makes the API impractical. All existing notes routes live under `apps/backend/src/features/notes/` and are gated behind `authMiddleware`.

## Goals / Non-Goals

**Goals:**
- Add `page`, `limit`, `sortBy`, `sortOrder`, `tags`, and `includeDeleted` query params to `GET /notes`
- Change response envelope to `{ success: true, data: { notes, total, page, limit } }`
- Define shared Zod schema `listNotesQuerySchema` in `packages/shared`
- Define shared `notesListResponseSchema` for the paginated envelope in `packages/shared`
- Validate and coerce query params at the router layer before they reach the service
- Return meaningful 400 errors for invalid query params

**Non-Goals:**
- Full-text search across note content or title
- Cursor-based pagination
- Frontend implementation
- Changing any other notes endpoints (`POST`, `PATCH`, `DELETE`, `GET /:id`)

## Decisions

### Decision 1: Tag filtering semantics — AND vs OR

**Chosen**: AND semantics — a note must have **all** specified tags to be included.

**Rationale**: AND filtering narrows the result set predictably (e.g., "show me notes tagged both 'work' AND 'urgent'"). OR semantics would broaden results unexpectedly. If the user specifies a single tag, AND and OR are equivalent. Future OR support can be added as a separate query param.

**Prisma implementation**:
```ts
AND: tagIds.map((tagId) => ({
  tags: { some: { tagId } },
}))
```

**Alternative considered**: `tags: { some: { tagId: { in: tagIds } } }` — but this is OR semantics and was rejected.

---

### Decision 2: Tags query param encoding — comma-separated string

**Chosen**: Comma-separated string: `GET /notes?tags=id1,id2,id3`

**Rationale**: Simple to parse in Zod (`.transform(s => s.split(','))`), produces clean URLs, and is widely used in REST APIs. Easy to include in shared schema.

**Alternative considered**: Repeated params (`?tags=id1&tags=id2`) — Express supports this but Zod query coercion is less straightforward and inconsistent across clients.

---

### Decision 3: Query param coercion in shared schema

**Chosen**: Use `z.coerce.number()` for `page` and `limit` (HTTP query strings are always strings), `z.enum()` for `sortBy`/`sortOrder`, and `z.string().optional()` for `tags`.

**Schema location**: `packages/shared/src/schemas/note.ts` — exports `listNotesQuerySchema` and `notesListResponseSchema`.

**Backend**: New `validateQuery` middleware (mirrors existing `validateBody`) validates `req.query` against `listNotesQuerySchema` before the route handler runs.

---

### Decision 4: New `validateQuery` middleware vs inline validation

**Chosen**: New `validateQuery` middleware in `apps/backend/src/middleware/`.

**Rationale**: Consistent with the existing `validateBody` middleware pattern. Keeps route handlers clean. The middleware parses `req.query` and attaches the typed result to `res.locals.query` (or replaces `req.query` with parsed data).

**Alternative considered**: Inline `listNotesQuerySchema.safeParse(req.query)` in the route handler — simpler but not reusable and inconsistent with existing patterns.

---

### Decision 5: Service method signature

The existing `listNotes(userId: string)` is replaced by:
```ts
listNotes(userId: string, query: ListNotesQuery): Promise<NotesListResponse>
```
where `ListNotesQuery` is inferred from `listNotesQuerySchema` and `NotesListResponse` from `notesListResponseSchema`.

The service computes `skip = (page - 1) * limit` and uses Prisma's `skip`/`take`, a `where` clause for tag filtering and `includeDeleted`, and `count` via `prisma.$transaction([findMany, count])` for efficiency.

---

### Decision 6: `total` count strategy — single transaction

**Chosen**: Use `prisma.$transaction([prisma.note.findMany(...), prisma.note.count(...)])` to fetch notes and total count in a single round trip.

**Rationale**: Avoids two sequential DB calls; Prisma's interactive transaction would add overhead for a read-only operation.

## Risks / Trade-offs

- **BREAKING response change** → Any client that destructures `data` as an array will break. Acceptable because there is no frontend consumer yet.
- **AND tag filtering** may be overly strict with many tags → Mitigated by clear documentation in the spec; OR can be added later as `tagsAny` param.
- **`includeDeleted` param** exposes soft-deleted notes → Only available to authenticated users (authMiddleware applied to all notes routes). No data leakage risk.
- **`title` sort in PostgreSQL** is locale-sensitive by default → Acceptable for this stage; locale-aware collation can be added in a follow-up.
