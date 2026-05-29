## MODIFIED Requirements

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
