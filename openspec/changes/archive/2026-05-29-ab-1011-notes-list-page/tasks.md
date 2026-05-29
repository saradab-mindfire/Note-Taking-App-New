## 1. State Layer

- [x] 1.1 Create `apps/frontend/src/store/notesFilterStore.ts` with Zustand store holding `page`, `limit`, `sortBy`, `sortOrder`, `tags`, `includeDeleted` and a `setFilter` action that resets `page` to 1 when any non-page filter changes
- [x] 1.2 Add `resetFilters` action to `notesFilterStore` and call it from `authStore.logout()` to clear stale filter state on logout

## 2. Data Hooks

- [x] 2.1 Create `apps/frontend/src/hooks/useNotesList.ts` — TanStack Query `useQuery` hook that reads from `notesFilterStore`, calls `GET /notes` via `apiRequest`, and returns `{ notes, total, page, limit, isLoading, isError, error }`
- [x] 2.2 Create `apps/frontend/src/hooks/useTagsList.ts` — TanStack Query `useQuery` hook that calls `GET /tags` via `apiRequest` and returns the tags array for use in the filter bar

## 3. UI Components

- [x] 3.1 Create `apps/frontend/src/components/notes/NoteCard.tsx` — displays note title, tags (as badges), and formatted `updatedAt`; wraps in a link to `/notes/:id`
- [x] 3.2 Create `apps/frontend/src/components/notes/NotesList.tsx` — renders a grid of `NoteCard` components; shows loading skeleton while `isLoading`, error message with retry when `isError`, and empty state message when `notes` is empty
- [x] 3.3 Create `apps/frontend/src/components/notes/NotesFilterBar.tsx` — sortBy select, sortOrder toggle, tag multi-select (populated by `useTagsList`, disabled on error), and includeDeleted toggle; each change calls `notesFilterStore.setFilter`
- [x] 3.4 Create `apps/frontend/src/components/notes/NotesPagination.tsx` — previous/next page buttons derived from `total` and `limit`; disables previous on `page === 1`, disables next on last page; calls `notesFilterStore.setFilter({ page: ... })`

## 4. Page and Routing

- [x] 4.1 Create `apps/frontend/src/pages/NotesListPage.tsx` — composes `NotesFilterBar`, `NotesList`, and `NotesPagination` inside a responsive layout shell
- [x] 4.2 Update `apps/frontend/src/App.tsx` — add `/notes` route inside `ProtectedRoute` pointing to `NotesListPage`; change the `/` protected route to `<Navigate to="/notes" replace />`

## 5. Verification

- [x] 5.1 Run `pnpm build` and fix any TypeScript errors
- [x] 5.2 Run `pnpm lint --max-warnings 0` and fix any lint violations
- [x] 5.3 Run `pnpm test` and confirm no regressions
