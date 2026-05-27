## 1. Shared Package — Extend Note Schemas

- [x] 1.1 Add `tagIds: z.string().array().optional()` to `createNoteSchema` in `packages/shared/src/schemas/note.ts`
- [x] 1.2 Add `tagIds: z.string().array().optional()` to `updateNoteSchema` in `packages/shared/src/schemas/note.ts`
- [x] 1.3 Add `tags: z.array(tagResponseSchema)` field to `noteResponseSchema` in `packages/shared/src/schemas/note.ts` (import `tagResponseSchema` from `./tag.ts`)
- [x] 1.4 Export `NoteListItem` type (note without `content`) from `packages/shared/src/types/index.ts`
- [x] 1.5 Run `pnpm build` and verify shared package compiles without errors

## 2. Backend — Notes Service

- [x] 2.1 Create `apps/backend/src/services/notes.service.ts` with `NotesService` class
- [x] 2.2 Implement `createNote(userId, dto)` — creates note and upserts NoteTag rows atomically in a Prisma transaction
- [x] 2.3 Implement `getNoteById(userId, noteId)` — returns note with tags; throws 404 if not found, deleted, or unowned
- [x] 2.4 Implement `listNotes(userId)` — returns all non-deleted notes for user with tags (excludes `content` field)
- [x] 2.5 Implement `updateNote(userId, noteId, dto)` — PATCH semantics; replaces full tag set atomically if `tagIds` provided; throws 404 if not found/deleted/unowned
- [x] 2.6 Implement `deleteNote(userId, noteId)` — sets `deletedAt = now()`; throws 404 if not found or unowned
- [x] 2.7 Implement `restoreNote(userId, noteId)` — sets `deletedAt = null`; throws 404 if not soft-deleted or unowned; throws 410 if outside 30-day window; add `// TODO: schedule hard-delete job` comment
- [x] 2.8 Define `RESTORE_WINDOW_DAYS = 30` constant at top of service file

## 3. Backend — Notes Router & Controller

- [x] 3.1 Create `apps/backend/src/routes/notes.ts` with Express Router
- [x] 3.2 Implement `POST /` handler — validate with `createNoteSchema`, call `NotesService.createNote`, respond 201
- [x] 3.3 Implement `GET /` handler — call `NotesService.listNotes`, respond 200
- [x] 3.4 Implement `GET /:id` handler — call `NotesService.getNoteById`, respond 200
- [x] 3.5 Implement `PATCH /:id` handler — validate with `updateNoteSchema`, call `NotesService.updateNote`, respond 200
- [x] 3.6 Implement `DELETE /:id` handler — call `NotesService.deleteNote`, respond 204
- [x] 3.7 Implement `POST /:id/restore` handler — call `NotesService.restoreNote`, respond 200
- [x] 3.8 Apply `authenticate` middleware (existing JWT middleware) to all routes in the notes router

## 4. Backend — Wire Router into App

- [x] 4.1 Import and mount notes router in `apps/backend/src/app.ts` at path `/notes`

## 5. Backend — Error Handling

- [x] 5.1 Ensure service methods throw typed errors (e.g., `AppError` with status 404 / 410) that the global error handler maps to correct HTTP responses
- [x] 5.2 Verify the global error handler in `apps/backend/src/middleware/errorHandler.ts` handles 410 status code

## 6. Tests — Unit Tests (Vitest)

- [x] 6.1 Create `apps/backend/src/services/notes.service.test.ts`
- [x] 6.2 Test `createNote` — happy path, validation, tag association
- [x] 6.3 Test `getNoteById` — found, not found, unowned, soft-deleted
- [x] 6.4 Test `listNotes` — returns active notes only, excludes content
- [x] 6.5 Test `updateNote` — partial update, tag replacement, not found cases
- [x] 6.6 Test `deleteNote` — sets deletedAt, not found case
- [x] 6.7 Test `restoreNote` — within window, expired window, not soft-deleted, unowned

## 7. Tests — Integration Tests (Supertest)

- [x] 7.1 Create `apps/backend/src/routes/notes.test.ts`
- [x] 7.2 Test `POST /notes` — 201 success, 400 validation error, 401 unauthenticated
- [x] 7.3 Test `GET /notes/:id` — 200 success, 404 not found, 404 wrong user
- [x] 7.4 Test `GET /notes` — 200 with notes, 200 empty array, soft-deleted excluded
- [x] 7.5 Test `PATCH /notes/:id` — 200 partial update, 200 tag replacement, 404 not found
- [x] 7.6 Test `DELETE /notes/:id` — 204 success, 404 not found
- [x] 7.7 Test `POST /notes/:id/restore` — 200 success, 410 expired, 404 not found

## 8. Quality Gates

- [x] 8.1 Run `pnpm build` — no TypeScript errors
- [x] 8.2 Run `pnpm lint --max-warnings 0` — no lint warnings
- [x] 8.3 Run `pnpm test` — all tests pass
