## Why

Users currently have no way to share their notes with others. The backend sharing API (generate link, revoke link, public read) is already implemented; this change wires up the missing frontend UI so note owners can generate and manage share links directly from the note editor.

## What Changes

- Add a Share button to the note editor toolbar
- Implement a Share modal with:
  - Generate share link (with optional expiry)
  - Display all active share links for a note
  - Copy share link to clipboard
  - Revoke individual share links
  - Show expiry date and view count per link
  - Visual indication for expired links
- Add TanStack Query hooks for share API endpoints (`POST /notes/:id/share`, `DELETE /share/:token`, `GET /notes/:id/shares`)
- Add shared Zod schemas and TypeScript types for share link payloads in `packages/shared`

## Capabilities

### New Capabilities
- `share-modal`: Share modal UI — generates links, lists active links with view counts and expiry, supports copy and revoke actions

### Modified Capabilities
- `note-editor-page`: Share button added to the editor toolbar; opens the share modal

## Impact

- `apps/frontend`: New ShareModal component, new share API hooks, share button in NoteEditorPage
- `packages/shared`: New Zod schemas (`createShareLinkSchema`, `shareListResponseSchema`) and inferred types
- No backend changes required (API is already implemented)
- No database schema changes
