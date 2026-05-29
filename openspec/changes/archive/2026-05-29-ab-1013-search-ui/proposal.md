## Why

Users have no way to find notes by keyword from the frontend — the backend full-text search API exists but has no UI surface. Adding a dedicated search page unlocks the core discoverability feature of the application.

## What Changes

- Add `/search` route with `q`, `page`, and `limit` URL query params
- New `SearchPage` component with debounced search input, results list, pagination controls, and keyword-highlighted snippets
- TanStack Query hook wrapping the `GET /search` backend endpoint
- Empty state, loading skeleton, and error feedback components
- URL-persisted search state so pagination and browser back/forward work correctly
- Clicking a result navigates to the note editor for that note

## Capabilities

### New Capabilities

- `search-page`: Frontend search route (`/search`) — input, debounced query, results list with highlighted snippets, pagination, loading/error/empty states, and navigation to the note editor

### Modified Capabilities

<!-- No existing backend or spec-level requirements are changing -->

## Impact

- Frontend: new page component, new route, new TanStack Query hook, new shadcn/ui composite components
- `packages/shared`: `searchQuerySchema` and `searchResultItemSchema` already exported (defined in `notes-search` spec); no new shared types required unless frontend needs an additional response wrapper type
- Backend: no changes — consumes existing `GET /search` endpoint
- Auth: search route must be protected (authenticated users only)
