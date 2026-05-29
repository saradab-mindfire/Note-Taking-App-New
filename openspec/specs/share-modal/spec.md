## Purpose

Allow authenticated note owners to generate, view, copy, and revoke tokenized public share links for their notes via a modal dialog in the note editor. Covers the supporting shared schema, backend list endpoint, and all frontend UI states.

## Requirements

### Requirement: Shared list schema exported from packages/shared
The `packages/shared` package SHALL export a `shareLinksListItemSchema` Zod schema with fields `token` (string), `shareUrl` (string), `expiresAt` (nullable coerced date), `revokedAt` (nullable coerced date), `viewCount` (non-negative integer), and `createdAt` (coerced date). It SHALL also export `shareLinksListResponseSchema` as an array of `shareLinksListItemSchema`. Both SHALL be exported from `src/index.ts` with inferred TypeScript types `ShareLinksListItem` and `ShareLinksListResponse`.

#### Scenario: shareLinksListItemSchema validates a complete item
- **WHEN** `shareLinksListItemSchema.safeParse({ token: 'abc', shareUrl: 'https://x.com', expiresAt: null, revokedAt: null, viewCount: 3, createdAt: '2026-01-01T00:00:00Z' })` is called
- **THEN** the result SHALL have `success: true` and `viewCount` as a number

#### Scenario: shareLinksListItemSchema rejects negative viewCount
- **WHEN** `shareLinksListItemSchema.safeParse({ token: 'abc', shareUrl: 'https://x.com', expiresAt: null, revokedAt: null, viewCount: -1, createdAt: '2026-01-01T00:00:00Z' })` is called
- **THEN** the result SHALL have `success: false`

---

### Requirement: Backend exposes GET /api/notes/:id/shares
The system SHALL expose `GET /api/notes/:id/shares` (auth-protected) that returns all non-revoked `shared_links` records for a note owned by the authenticated user, ordered by `createdAt` descending. Each item SHALL include `token`, `shareUrl`, `expiresAt`, `revokedAt`, `viewCount`, and `createdAt`. The note MUST be owned by the requesting user; otherwise `403` SHALL be returned. If the note does not exist (or is soft-deleted) `404` SHALL be returned.

#### Scenario: Owner lists share links for their note
- **WHEN** an authenticated user sends `GET /api/notes/:id/shares` for a note they own
- **THEN** the system returns `200` with `{ success: true, data: [{ token, shareUrl, expiresAt, revokedAt, viewCount, createdAt }] }` ordered by `createdAt` descending

#### Scenario: Owner gets empty list when no links exist
- **WHEN** an authenticated user sends `GET /api/notes/:id/shares` for their note that has no share links
- **THEN** the system returns `200` with `{ success: true, data: [] }`

#### Scenario: Non-owner requests share links
- **WHEN** an authenticated user sends `GET /api/notes/:id/shares` for a note owned by another user
- **THEN** the system returns `403 Forbidden`

#### Scenario: Note does not exist
- **WHEN** an authenticated user sends `GET /api/notes/:id/shares` for a non-existent note ID
- **THEN** the system returns `404 Not Found`

---

### Requirement: Share modal opens from the note editor toolbar
The system SHALL render a Share button in the note editor toolbar when editing an existing note (`id` is defined). Clicking the Share button SHALL open a modal dialog. The Share button SHALL NOT be visible on the new-note route (`/notes/new`).

#### Scenario: Share button visible in edit mode
- **WHEN** an authenticated user is on `/notes/:id` (edit mode)
- **THEN** the system SHALL render a Share button in the toolbar

#### Scenario: Share button not visible on new note
- **WHEN** an authenticated user is on `/notes/new`
- **THEN** the system SHALL NOT render a Share button

#### Scenario: Share button opens modal
- **WHEN** the user clicks the Share button
- **THEN** the share modal dialog SHALL open

---

### Requirement: Share modal displays active share links
The system SHALL fetch `GET /api/notes/:id/shares` via TanStack Query when the modal opens. While loading, a loading skeleton SHALL be shown. On success, all links SHALL be listed. The list SHALL show for each link: the full share URL, view count, expiry date (if set), and a visual "Expired" indicator when `expiresAt` is in the past. Revoked links (non-null `revokedAt`) SHALL NOT be shown in the list.

#### Scenario: Loading state shown while fetching links
- **WHEN** the share modal opens and the `GET /api/notes/:id/shares` request is in-flight
- **THEN** the modal SHALL display a loading skeleton

#### Scenario: Active links listed on success
- **WHEN** the `GET /api/notes/:id/shares` response returns one or more links with `revokedAt: null`
- **THEN** each link SHALL be listed with its shareUrl, viewCount, and expiresAt (or "No expiry")

