## Context

The monorepo already has: JWT auth (login, register, refresh, logout, password reset), the full Prisma schema (Note, Tag, NoteTag, SharedLink, NoteVersion, User, RefreshToken), and the initial database migration. Shared Zod schemas for notes (`createNoteSchema`, `updateNoteSchema`, `noteResponseSchema`) and TypeScript types already exist in `packages/shared` but do not yet include tag association. The backend has no `/notes` route yet.

## Goals / Non-Goals

**Goals:**
- Implement six REST endpoints for note lifecycle: POST, GET /:id, GET /, PATCH /:id, DELETE /:id, POST /:id/restore
- Enforce ownership — users only touch their own notes
- Soft delete via `deletedAt`; restore within a configurable recovery window (default 30 days)
- Extend shared schemas to support optional tag IDs on create/update and include tags in response
- Standard JSON envelope `{ success: true, data: ... }` / `{ success: false, error: ... }` on all endpoints

**Non-Goals:**
- Pagination, sorting, filtering
- Full-text search
- Sharing / shared links
- Version history
- Frontend integration (this change is backend + shared only)

## Decisions

### D1 — Tag association on note create/update (not a separate endpoint)

**Decision**: Accept optional `tagIds: string[]` in `createNoteSchema` and `updateNoteSchema`. On create, upsert NoteTag rows in the same transaction. On update, replace the full set of associated tags transactionally.

**Alternative considered**: Separate `/notes/:id/tags` endpoint (add/remove). Rejected because: (a) it requires more round-trips for the common case, (b) it introduces partial-update race conditions, (c) the frontend will always send the full desired tag set with each save.

**Rationale**: Transactional full-replace is simpler to reason about and aligns with TipTap's autosave pattern where the entire note state is sent at once.

---

### D2 — Restore recovery window

**Decision**: Restore is only permitted if `deletedAt` is within 30 days. After that window the note remains soft-deleted but `POST /notes/:id/restore` returns `410 Gone`.

**Alternative considered**: No window — restore always allowed. Rejected because it leaves soft-deleted rows in the DB indefinitely and complicates a future hard-delete background job.

**Rationale**: 30 days is a common SaaS standard; the window value will be a named constant `RESTORE_WINDOW_DAYS = 30` so it can be changed without a code hunt.

---

### D3 — Response shape includes tags inline

**Decision**: Note response always includes `tags: TagResponse[]` (full tag objects). `noteResponseSchema` is extended with `tags` array.

**Alternative considered**: Return only `tagIds`. Rejected because the frontend (TipTap editor sidebar) needs tag names and colors to render chips — returning IDs would force a second request.

**Rationale**: The tags relation is eager-loaded in every Prisma query via `include: { tags: { include: { tag: true } } }`, so there is no extra round-trip.

---

### D4 — Service layer owns all Prisma queries

**Decision**: `NotesService` class in `apps/backend/src/services/notes.service.ts` wraps all database access. Routes are thin (validate → call service → respond).

**Rationale**: Consistent with the pattern established in AuthService. Makes unit-testing the business logic (ownership check, soft-delete, restore window) straightforward without spinning up HTTP.

---

### D5 — Ownership enforced at service level, not middleware

**Decision**: Every service method receives `userId` from `req.user` (set by the existing JWT middleware) and includes `userId` in the Prisma `where` clause. No separate ownership middleware.

**Rationale**: Simple and explicit. Middleware-based ownership (e.g., loading the note in middleware and attaching it to `req`) adds indirection without benefit at this scale.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| `noteResponseSchema` changes break consumers that imported the old shape | The only current consumer is tests (no frontend yet). Update schema + types atomically; run `pnpm build` to catch type errors before commit. |
| Full tag-set replace on PATCH sends unnecessary DB writes when tags haven't changed | Acceptable at this scale. Optimize later with set-diff if profiling shows it matters. |
| Soft-deleted notes accumulate forever | Out of scope for this ticket. A future background job will hard-delete rows older than `RESTORE_WINDOW_DAYS`. A comment is placed in the service as `// TODO: schedule hard-delete job`. |
| Large `content` strings cause slow list queries | GET /notes returns title + metadata only (no content field in list response). Content is only returned by GET /notes/:id. |

## Migration Plan

1. Schema already exists and initial migration (`20260527163055_init`) has been applied — no new migration needed.
2. Extend `packages/shared` schemas (additive, backward-compatible change).
3. Add route/controller/service files to `apps/backend`.
4. Wire router into `apps/backend/src/app.ts`.
5. Run `pnpm build && pnpm lint --max-warnings 0 && pnpm test`.
6. All steps are in one PR; no staged rollout needed.
