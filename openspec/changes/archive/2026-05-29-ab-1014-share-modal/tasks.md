## 1. Shared Package — List Schema

- [x] 1.1 Add `shareLinksListItemSchema` to `packages/shared/src/schemas/sharing.ts` (fields: token, shareUrl, expiresAt nullable, revokedAt nullable, viewCount nonneg int, createdAt)
- [x] 1.2 Add `shareLinksListResponseSchema` (array of `shareLinksListItemSchema`) to `packages/shared/src/schemas/sharing.ts`
- [x] 1.3 Export inferred types `ShareLinksListItem` and `ShareLinksListResponse` from `packages/shared/src/types/index.ts`
- [x] 1.4 Run `pnpm --filter shared build && pnpm --filter shared lint --max-warnings 0 && pnpm --filter shared test`

## 2. Backend — List Share Links Endpoint

- [x] 2.1 Add `listShareLinks(userId, noteId)` method to `apps/backend/src/features/sharing/sharing.service.ts` — verify note ownership, return non-revoked links ordered by `createdAt` desc
- [x] 2.2 Register `GET /api/notes/:id/shares` in `apps/backend/src/features/sharing/sharing.router.ts` calling the new service method
- [x] 2.3 Add integration tests for the new endpoint (200 owner, 200 empty, 403 non-owner, 404 not found) in `apps/backend/src/features/sharing/sharing.test.ts`
- [x] 2.4 Run `pnpm --filter backend build && pnpm --filter backend lint --max-warnings 0 && pnpm --filter backend test`

## 3. Frontend — Sharing Service and Hooks

- [x] 3.1 Create `apps/frontend/src/services/sharing.service.ts` with `fetchShareLinks(noteId)`, `createShareLink(noteId, dto)`, and `revokeShareLink(token)` functions using `apiRequest`
- [x] 3.2 Create `apps/frontend/src/hooks/useShareLinks.ts` — `useQuery(['shareLinks', noteId], ...)` disabled when `noteId` is falsy
- [x] 3.3 Create `apps/frontend/src/hooks/useCreateShareLink.ts` — `useMutation` that invalidates `['shareLinks', noteId]` on success
- [x] 3.4 Create `apps/frontend/src/hooks/useRevokeShareLink.ts` — `useMutation` with optimistic removal from cache and rollback on error, invalidates `['shareLinks', noteId]` on settle

## 4. Frontend — Share Modal Component

- [x] 4.1 Install shadcn/ui Dialog if not already present (`pnpm --filter frontend exec npx shadcn-ui@latest add dialog`)
- [x] 4.2 Create `apps/frontend/src/components/notes/ShareModal.tsx` — accepts `noteId: string` and `open/onOpenChange` props
- [x] 4.3 Implement loading skeleton inside modal while `useShareLinks` is loading
- [x] 4.4 Implement empty state when no active links exist
- [x] 4.5 Implement error state with retry button when `useShareLinks` errors
- [x] 4.6 Render active links list (exclude revoked, show token URL, view count, expiry, "Expired" badge for past `expiresAt`)
- [x] 4.7 Implement "Copy" button per link using `navigator.clipboard.writeText`; show "Copied!" for 2 s on success, inline error on failure
- [x] 4.8 Implement "Revoke" button per link using `useRevokeShareLink`; disable button while mutation in-flight
- [x] 4.9 Implement "Generate link" form with optional expiry datetime input and submit button using `useCreateShareLink`; disable button while mutation in-flight; show inline error on failure
- [x] 4.10 Apply responsive layout — modal max-width, URL truncation with `truncate` class

## 5. Frontend — Note Editor Integration

- [x] 5.1 Add Share button to the toolbar in `apps/frontend/src/pages/NoteEditorPage.tsx`, rendered only when `id` is defined
- [x] 5.2 Wire Share button to open/close `ShareModal` using local `useState` for modal open state
- [x] 5.3 Pass `noteId={id}` and `open`/`onOpenChange` props to `ShareModal`

## 6. Quality Gates

- [x] 6.1 Run `pnpm --filter frontend build && pnpm --filter frontend lint --max-warnings 0`
- [x] 6.2 Run `pnpm --filter frontend test`
- [x] 6.3 Run `pnpm build && pnpm lint --max-warnings 0 && pnpm test` from monorepo root
