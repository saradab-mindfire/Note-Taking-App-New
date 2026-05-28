## Why

Notes are currently private to the owner with no way to share content externally. Users need a lightweight, secure mechanism to share individual notes as read-only public links — without requiring recipients to create an account.

## What Changes

- New `shared_links` database table storing token, expiry, revocation, and view count per note
- `POST /notes/:id/share` — generate a public share link for a note (owner only)
- `DELETE /share/:token` — revoke a share link (owner only)
- `GET /public/share/:token` — read a note via token (no auth required, read-only)
- Atomic view count increment on every public access
- Expired and revoked links return `403 Forbidden`
- Soft-deleted notes cannot be shared

## Capabilities

### New Capabilities

- `note-sharing`: Public share-link lifecycle for notes — generate tokenized links, revoke them, enforce expiry and revocation on public access, and track atomic view counts. Read-only; no authentication required for public access.

### Modified Capabilities

<!-- No existing spec-level requirements are changing. -->

## Impact

- **Database**: New `shared_links` table; `notes` table read on public endpoint
- **Backend**: New router `sharing.router.ts`; shared Zod schemas in `packages/shared`
- **Frontend**: Out of scope for this ticket
- **Auth**: Public endpoint bypasses JWT middleware; all other endpoints remain protected
- **packages/shared**: New `shareLink` Zod schemas and TypeScript types
