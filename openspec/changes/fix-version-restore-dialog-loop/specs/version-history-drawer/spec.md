## MODIFIED Requirements

### Requirement: User can restore a historical version with confirmation
The system SHALL provide a **Restore** button in the version preview panel. Clicking Restore SHALL open a confirmation dialog. Confirming SHALL immediately close the dialog and call `POST /notes/:id/versions/:versionId/restore` exactly once. The confirm button and Restore button SHALL be disabled while the restore mutation is in-flight to prevent duplicate submissions. On success, the note editor SHALL reload with the restored content and a success notification SHALL be displayed. On failure, an error notification SHALL be displayed and the Restore button SHALL be re-enabled so the user may retry. The Restore button SHALL be disabled while any save or restore mutation is in-flight.

#### Scenario: Restore button shown when a version is selected
- **WHEN** the user has selected a version in the drawer
- **THEN** a Restore button SHALL be visible in the preview panel

#### Scenario: Restore button opens confirmation dialog
- **WHEN** the user clicks the Restore button
- **THEN** a confirmation dialog SHALL appear asking the user to confirm the restore action

#### Scenario: Confirming restore closes dialog immediately and calls endpoint once
- **WHEN** the user clicks confirm in the restore dialog
- **THEN** the dialog SHALL close immediately, the system SHALL call `POST /notes/:id/versions/:versionId/restore` exactly once, and the confirm button SHALL be disabled for the duration of the in-flight request

#### Scenario: Successful restore reloads editor and shows success notification
- **WHEN** `POST /notes/:id/versions/:versionId/restore` returns a 2xx response
- **THEN** the drawer SHALL close, the note editor SHALL reflect the restored title and content, and a success notification SHALL be displayed

#### Scenario: Cancelling restore dialog leaves note unchanged
- **WHEN** the user cancels in the restore dialog
- **THEN** the system SHALL NOT call the restore endpoint and the drawer SHALL remain open

#### Scenario: Restore button disabled during in-flight mutations
- **WHEN** a save or restore mutation is in-flight
- **THEN** the Restore button SHALL be disabled

#### Scenario: Restore failure shows error notification and re-enables retry
- **WHEN** `POST /notes/:id/versions/:versionId/restore` returns a non-2xx response or a network error occurs
- **THEN** the system SHALL display an error notification, SHALL NOT call the restore endpoint again automatically, and the Restore button SHALL be re-enabled to allow the user to retry

#### Scenario: Dialog does not reappear after confirmation
- **WHEN** the user has confirmed the restore dialog once
- **THEN** the confirmation dialog SHALL NOT reappear until the user explicitly clicks the Restore button again
