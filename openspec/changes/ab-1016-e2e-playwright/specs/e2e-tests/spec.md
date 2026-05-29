## ADDED Requirements

### Requirement: E2E test workspace is configured
The system SHALL have a dedicated `apps/e2e/` pnpm workspace package containing Playwright configuration, fixtures, page objects, and test suites. The package SHALL expose a `test` script that runs the full E2E suite via `playwright test`. A root-level `test:e2e` script SHALL delegate to this package.

#### Scenario: Playwright suite executes
- **WHEN** `pnpm test:e2e` is run from the monorepo root with the dev stack running
- **THEN** Playwright SHALL discover and execute all test files in `apps/e2e/src/tests/`

#### Scenario: CI mode retries flaky tests
- **WHEN** the `CI` environment variable is set
- **THEN** Playwright SHALL retry failing tests up to 2 times before marking them as failed

---

### Requirement: Auth fixtures manage test user lifecycle
The system SHALL provide Playwright fixtures that create a unique test user via the backend API before each test and delete all test data after each test. The `authenticatedPage` fixture SHALL set the JWT access token in localStorage so tests begin already logged in without UI interaction.

#### Scenario: Authenticated fixture provides logged-in page
- **WHEN** a test uses the `authenticatedPage` fixture
- **THEN** the page SHALL open the notes list with a valid session already established

#### Scenario: Test user is cleaned up after test
- **WHEN** a test that used the auth fixture completes (pass or fail)
- **THEN** the test user and all associated data SHALL be deleted via the API

---

### Requirement: Scenario 1 — Registration and login flow
The system SHALL have an E2E test that registers a new user through the UI, logs in with those credentials, and verifies successful redirect to the notes list page.

#### Scenario: Successful registration and login
- **WHEN** a new user completes the registration form and then logs in
- **THEN** the browser SHALL be redirected to the notes list page (`/notes`)

#### Scenario: Invalid login shows error
- **WHEN** a user submits the login form with incorrect credentials
- **THEN** an error message SHALL be displayed and the user SHALL remain on the login page

---

### Requirement: Scenario 2 — Note creation, editing, and autosave persistence
The system SHALL have an E2E test that creates a note, edits its content, waits for autosave to complete, reloads the page, and verifies the content is unchanged.

#### Scenario: Note content persists after autosave and reload
- **WHEN** a user creates a note, types content, waits for the autosave API call to complete, and reloads the page
- **THEN** the editor SHALL display the same content that was typed

#### Scenario: Autosave is triggered by typing
- **WHEN** a user types in the note editor and pauses for more than 1 000 ms
- **THEN** a PATCH request to the notes API SHALL be intercepted by Playwright within 3 000 ms

---

### Requirement: Scenario 3 — Tag management and filtering
The system SHALL have an E2E test that creates tags, assigns them to a note, filters the notes list by tag, and verifies the filtered result set.

#### Scenario: Filtered notes list shows only tagged notes
- **WHEN** a user filters notes by a specific tag
- **THEN** only notes with that tag SHALL be displayed in the notes list

#### Scenario: Untagged notes are excluded from tag filter
- **WHEN** a user filters notes by a tag not assigned to a note
- **THEN** that note SHALL NOT appear in the filtered results

---

### Requirement: Scenario 4 — Full-text search
The system SHALL have an E2E test that searches for note content by keyword, verifies the matching note appears in results, and opens it.

#### Scenario: Search returns matching note
- **WHEN** a user types a keyword that exists in a note's content into the search input
- **THEN** the matching note SHALL appear in the search results list

#### Scenario: Search result opens correct note
- **WHEN** a user clicks a search result
- **THEN** the note editor SHALL open with that note's content

---

### Requirement: Scenario 5 — Share link generation and public access
The system SHALL have an E2E test that generates a share link for a note, opens the public share URL in a new browser context (unauthenticated), and verifies read-only access and view count increment.

#### Scenario: Public share URL renders note in read-only mode
- **WHEN** an unauthenticated user opens a valid share link URL
- **THEN** the note content SHALL be displayed and no edit controls SHALL be visible

#### Scenario: View count increments on share access
- **WHEN** a share link is accessed
- **THEN** the share link's view count SHALL be incremented by 1

#### Scenario: Expired share link shows error
- **WHEN** an unauthenticated user opens a share link whose `expiresAt` is in the past
- **THEN** an error message SHALL be displayed indicating the link has expired

---

### Requirement: Scenario 6 — Version history and restore
The system SHALL have an E2E test that edits a note multiple times (waiting for each save), opens the version history drawer, selects a historical version, restores it, and verifies the editor shows the restored content.

#### Scenario: Version history drawer lists saved versions
- **WHEN** a user opens the History drawer for a note that has been saved multiple times
- **THEN** the drawer SHALL list at least as many versions as saves performed during the test

#### Scenario: Restoring a version updates editor content
- **WHEN** a user selects a historical version and clicks Restore
- **THEN** the editor SHALL display the content from that historical version

---

### Requirement: Scenario 7 — Logout and protected route enforcement
The system SHALL have an E2E test that logs out via the UI and then attempts to access a protected route, verifying redirection to the login page.

#### Scenario: Logout clears session and redirects
- **WHEN** a user clicks the logout control
- **THEN** the session SHALL be cleared and the user SHALL be redirected to `/login`

#### Scenario: Protected route redirects unauthenticated user
- **WHEN** an unauthenticated user navigates directly to `/notes`
- **THEN** the application SHALL redirect to `/login`

---

### Requirement: Unauthorized access attempt is rejected
The system SHALL have an E2E test that attempts to access another user's note via a direct API call using a valid but different user's token and verifies a 403 or 404 response.

#### Scenario: Cross-user note access is forbidden
- **WHEN** a user sends an authenticated GET request to `/api/notes/:id` where the note belongs to a different user
- **THEN** the API SHALL respond with HTTP 403 or 404

---

### Requirement: Page objects encapsulate UI interactions
The system SHALL provide Page Object Model classes for each major page (`LoginPage`, `RegisterPage`, `NotesListPage`, `NoteEditorPage`, `SearchPage`, `SharePage`). Each POM SHALL expose typed methods for all interactions performed in the test suite.

#### Scenario: POM method performs action and returns result
- **WHEN** a test calls a POM method such as `notesListPage.openNote(title)`
- **THEN** the method SHALL navigate to the note editor for the matching note without exposing raw locators to the test body
