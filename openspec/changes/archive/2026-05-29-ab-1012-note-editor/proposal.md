## Why

The application has a working notes list page but no way to create or edit notes. Users need a rich text editing experience to actually author content, complete the core note-taking loop, and make the product usable end-to-end.

## What Changes

- Add `/notes/new` route — renders a blank editor for creating a note
- Add `/notes/:id` route — renders the editor pre-populated with an existing note
- Implement TipTap rich text editor with JSON content storage
- Implement debounced autosave (saves only on content change after inactivity)
- Implement manual save action
- Display save status indicator: Saving / Saved / Error
- Show loading skeleton while fetching note data
- Show error state on load failure or unauthorized access
- Support tag selection inline in the editor
- Wire create/update through `POST /notes` and `PATCH /notes/:id` (existing backend)
- Add shared Zod schemas and TypeScript types for editor form state in `packages/shared`

## Capabilities

### New Capabilities

- `note-editor-page`: Rich text editor page at `/notes/new` and `/notes/:id` with TipTap, autosave, manual save, save status display, tag selection, and full API integration via TanStack Query

### Modified Capabilities

- `notes-list-page`: Note cards now link to `/notes/:id` — this navigation target was previously unresolved; no spec-level requirement changes beyond the link being functional

## Impact

- **Frontend**: New `apps/frontend/src/pages/NoteEditorPage.tsx` and supporting components; new TanStack Query hooks for `GET /notes/:id`, `POST /notes`, `PATCH /notes/:id`
- **packages/shared**: New `noteEditorFormSchema` Zod schema and `NoteEditorFormValues` type
- **Dependencies**: `@tiptap/react`, `@tiptap/starter-kit` (already listed in stack; confirm installed)
- **Routing**: `apps/frontend/src/router.tsx` gains two new protected routes
- **No backend changes** — all required API endpoints exist (`POST /notes`, `GET /notes/:id`, `PATCH /notes/:id`)
