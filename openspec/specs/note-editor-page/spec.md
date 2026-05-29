## Purpose

Define the behaviour of the note editor page at `/notes/new` and `/notes/:id`: route access, note loading, rich-text editing, tag selection, autosave, manual save, save status display, first-save navigation, shared form schema, and the Share button that opens the share modal.

## Requirements

### Requirement: Authenticated user can access the note editor at /notes/new
The system SHALL render a blank note editor at `/notes/new`. Unauthenticated users SHALL be redirected to `/login`. The editor SHALL initialise with an empty title field, an empty TipTap document, and no selected tags.

#### Scenario: Authenticated user navigates to /notes/new
- **WHEN** an authenticated user navigates to `/notes/new`
- **THEN** the system SHALL render the note editor page with an empty title input, an empty TipTap editor, and a tag selector with no tags selected

#### Scenario: Unauthenticated user navigates to /notes/new
- **WHEN** an unauthenticated user navigates to `/notes/new`
- **THEN** the system SHALL redirect to `/login`

---

### Requirement: Authenticated user can access the note editor at /notes/:id
The system SHALL render the note editor at `/notes/:id`, pre-populated with the fetched note's title, content, and tags. Unauthenticated users SHALL be redirected to `/login`.

#### Scenario: Authenticated user navigates to /notes/:id for an existing note
- **WHEN** an authenticated user navigates to `/notes/:id` for a note they own
- **THEN** the system SHALL fetch the note via `GET /notes/:id` and render the editor with the note's title, TipTap-parsed content, and selected tags

#### Scenario: Unauthenticated user navigates to /notes/:id
- **WHEN** an unauthenticated user navigates to `/notes/:id`
- **THEN** the system SHALL redirect to `/login`

---

### Requirement: Note editor shows loading state while fetching
The system SHALL display a loading skeleton while the `GET /notes/:id` request is in-flight when editing an existing note.

#### Scenario: Loading skeleton shown during note fetch
- **WHEN** the user navigates to `/notes/:id` and the API request has not completed
- **THEN** the system SHALL render a loading skeleton in place of the editor content

---

### Requirement: Note editor shows error state on failed note fetch
The system SHALL display an error state when `GET /notes/:id` returns a non-2xx response (including 404 and 403/401 after token refresh fails).

#### Scenario: Note not found
- **WHEN** `GET /notes/:id` returns HTTP 404
- **THEN** the system SHALL display an error message indicating the note was not found

#### Scenario: Unauthorized access
- **WHEN** `GET /notes/:id` returns HTTP 401 after token refresh fails
- **THEN** the system SHALL log out the user and redirect to `/login`

#### Scenario: Generic fetch error
- **WHEN** `GET /notes/:id` returns a non-401, non-404 error
- **THEN** the system SHALL display a generic error message with a retry action

---

### Requirement: User can edit the note title
The system SHALL provide a plain-text title input field. The title SHALL accept 1–500 characters. Changes to the title SHALL be reflected in the dirty state and trigger autosave.

#### Scenario: User types a title
- **WHEN** the user types in the title input
- **THEN** the title value SHALL update and the note SHALL be marked dirty

#### Scenario: Empty title prevents save
- **WHEN** the user clears the title and attempts to save (manual or autosave)
- **THEN** the system SHALL NOT call the API and SHALL display a validation error on the title field

---

### Requirement: User can edit note content with TipTap rich text editor
The system SHALL render a TipTap editor for the note body. The editor SHALL support bold, italic, headings, bullet lists, and ordered lists at minimum. Content SHALL be stored internally as TipTap JSON. The editor container SHALL display a single border at all times. On focus, the border color SHALL change to indicate active state; no additional ring or outline overlay SHALL be applied. The editor height SHALL grow with content without producing expanding border artifacts.

#### Scenario: User types in the editor
- **WHEN** the user types in the TipTap editor
- **THEN** the content SHALL update and the note SHALL be marked dirty

#### Scenario: Existing note content loads correctly
- **WHEN** the editor initialises with a note whose `content` is a serialised TipTap JSON string
- **THEN** the TipTap editor SHALL render the document correctly

#### Scenario: Editor displays a single border in resting state
- **WHEN** the TipTap editor is rendered and not focused
- **THEN** the editor container SHALL display exactly one border with no additional ring or outline

#### Scenario: Editor focus state uses border-color change only
- **WHEN** the user clicks into or tabs to the TipTap editor
- **THEN** the border color SHALL change to indicate focus and no additional ring overlay SHALL appear outside the border

#### Scenario: Editor height grows without border artifacts
- **WHEN** the user types content that exceeds the initial editor height
- **THEN** the editor container SHALL expand vertically with the content and the border SHALL remain a single consistent line at the container edge

