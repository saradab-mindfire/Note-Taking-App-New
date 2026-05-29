## MODIFIED Requirements

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
