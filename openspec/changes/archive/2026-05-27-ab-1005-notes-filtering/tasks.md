## 1. Shared Package — Schemas and Types

- [x] 1.1 Add `listNotesQuerySchema` to `packages/shared/src/schemas/note.ts` with `page`, `limit`, `sortBy`, `sortOrder`, `tags`, and `includeDeleted` params, including coercion and defaults
- [x] 1.2 Add `notesListResponseSchema` to `packages/shared/src/schemas/note.ts` for the paginated envelope `{ notes, total, page, limit }`
- [x] 1.3 Export `listNotesQuerySchema`, `notesListResponseSchema`, and inferred types (`ListNotesQuery`, `NotesListResponse`) from `packages/shared/src/index.ts`
- [x] 1.4 Run `pnpm build` in `packages/shared` to verify no type errors

## 2. Backend — Query Validation Middleware

- [x] 2.1 Create `apps/backend/src/middleware/validate-query.ts` that validates `req.query` against a given Zod schema and returns 400 on failure (mirrors `validate-body.ts`)
- [x] 2.2 Write unit tests for `validate-query` middleware in `apps/backend/src/middleware/validate-query.test.ts`

## 3. Backend — Notes Service

- [x] 3.1 Update `NotesService.listNotes()` signature to accept `query: ListNotesQuery` as a second argument
- [x] 3.2 Implement tag filtering logic using Prisma AND semantics (`AND: tagIds.map(tagId => ({ tags: { some: { tagId } } }))`)
- [x] 3.3 Implement `includeDeleted` logic — omit `deletedAt: null` filter when `includeDeleted=true`
- [x] 3.4 Implement `sortBy` / `sortOrder` — map `ListNotesQuery` fields to Prisma `orderBy`
- [x] 3.5 Implement pagination using Prisma `skip = (page-1)*limit` and `take = limit`
- [x] 3.6 Return `{ notes, total, page, limit }` using `prisma.$transaction([findMany, count])` for a single round-trip
- [x] 3.7 Update service unit tests in `notes.service.test.ts` to cover pagination, sorting, tag filtering, and `includeDeleted` scenarios

## 4. Backend — Notes Router

- [x] 4.1 Import and apply `validateQuery(listNotesQuerySchema)` middleware on the `GET /` route in `notes.router.ts`
- [x] 4.2 Pass parsed query from `res.locals.query` (or typed `req.query`) to `notesService.listNotes()`
- [x] 4.3 Update `GET /` response to return `{ success: true, data: { notes, total, page, limit } }`
- [x] 4.4 Update router integration tests in `notes.router.test.ts` to cover all new query param scenarios (pagination, sorting, tag filter, includeDeleted, invalid params)

## 5. Verification

- [x] 5.1 Run `pnpm build` — zero errors across all packages
- [x] 5.2 Run `pnpm lint --max-warnings 0` — zero warnings
- [x] 5.3 Run `pnpm test` — all tests pass
