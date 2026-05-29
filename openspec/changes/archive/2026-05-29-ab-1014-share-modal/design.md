## Context

The backend sharing API is already implemented (`POST /api/notes/:id/share`, `DELETE /api/share/:token`, `GET /public/share/:token`). The missing pieces are: (1) a `GET /api/notes/:id/shares` endpoint to list a note's active links, (2) the corresponding shared schema, and (3) the frontend UI. This change is frontend-heavy but requires a small backend addition.

## Goals / Non-Goals

**Goals:**
- Let note owners generate tokenized share links from within the note editor
- Display all active (non-revoked) share links with view count and expiry
- Allow copy-to-clipboard and per-link revocation
- Surface loading, error, and empty states throughout the modal

**Non-Goals:**
- Email / social sharing
- Password-protected links
- Editing notes via shared link
- Analytics dashboard or aggregate view counts

## Decisions

### 1. Add `GET /api/notes/:id/shares` to the backend

The frontend needs a persistent list of active links — storing them only in local React state would lose them on navigation. A dedicated list endpoint is the canonical solution.

**Alternative considered**: store generated links in Zustand. Rejected because state is lost on page refresh and doesn't reflect links created in other sessions.

**Schema addition to `packages/shared`**: `shareLinksListItemSchema` (token, shareUrl, expiresAt, revokedAt, viewCount, createdAt) and `shareLinksListResponseSchema` (array of items). These are added to `schemas/sharing.ts` and exported from `types/index.ts`.

### 2. shadcn/ui Dialog for the share modal

The project already uses shadcn/ui. `Dialog` / `DialogContent` give accessible modal semantics with minimal custom CSS.

**Alternative**: a drawer or slide-over. Rejected as overkill for a focused utility modal.

### 3. TanStack Query for all share state — no Zustand

List, create, and revoke are all server state. The mutation callbacks invalidate the list query cache so the UI stays in sync after every action.

**Query key**: `['shareLinks', noteId]`

### 4. Optimistic UI for revoke

Revocation should feel instant. Optimistic removal from the cached list, with rollback on error, matches the pattern used elsewhere in the project (no extra state machine needed).

### 5. Clipboard API with fallback notification

`navigator.clipboard.writeText()` is the modern approach. On failure the UI shows an error toast / inline message rather than silently failing.

### 6. Share button only shown in edit mode

The Share button is rendered in `NoteEditorPage` only when `id` is defined (edit mode). New unsaved notes cannot be shared until they have been saved at least once.

## Risks / Trade-offs

- **New backend endpoint** → small scope increase, but unavoidable for persistent link listing. Tasks must include a backend task before the frontend list hook is usable.
- **Clipboard API permission** → may be denied on some browsers/contexts. Mitigation: show the URL inline so the user can copy manually.
- **Expired link display** → expiry is client-evaluated from `expiresAt` field. Clock skew could cause minor visual inconsistency. Mitigation: treat server `revokedAt` as authoritative for actual access; expiry indicator is cosmetic.
