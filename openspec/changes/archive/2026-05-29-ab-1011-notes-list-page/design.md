## Context

The backend `GET /notes` endpoint is fully implemented and supports pagination, sorting, tag filtering, and soft-delete toggling via `listNotesQuerySchema` (already exported from `packages/shared`). The frontend has a working auth layer (Zustand auth store, `apiRequest` helper with automatic token refresh, `ProtectedRoute` guard) but no notes UI. The `/` route currently renders a placeholder. This design adds the `/notes` route and all supporting components.

## Goals / Non-Goals

**Goals:**
- Render a paginated, sortable, filterable notes list at `/notes` behind `ProtectedRoute`
- Integrate with `GET /notes` via a TanStack Query hook using `apiRequest`
- Persist filter/sort/pagination state in a Zustand store so it survives re-renders and shallow navigation
- Display note cards with title, content preview (truncated), tags, and `updatedAt`
- Handle loading, error, and empty states gracefully
- Redirect `/` to `/notes`

**Non-Goals:**
- Rich-text note editor (separate ticket)
- Search UI
- Sharing UI
- Version history UI
- Mobile-specific navigation (responsive layout only)

## Decisions

### 1. Zustand for filter state, TanStack Query for server state

Filter state (page, limit, sortBy, sortOrder, tags, includeDeleted) lives in a `useNotesFilterStore`. TanStack Query's `useQuery` reads from this store to build the query key and API call.

**Why over URL query params:** URL params would require syncing on every filter change and add complexity for tag arrays. Zustand is simpler given there is no requirement for shareable/bookmarkable filter URLs in this ticket.

**Alternatives considered:** URL search params via `useSearchParams` — rejected because multi-value tag arrays are verbose in URLs and the ticket makes no mention of shareable filter state.

### 2. `noteListItemSchema` inferred TypeScript type from `packages/shared`

The `NoteListItem` type is inferred from `noteListItemSchema` already exported from `packages/shared`. No new types or schemas are added.

### 3. Content preview generated client-side

`GET /notes` intentionally omits `content` from list items (spec requirement). A content preview is not available — the card shows a placeholder or the field is omitted. The card design will reflect this constraint rather than fabricate content.

**Alternative considered:** Fetch full note content on hover — rejected as over-engineered for this ticket.

### 4. Tag filter uses a multi-select from available tags

The tag filter fetches the user's tags via `GET /tags` (separate TanStack Query hook) to populate a multi-select. If tags fail to load the filter renders disabled. Tag IDs are serialised as a comma-separated string in the query param per `listNotesQuerySchema`.

### 5. Component breakdown

```
pages/
  NotesListPage.tsx         — page shell, composes layout
components/notes/
  NoteCard.tsx              — single note display
  NotesList.tsx             — grid/list of NoteCard, handles empty/error/loading
  NotesFilterBar.tsx        — sort controls + tag filter + includeDeleted toggle
  NotesPagination.tsx       — page controls
hooks/
  useNotesList.ts           — TanStack Query hook for GET /notes
  useTagsList.ts            — TanStack Query hook for GET /tags (tag filter population)
store/
  notesFilterStore.ts       — Zustand store for filter state
```

### 6. Routing: `/` redirects to `/notes`

`App.tsx` is updated to add `/notes` inside `ProtectedRoute` and change the `/` catch-all to redirect to `/notes`.

## Risks / Trade-offs

- **Stale filter state on logout** → Mitigation: Reset `notesFilterStore` when `authStore.logout()` is called, or re-initialise on mount with defaults.
- **Tag fetch fails silently** → Mitigation: Render tag filter as disabled with a tooltip if `useTagsList` errors; notes list still loads without tag filter.
- **No content preview available** → Accepted trade-off per spec; card shows title, tags, and date only until a content-preview field is added to the API.
- **Pagination resets needed on filter change** → Mitigation: `notesFilterStore` `setFilter` action resets `page` to 1 whenever any non-page filter changes.

## Migration Plan

1. Add `notesFilterStore` and query hook
2. Add `/notes` route in `App.tsx`, redirect `/` → `/notes`
3. Build `NoteCard`, `NotesList`, `NotesFilterBar`, `NotesPagination`
4. Build `NotesListPage` composing the above
5. Wire up `useTagsList` for tag filter population
6. Run `pnpm build && pnpm lint && pnpm test`

Rollback: revert `App.tsx` route change; all new files are additive.

## Open Questions

- Should `NoteCard` link directly to `/notes/:id` (editor) even though the editor page doesn't exist yet? → Yes, render the link now so it works once the editor is added; it will 404 gracefully in the meantime via the `*` → `/` fallback.
