## MODIFIED Requirements

### Requirement: User can manually save the note
The system SHALL provide a Save button and a Share button in the editor toolbar. The Save button SHALL immediately persist the note regardless of the autosave timer state. The Share button SHALL be visible only when editing an existing note (`id` is defined) and SHALL open the share modal on click. The Save button SHALL be disabled while a save is already in-flight.

#### Scenario: Manual save triggers API call
- **WHEN** the user clicks the Save button and the note is dirty
- **THEN** the system SHALL immediately call `PATCH /notes/:id` (or `POST /notes` if creating) and update save status

#### Scenario: Manual save while clean
- **WHEN** the user clicks the Save button and the note has no unsaved changes
- **THEN** the system SHALL NOT make an API call

#### Scenario: Save button disabled during in-flight save
- **WHEN** a save mutation is in-flight
- **THEN** the Save button SHALL be disabled

#### Scenario: Share button visible in edit mode
- **WHEN** the user is editing an existing note (`/notes/:id`)
- **THEN** a Share button SHALL be rendered in the toolbar alongside the Save button

#### Scenario: Share button not visible on new note
- **WHEN** the user is creating a new note (`/notes/new`)
- **THEN** the Share button SHALL NOT be rendered

#### Scenario: Share button opens share modal
- **WHEN** the user clicks the Share button
- **THEN** the share modal SHALL open
