## 1. Search Service

- [x] 1.1 Add `searchNotes(params: { q: string; page: number; limit: number })` function to `apps/frontend/src/services/notes.service.ts` that calls `GET /api/search` and returns `SearchResultsResponse`

## 2. Search Hook

- [x] 2.1 Create `apps/frontend/src/hooks/useSearchNotes.ts` — TanStack Query hook that accepts `{ q, page, limit }`, disables the query when `q` is empty, and uses query key `['search', { q, page, limit }]`

## 3. Search Page Component

- [x] 3.1 Create `apps/frontend/src/pages/SearchPage.tsx` with a controlled search input wired to local state
- [x] 3.2 Implement 300 ms debounce in `SearchPage` that writes the debounced value to the `q` URL query param and resets `page` to 1 on query change
- [x] 3.3 On initial mount, initialise the input value from the `q` URL param
- [x] 3.4 Render search result items — each showing note title and snippet via `dangerouslySetInnerHTML` for keyword highlighting; clicking navigates to `/notes/:id`
- [x] 3.5 Render Previous / Next pagination buttons that update the `page` URL param; disable Previous on page 1, disable Next when `page * limit >= total`
- [x] 3.6 Render loading skeleton while `isLoading` is true and a non-empty query is active
- [x] 3.7 Render empty state message when results are empty and query is non-empty
- [x] 3.8 Render inline error message for non-401 API failures; redirect to `/login` on 401

## 4. Routing

- [x] 4.1 Register `/search` route inside `<ProtectedRoute />` in `apps/frontend/src/App.tsx`

## 5. Build, Lint, Test

- [x] 5.1 Run `pnpm build` — fix any TypeScript errors
- [x] 5.2 Run `pnpm lint --max-warnings 0` — fix any lint warnings
- [x] 5.3 Run `pnpm test` — confirm existing tests still pass