---

### Requirement: User can select tags on the note
The system SHALL provide a tag multi-select control in the editor. The available tags SHALL be fetched from `GET /tags`. Selected tag IDs SHALL be included in the save payload.

#### Scenario: User adds a tag
- **WHEN** the user selects a tag in the tag selector
- **THEN** the tag SHALL appear as selected and the note SHALL be marked dirty

#### Scenario: User removes a tag
- **WHEN** the user removes a previously selected tag
- **THEN** the tag SHALL be deselected and the note SHALL be marked dirty

#### Scenario: Tag selector disabled when tags fail to load
- **WHEN** `GET /tags` returns an error
- **THEN** the tag selector SHALL be rendered in a disabled state

---

### Requirement: Note autosaves after a period of inactivity
The system SHALL automatically save the note after 1 000 ms of inactivity following a change. Autosave SHALL only trigger when the note is dirty (title, content, or tags have changed since the last save). Autosave SHALL NOT fire when there are no unsaved changes.

#### Scenario: Autosave triggers after inactivity
- **WHEN** the user stops typing for 1 000 ms and the note is dirty
- **THEN** the system SHALL call `PATCH /notes/:id` (or `POST /notes` if creating) with the current title, content, and tagIds

#### Scenario: Autosave skipped when note is clean
- **WHEN** 1 000 ms elapses and no changes have been made since the last save
- **THEN** the system SHALL NOT call the API

#### Scenario: Autosave timer resets on each change
- **WHEN** the user continues typing within 1 000 ms of the previous keystroke
- **THEN** the autosave timer SHALL reset and not fire until 1 000 ms after the last keystroke

---

### Requirement: User can manually save the note
The system SHALL provide a Save button, a Share button, and a **History** button in the editor toolbar. The Save button SHALL immediately persist the note regardless of the autosave timer state. The Share button SHALL be visible only when editing an existing note (`id` is defined) and SHALL open the share modal on click. The **History** button SHALL be visible only when editing an existing note (`id` is defined) and SHALL open the version history drawer on click. The Save button SHALL be disabled while a save is already in-flight.

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

#### Scenario: History button visible in edit mode
- **WHEN** the user is editing an existing note (`/notes/:id`)
- **THEN** a History button SHALL be rendered in the toolbar alongside the Save and Share buttons

#### Scenario: History button not visible on new note
- **WHEN** the user is creating a new note (`/notes/new`)
- **THEN** the History button SHALL NOT be rendered

#### Scenario: History button opens version history drawer
- **WHEN** the user clicks the History button
- **THEN** the version history drawer SHALL open

---

### Requirement: Save status is displayed to the user
The system SHALL show a save status indicator with one of three states: Saving (in-flight), Saved (last save succeeded), or Error (last save failed). The indicator SHALL update reactively as save state changes.

#### Scenario: Saving state shown during in-flight save
- **WHEN** a save mutation is in-flight
- **THEN** the system SHALL display "Saving" in the status indicator

#### Scenario: Saved state shown after successful save
- **WHEN** a save mutation completes successfully
- **THEN** the system SHALL display "Saved" in the status indicator

#### Scenario: Error state shown after failed save
- **WHEN** a save mutation returns an error
- **THEN** the system SHALL display "Error" (or an error message) in the status indicator

---

### Requirement: Creating a new note navigates to the edit route on first save
The system SHALL, upon the first successful save of a new note (via `POST /notes`), navigate the browser to `/notes/:id` using the ID returned by the API. Subsequent saves on that URL SHALL use `PATCH /notes/:id`.

#### Scenario: New note saved for the first time
- **WHEN** a user saves a new note and `POST /notes` returns HTTP 201
- **THEN** the system SHALL navigate to `/notes/<returned-id>` and subsequent saves SHALL use `PATCH /notes/<returned-id>`

---

### Requirement: Shared Zod schema for note editor form lives in packages/shared
The `packages/shared` package SHALL export a `noteEditorFormSchema` Zod schema with fields `title` (string, 1–500 chars), `content` (string), and `tagIds` (optional array of strings). This schema SHALL be the single source of truth for client-side form validation.

#### Scenario: noteEditorFormSchema rejects empty title
- **WHEN** `noteEditorFormSchema.safeParse({ title: '', content: '{}', tagIds: [] })` is called
- **THEN** the result SHALL have `success: false` with a validation error on the `title` field

#### Scenario: noteEditorFormSchema accepts valid input
- **WHEN** `noteEditorFormSchema.safeParse({ title: 'My Note', content: '{}' })` is called
- **THEN** the result SHALL have `success: true`
