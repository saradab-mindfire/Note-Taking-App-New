## 1. Shared Schema

- [x] 1.1 Add `noteEditorFormSchema` Zod schema to `packages/shared` with `title` (string, 1–500 chars), `content` (string), and `tagIds` (optional string array)
- [x] 1.2 Export `NoteEditorFormValues` TypeScript type inferred from `noteEditorFormSchema`
- [x] 1.3 Write unit tests for `noteEditorFormSchema` (empty title rejects, valid input accepts)

## 2. TipTap Setup

- [x] 2.1 Confirm `@tiptap/react` and `@tiptap/starter-kit` are installed in `apps/frontend`; add them if missing
- [x] 2.2 Create `apps/frontend/src/components/editor/RichTextEditor.tsx` — a thin wrapper around `useEditor` + `EditorContent` with StarterKit extensions

## 3. TanStack Query Hooks

- [x] 3.1 Create `useNote(id: string)` query hook that calls `GET /notes/:id` and returns the note data, loading, and error states
- [x] 3.2 Create `useCreateNote()` mutation hook that calls `POST /notes`
- [x] 3.3 Create `useUpdateNote(id: string)` mutation hook that calls `PATCH /notes/:id`

## 4. useNoteEditor Hook

- [x] 4.1 Create `apps/frontend/src/hooks/useNoteEditor.ts`
- [x] 4.2 Implement dirty-state tracking — compare serialised JSON of `{ title, content, tagIds }` against last-saved snapshot
- [x] 4.3 Implement debounced autosave with 1 000 ms delay using a `useRef` timer; skip if note is clean
- [x] 4.4 Implement `save()` function — calls create or update mutation depending on mode; clears debounce timer
- [x] 4.5 Track save status: `'idle' | 'saving' | 'saved' | 'error'` and expose it from the hook
- [x] 4.6 On successful create (`POST /notes`), navigate to `/notes/:id` using the returned ID

## 5. Note Editor Page

- [x] 5.1 Create `apps/frontend/src/pages/NoteEditorPage.tsx`
- [x] 5.2 Detect mode from `useParams` — `id === undefined` means create mode, else edit mode
- [x] 5.3 Render loading skeleton while note fetch is in-flight (edit mode only)
- [x] 5.4 Render error state for 404, 401 (redirect to `/login`), and generic errors with retry
- [x] 5.5 Render title `<input>` bound to form state; show validation error when title is empty
- [x] 5.6 Render `RichTextEditor` bound to TipTap editor instance from `useNoteEditor`
- [x] 5.7 Render tag multi-select control using tags from `GET /tags`; bind selected tags to form state
- [x] 5.8 Render Save button — disabled during in-flight save; calls `save()` on click
- [x] 5.9 Render save status indicator showing "Saving" / "Saved" / "Error"

## 6. Routing

- [x] 6.1 Add protected route `/notes/new` → `NoteEditorPage` to `apps/frontend/src/router.tsx`
- [x] 6.2 Add protected route `/notes/:id` → `NoteEditorPage` to `apps/frontend/src/router.tsx`
- [x] 6.3 Verify note cards on the notes list page link to `/notes/:id` (should already be the case from AB-1011)

## 7. Build, Lint, Test

- [x] 7.1 Run `pnpm build` — resolve any TypeScript errors
- [x] 7.2 Run `pnpm lint --max-warnings 0` — fix all lint warnings
- [x] 7.3 Run `pnpm test` — ensure all existing tests pass and new unit tests for `noteEditorFormSchema` pass
