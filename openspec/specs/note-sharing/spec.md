# Spec: note-sharing

## Requirements

### Requirement: Generate public share link
The system SHALL allow an authenticated note owner to generate a tokenized public share link for a note. The token MUST be a cryptographically random 64-character hex string. An optional `expiresAt` timestamp MAY be provided. Soft-deleted notes SHALL NOT be shareable. The `shareUrl` in the response SHALL point to the frontend public viewer route, constructed as `<FRONTEND_URL>/share/:token` where `FRONTEND_URL` is read from the `FRONTEND_URL` environment variable (default: `http://localhost:5173`).

#### Scenario: Owner generates a share link without expiry
- **WHEN** an authenticated user sends `POST /notes/:id/share` for a note they own, with no `expiresAt`
- **THEN** the system creates a `shared_links` record with a unique token, `null` expiry, `null` revokedAt, and returns `201` with `{ token, shareUrl, expiresAt: null }` where `shareUrl` is `<FRONTEND_URL>/share/:token`

#### Scenario: Owner generates a share link with expiry
- **WHEN** an authenticated user sends `POST /notes/:id/share` with a future `expiresAt` timestamp
- **THEN** the system creates the link record with the given `expiresAt` and returns `201` with the token, expiry, and `shareUrl` as `<FRONTEND_URL>/share/:token`

#### Scenario: shareUrl points to frontend origin
- **WHEN** `FRONTEND_URL` is set to `https://app.example.com` and a share link is generated
- **THEN** the returned `shareUrl` SHALL be `https://app.example.com/share/:token`

#### Scenario: Owner tries to share another user's note
- **WHEN** an authenticated user sends `POST /notes/:id/share` for a note they do not own
- **THEN** the system returns `403 Forbidden`

#### Scenario: Owner tries to share a soft-deleted note
- **WHEN** an authenticated user sends `POST /notes/:id/share` for a note with a non-null `deletedAt`
- **THEN** the system returns `404 Not Found`

#### Scenario: Note does not exist
- **WHEN** an authenticated user sends `POST /notes/:id/share` for a non-existent note ID
- **THEN** the system returns `404 Not Found`

---

### Requirement: Revoke share link
The system SHALL allow an authenticated note owner to revoke a share link by its token. Revocation MUST set `revokedAt` to the current timestamp. Only the owner of the linked note SHALL be able to revoke its links.

#### Scenario: Owner revokes an active link
- **WHEN** an authenticated user sends `DELETE /share/:token` for a token whose linked note they own
- **THEN** the system sets `revokedAt = NOW()` on the `shared_links` record and returns `204 No Content`

#### Scenario: Non-owner tries to revoke a link
- **WHEN** an authenticated user sends `DELETE /share/:token` for a token whose linked note belongs to another user
- **THEN** the system returns `403 Forbidden`

#### Scenario: Token does not exist
- **WHEN** an authenticated user sends `DELETE /share/:token` with an unrecognized token
- **THEN** the system returns `404 Not Found`

---

### Requirement: Public read-only access via token
The system SHALL expose `GET /public/share/:token` that returns the full note content without requiring authentication. The endpoint MUST atomically increment `viewCount` on the `shared_links` record. Expired or revoked links SHALL return `403`. Links to soft-deleted notes SHALL return `403`.

#### Scenario: Valid, active token is accessed
- **WHEN** any client (authenticated or not) sends `GET /public/share/:token` with a valid, non-expired, non-revoked token for a non-deleted note
- **THEN** the system returns `200` with the note's `id`, `title`, `content`, `createdAt`, `updatedAt`, and the link's `viewCount` (post-increment)

#### Scenario: Expired token is accessed
- **WHEN** a client sends `GET /public/share/:token` and `expiresAt` is in the past
- **THEN** the system returns `403 Forbidden` with `{ error: "Link has expired" }`

#### Scenario: Revoked token is accessed
- **WHEN** a client sends `GET /public/share/:token` and `revokedAt` is non-null
- **THEN** the system returns `403 Forbidden` with `{ error: "Link has been revoked" }`

#### Scenario: Token for a soft-deleted note is accessed
- **WHEN** a client sends `GET /public/share/:token` and the linked note has a non-null `deletedAt`
- **THEN** the system returns `403 Forbidden` with `{ error: "Note is no longer available" }`

#### Scenario: Invalid or unknown token is accessed
- **WHEN** a client sends `GET /public/share/:token` with a token that does not exist in `shared_links`
- **THEN** the system returns `404 Not Found`

#### Scenario: View count is incremented atomically
- **WHEN** multiple concurrent clients access the same valid token simultaneously
- **THEN** each request increments `viewCount` by exactly 1 with no lost updates (atomic DB increment)
