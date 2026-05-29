## ADDED Requirements

### Requirement: User can create a new note from the notes list page
The system SHALL render a "New Note" button in the notes list page header. The button SHALL be visible to all authenticated users on `/notes`. Clicking the button SHALL navigate to `/notes/new`. The button SHALL be positioned in the header row alongside the "My Notes" title and SHALL support responsive layouts.

#### Scenario: New Note button is visible on the notes list page
- **WHEN** an authenticated user navigates to `/notes`
- **THEN** the system SHALL render a "New Note" button in the page header

#### Scenario: New Note button navigates to the note creation route
- **WHEN** the authenticated user clicks the "New Note" button
- **THEN** the system SHALL navigate to `/notes/new`

#### Scenario: New Note button is responsive
- **WHEN** the notes list page is rendered on a viewport narrower than 640 px
- **THEN** the "New Note" button SHALL remain visible and accessible without overflowing the header
