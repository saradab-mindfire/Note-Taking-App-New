## Purpose

Define the behaviour of the version history drawer: opening from the note editor toolbar, listing saved versions, previewing version content, restoring a historical version, and dismissing the drawer.

## Requirements

### Requirement: User can open the version history drawer from the note editor toolbar
The system SHALL render a **History** button in the note editor toolbar when editing an existing note (`/notes/:id`). Clicking the button SHALL open the version history drawer. The History button SHALL NOT be rendered when creating a new note (`/notes/new`).

#### Scenario: History button visible on existing note
- **WHEN** an authenticated user navigates to `/notes/:id` for an existing note
- **THEN** the system SHALL render a History button in the editor toolbar

#### Scenario: History button not visible on new note
- **WHEN** an authenticated user navigates to `/notes/new`
- **THEN** the system SHALL NOT render the History button in the editor toolbar

#### Scenario: Clicking History button opens the drawer
- **WHEN** the user clicks the History button on an existing note
- **THEN** the version history drawer SHALL open as an overlay panel

---

### Requirement: Version history drawer lists all saved versions of a note
The system SHALL display a list of versions inside the drawer, fetched from `GET /notes/:id/versions`. Versions SHALL be displayed newest-first. Each list item SHALL show the version's `createdAt` timestamp formatted as a human-readable date. The list SHALL show a loading skeleton while the request is in-flight. The list SHALL show an error message if the request fails.

#### Scenario: Drawer shows loading skeleton while fetching
- **WHEN** the version history drawer is open and the version list request has not completed
- **THEN** the system SHALL display a loading skeleton in place of the version list

#### Scenario: Drawer shows versions in newest-first order
- **WHEN** the version list request completes successfully and the note has two or more versions
- **THEN** the system SHALL render version items ordered newest-first, each showing a formatted `createdAt` date

#### Scenario: Drawer shows empty state when no versions exist
- **WHEN** the version list request completes and returns an empty list
- **THEN** the system SHALL display a message indicating no saved versions are available

#### Scenario: Drawer shows error state on failed fetch
- **WHEN** the version list request returns a non-2xx response
- **THEN** the system SHALL display an error message with a retry action

---

### Requirement: User can preview a historical version's content
The system SHALL display the title and content of a selected version in a preview panel within the drawer. Selecting a version from the list SHALL populate the preview panel immediately using the data already returned by the list response (no additional network request required). The content SHALL be rendered as plain text (not a live TipTap editor).

#### Scenario: Selecting a version populates the preview panel
- **WHEN** the user clicks a version item in the list
- **THEN** the preview panel SHALL display the selected version's `title` and `content`

#### Scenario: No version selected shows empty preview
- **WHEN** the version history drawer is open and no version has been selected
- **THEN** the preview panel SHALL display a prompt asking the user to select a version

---

### Requirement: User can restore a historical version with confirmation
The system SHALL provide a **Restore** button in the version preview panel. Clicking Restore SHALL open a confirmation dialog. Confirming SHALL call `POST /notes/:id/versions/:versionId/restore`. On success, the drawer SHALL close and the note editor SHALL reload with the restored content. The Restore button SHALL be disabled while a save or restore mutation is in-flight.

#### Scenario: Restore button shown when a version is selected
- **WHEN** the user has selected a version in the drawer
- **THEN** a Restore button SHALL be visible in the preview panel

#### Scenario: Restore button opens confirmation dialog
- **WHEN** the user clicks the Restore button
- **THEN** a confirmation dialog SHALL appear asking the user to confirm the restore action

#### Scenario: Confirming restore calls restore endpoint and closes drawer
- **WHEN** the user confirms in the restore dialog
- **THEN** the system SHALL call `POST /notes/:id/versions/:versionId/restore`, close the drawer on success, and the note editor SHALL reflect the restored title and content

#### Scenario: Cancelling restore dialog leaves note unchanged
- **WHEN** the user cancels in the restore dialog
- **THEN** the system SHALL NOT call the restore endpoint and the drawer SHALL remain open

#### Scenario: Restore button disabled during in-flight mutations
- **WHEN** a save or restore mutation is in-flight
- **THEN** the Restore button SHALL be disabled

#### Scenario: Restore failure shows error message
- **WHEN** `POST /notes/:id/versions/:versionId/restore` returns a non-2xx response
- **THEN** the system SHALL display an error message within the drawer and SHALL NOT close it

---

### Requirement: Version history drawer can be dismissed
The system SHALL allow the user to close the version history drawer by clicking a close button or by pressing the Escape key.

#### Scenario: Close button dismisses the drawer
- **WHEN** the user clicks the close button on the version history drawer
- **THEN** the drawer SHALL close

#### Scenario: Escape key dismisses the drawer
- **WHEN** the version history drawer is open and the user presses the Escape key
- **THEN** the drawer SHALL close
