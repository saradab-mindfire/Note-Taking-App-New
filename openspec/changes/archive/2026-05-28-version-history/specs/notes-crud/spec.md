## MODIFIED Requirements

### Requirement: Authenticated user can update their note
The system SHALL allow an authenticated user to update the `title`, `content`, and/or `tagIds` of a note they own. All fields are optional (PATCH semantics). When `tagIds` is provided the full tag association set SHALL be replaced atomically. The response SHALL return the updated note with current tags. The update operation SHALL also create an immutable snapshot in `note_versions` capturing the pre-update `title` and `content`, atomically within the same database transaction. If the snapshot insert fails the entire update SHALL be rolled back.

#### Scenario: Successful partial update (title only)
- **WHEN** an authenticated user sends `PATCH /notes/:id` with `{ "title": "New Title" }`
- **THEN** the system SHALL return HTTP 200 with the note reflecting the new title and unchanged content and tags, AND a new row SHALL exist in `note_versions` capturing the previous title and content

#### Scenario: Successful tag replacement
- **WHEN** an authenticated user sends `PATCH /notes/:id` with `{ "tagIds": ["<tag-b-id>"] }` and the note previously had tag A
- **THEN** the system SHALL return HTTP 200 with `tags` containing only tag B, AND a new snapshot SHALL exist in `note_versions`

#### Scenario: Update of non-existent or unowned note
- **WHEN** an authenticated user sends `PATCH /notes/:id` for a note that does not exist or belongs to another user
- **THEN** the system SHALL return HTTP 404 with `{ success: false, error: "Note not found" }`

#### Scenario: Update of soft-deleted note
- **WHEN** an authenticated user sends `PATCH /notes/:id` for a soft-deleted note
- **THEN** the system SHALL return HTTP 404 with `{ success: false, error: "Note not found" }`

#### Scenario: Snapshot failure rolls back the entire update
- **WHEN** the `note_versions` insert fails during a note update transaction
- **THEN** the note row SHALL NOT be updated and the system SHALL return HTTP 500
