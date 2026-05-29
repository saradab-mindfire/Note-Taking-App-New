## Why

Authenticated users currently have no UI to browse or manage their notes — the backend API for listing, filtering, sorting, and paginating notes is fully implemented but unreachable from the frontend. This change delivers the notes list page at `/notes`, giving users their primary workspace.

## What Changes

- Add a `/notes` route (authenticated, protected) to the React frontend
- Implement `NotesListPage` component with paginated note card display
- Add `useNotesList` TanStack Query hook integrating with `GET /notes`
- Add `useNotesFilterStore` Zustand store for global filter/sort/pagination state
- Implement `NoteCard` component showing title, content preview, tags, and `updatedAt`
- Implement sorting controls (createdAt / updatedAt / title, asc / desc)
- Implement tag filter multi-select
- Implement include-deleted toggle
- Implement pagination controls
- Add empty state, loading skeleton, and error state UI
- Add shared TypeScript types for the notes list API response in `packages/shared` (if not already exported)

## Capabilities

### New Capabilities

- `notes-list-page`: Frontend page at `/notes` — authenticated view for browsing, filtering, sorting, and paginating the user's notes

### Modified Capabilities

- `notes-filtering`: Frontend now consumes the existing `listNotesQuerySchema` and `notesListResponseSchema` from `packages/shared`; no backend requirement changes

## Impact

- **Frontend**: New route, page component, query hook, Zustand store, and UI components added under `apps/frontend/src/`
- **packages/shared**: Consumes existing `listNotesQuerySchema` and `notesListResponseSchema`; no new schemas needed unless type exports are missing
- **Routing**: Protected route guard already exists (from auth implementation); `/notes` is added to the router
- **No backend changes required**
