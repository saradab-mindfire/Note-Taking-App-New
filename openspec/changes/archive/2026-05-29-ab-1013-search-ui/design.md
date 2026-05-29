## Context

The backend `GET /search` endpoint is already implemented and tested (AB-1011 / notes-search spec). Shared Zod schemas (`searchQuerySchema`, `searchResultItemSchema`, `searchResultsResponseSchema`) are exported from `packages/shared`. The frontend has established patterns: TanStack Query hooks in `src/hooks/`, service functions in `src/services/`, Zustand for global UI state, and React Router v6 for navigation. All routes inside `<ProtectedRoute />` require authentication.

## Goals / Non-Goals

**Goals:**
- Add `/search` route protected by `<ProtectedRoute />`
- Search input with 300 ms debounce — does not fire for empty query
- URL query params (`q`, `page`, `limit`) as the single source of truth for search state
- Results list showing title and keyword-highlighted snippet per item
- Pagination controls (previous / next) that update the `page` param
- Loading skeleton, empty state, and error feedback
- Clicking a result navigates to `/notes/:id`

**Non-Goals:**
- Search suggestions / autocomplete
- Recent or saved searches
- AI / semantic search
- Tag or date filter UI (backend does not support these on the search endpoint)

## Decisions

### 1 — URL params as state, no Zustand store

**Decision**: Derive all search state (`q`, `page`, `limit`) from `useSearchParams`. Persist changes by calling `setSearchParams`.

**Rationale**: URL-persisted state gives browser back/forward navigation, bookmarkable links, and shareable URLs for free. A separate Zustand store would be a second source of truth that must be kept in sync with the URL.

**Alternative considered**: Zustand store mirroring URL (rejected — two sources of truth, extra sync logic).

### 2 — 300 ms debounce via local state + useEffect

**Decision**: Maintain a local `inputValue` state that updates on every keystroke. A `useEffect` debounces writes to the URL `q` param after 300 ms. Page is reset to 1 when the query changes.

**Rationale**: Keeps the search input feel instant while limiting API calls. Resetting page on query change prevents stale page offsets from appearing in results.

**Alternative considered**: `useDebounce` third-party hook (rejected — adds a dependency for a trivial function; write inline).

### 3 — TanStack Query for search data

**Decision**: `useSearchNotes` hook wraps `searchNotes()` service call. Query key includes `{ q, page, limit }`. Query is disabled when `q` is empty.

**Rationale**: Consistent with existing hooks (`useNotesList`, `useNote`). Provides caching, background refetch, and loading/error states out of the box.

### 4 — dangerouslySetInnerHTML for snippet highlighting

**Decision**: Render the `snippet` field via `dangerouslySetInnerHTML`.

**Rationale**: The backend wraps matched tokens in `<b>` tags using `ts_headline`. This is generated server-side from a controlled PostgreSQL function — not from user-supplied raw HTML — so the XSS risk is bounded. Stripping the tags would lose the highlighting value.

**Risk**: If the backend is ever changed to reflect user content verbatim in the snippet, this becomes an XSS vector. The backend spec (`notes-search`) constrains snippet generation to `ts_headline` output only, which mitigates this.

### 5 — Limit and pagination UX

**Decision**: Expose `limit` as a URL param but do not render a limit selector in the UI (default 20). Render Previous / Next buttons; show current page number. Disable Previous on page 1 and Next when `page * limit >= total`.

**Rationale**: Keeps the UI simple. `limit` in the URL enables future extensibility without changing the schema.

## Risks / Trade-offs

- **XSS via snippet** → Mitigated: backend controls snippet HTML; `ts_headline` only inserts `<b>` tags. Monitor if backend snippet generation changes.
- **Stale cache after note edit** → TanStack Query caches by `{ q, page, limit }`. Edits in `NoteEditorPage` do not automatically invalidate search results. Users may see outdated snippets until they re-search. Acceptable for MVP.
- **URL encoding of multi-word queries** → `useSearchParams` handles encoding/decoding transparently via React Router.