#### Scenario: Revoked links excluded from list
- **WHEN** the `GET /api/notes/:id/shares` response includes links with non-null `revokedAt`
- **THEN** those links SHALL NOT appear in the rendered list

#### Scenario: Expired link visually indicated
- **WHEN** a link's `expiresAt` is a past timestamp
- **THEN** the link SHALL be rendered with an "Expired" badge

#### Scenario: Empty state shown when no active links
- **WHEN** the `GET /api/notes/:id/shares` response returns an empty array (or all links are revoked)
- **THEN** the modal SHALL display an empty-state message (e.g., "No active share links")

#### Scenario: Error state shown on fetch failure
- **WHEN** the `GET /api/notes/:id/shares` request returns an error
- **THEN** the modal SHALL display an error message with a retry action

---

### Requirement: User can generate a new share link
The share modal SHALL provide a "Generate link" action. An optional expiry date-time input SHALL be available. When an expiry value is provided, the frontend SHALL normalize it to a valid ISO-8601 datetime string (UTC) using `new Date(value).toISOString()` before passing it to the mutation. The frontend SHALL validate the expiry value client-side and reject unparseable input with an inline error message before making any API call. Clicking "Generate link" SHALL call `POST /api/notes/:id/share` via TanStack Query mutation. On success the link list SHALL be refreshed (invalidate `['shareLinks', noteId]` query). While the mutation is in-flight the button SHALL be disabled.

#### Scenario: Generate link without expiry
- **WHEN** the user clicks "Generate link" with no expiry set
- **THEN** the system SHALL call `POST /api/notes/:id/share` with no `expiresAt` and refresh the links list on success

#### Scenario: Generate link with expiry
- **WHEN** the user enters a future datetime and clicks "Generate link"
- **THEN** the system SHALL convert the value to a UTC ISO-8601 string via `new Date(value).toISOString()` and call `POST /api/notes/:id/share` with that `expiresAt` value

#### Scenario: Invalid expiry value rejected client-side
- **WHEN** the user enters an unparseable or empty string in the expiry field and clicks "Generate link"
- **THEN** the system SHALL NOT call the API and SHALL display an inline validation error near the expiry input

#### Scenario: Generate button disabled during in-flight mutation
- **WHEN** the `POST /api/notes/:id/share` mutation is in-flight
- **THEN** the "Generate link" button SHALL be disabled

#### Scenario: Error shown on generate failure
- **WHEN** `POST /api/notes/:id/share` returns an error
- **THEN** the modal SHALL display an inline error message

---

### Requirement: User can copy a share link to clipboard
Each active share link SHALL have a "Copy" button. Clicking it SHALL attempt `navigator.clipboard.writeText(shareUrl)`. On success a visual confirmation (e.g., button label changes to "Copied!" briefly) SHALL be shown. On failure an inline error message SHALL be displayed.

#### Scenario: Successful clipboard copy
- **WHEN** the user clicks "Copy" for an active share link and `navigator.clipboard.writeText` resolves
- **THEN** the button label SHALL change to "Copied!" for approximately 2 seconds then revert

#### Scenario: Clipboard copy failure
- **WHEN** `navigator.clipboard.writeText` rejects
- **THEN** the system SHALL display an inline error message near the failed link

---

### Requirement: User can revoke a share link
Each active share link SHALL have a "Revoke" button. Clicking it SHALL call `DELETE /api/share/:token` via TanStack Query mutation. The link SHALL be optimistically removed from the UI immediately. On error the link SHALL be restored and an error message displayed. On success the `['shareLinks', noteId]` query SHALL be invalidated to confirm server state.

#### Scenario: Revoke removes link from list
- **WHEN** the user clicks "Revoke" for an active link
- **THEN** the link SHALL be removed from the list immediately (optimistic) and `DELETE /api/share/:token` SHALL be called

#### Scenario: Failed revoke restores link
- **WHEN** `DELETE /api/share/:token` returns an error
- **THEN** the revoked link SHALL be restored to the list and an error message SHALL be displayed

#### Scenario: Revoke button disabled during in-flight mutation
- **WHEN** a revoke mutation for a specific token is in-flight
- **THEN** the Revoke button for that token SHALL be disabled

---

### Requirement: Share modal is responsive
The share modal SHALL be usable on screens as narrow as 375 px. Link URLs SHALL truncate with ellipsis rather than overflow the container. All interactive controls SHALL meet WCAG AA minimum touch target size (44 × 44 px equivalent).

#### Scenario: Modal fits on narrow viewport
- **WHEN** the share modal is opened on a 375 px viewport
- **THEN** the modal content SHALL not overflow or cause horizontal scroll

#### Scenario: Long URL truncated
- **WHEN** a share link URL is longer than the available container width
- **THEN** the URL SHALL be truncated with ellipsis (CSS `truncate`) rather than overflowing
