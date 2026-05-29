## ADDED Requirements

### Requirement: Public share page is accessible without authentication
The system SHALL render a public note viewer at `/share/:token`. The route SHALL NOT require authentication. Both authenticated and unauthenticated users SHALL be able to access it. Authenticated users SHALL NOT be redirected away from this route.

#### Scenario: Unauthenticated user opens a share link
- **WHEN** an unauthenticated user navigates to `/share/:token`
- **THEN** the system SHALL render the public share page without redirecting to `/login`

#### Scenario: Authenticated user opens a share link
- **WHEN** an authenticated user navigates to `/share/:token`
- **THEN** the system SHALL render the public share page without redirecting away

---

### Requirement: Public share page fetches and displays the shared note
The system SHALL call `GET /api/public/share/:token` when the page mounts. While loading, a skeleton SHALL be shown. On success, the note title and content SHALL be rendered in read-only mode. The TipTap editor SHALL be instantiated with `editable: false` to render the content with its formatting preserved.

#### Scenario: Loading state shown while fetching
- **WHEN** the public share page mounts and the API request is in-flight
- **THEN** the system SHALL display a loading skeleton in place of the note content

#### Scenario: Note title and content rendered on success
- **WHEN** `GET /api/public/share/:token` returns a valid note response
- **THEN** the system SHALL display the note title as a heading and render the note content using TipTap in read-only mode

#### Scenario: Note content preserves rich-text formatting
- **WHEN** the shared note contains bold, italic, headings, or list formatting
- **THEN** the rendered content SHALL display those formats correctly in the public viewer

---

### Requirement: Public share page shows user-friendly error states
The system SHALL display a specific, user-friendly error message for each failure mode. No raw API JSON or technical error details SHALL be visible to the user.

#### Scenario: Expired share link
- **WHEN** `GET /api/public/share/:token` returns HTTP 403 with message containing "expired"
- **THEN** the system SHALL display a message indicating the link has expired

#### Scenario: Revoked share link
- **WHEN** `GET /api/public/share/:token` returns HTTP 403 with message containing "revoked"
- **THEN** the system SHALL display a message indicating the link has been revoked

#### Scenario: Note no longer available
- **WHEN** `GET /api/public/share/:token` returns HTTP 403 with message containing "no longer available"
- **THEN** the system SHALL display a message indicating the note is no longer available

#### Scenario: Invalid or unknown token
- **WHEN** `GET /api/public/share/:token` returns HTTP 404
- **THEN** the system SHALL display a message indicating the share link was not found

#### Scenario: Generic network or server error
- **WHEN** `GET /api/public/share/:token` returns any other error
- **THEN** the system SHALL display a generic error message

---

### Requirement: Public share page is responsive
The public share page SHALL be usable on screens as narrow as 375 px. The note content SHALL not overflow or cause horizontal scroll on narrow viewports.

#### Scenario: Page renders correctly on mobile viewport
- **WHEN** the public share page is opened on a 375 px viewport
- **THEN** the title and content SHALL be fully visible without horizontal overflow
