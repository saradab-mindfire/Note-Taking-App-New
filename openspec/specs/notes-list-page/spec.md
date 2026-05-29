## ADDED Requirements

### Requirement: Authenticated user can access the notes list page
The system SHALL render the notes list page at `/notes`. Unauthenticated users SHALL be redirected to `/login`. The root path `/` SHALL redirect to `/notes`.

#### Scenario: Authenticated user navigates to /notes
- **WHEN** an authenticated user navigates to `/notes`
- **THEN** the system SHALL render the notes list page without redirecting

#### Scenario: Unauthenticated user navigates to /notes
- **WHEN** an unauthenticated user navigates to `/notes`
- **THEN** the system SHALL redirect to `/login`

#### Scenario: Root path redirects to notes
- **WHEN** an authenticated user navigates to `/`
- **THEN** the system SHALL redirect to `/notes`

---

### Requirement: Notes list page displays note cards
The system SHALL display each note as a card containing the note's `title`, associated `tags`, and `updatedAt` timestamp. Cards SHALL link to the note editor at `/notes/:id`. The list SHALL be fetched from `GET /notes` using the active filter state.

#### Scenario: Notes are rendered as cards
- **WHEN** the notes list page loads and the API returns notes
- **THEN** each note SHALL be displayed as a card showing its title, tags, and formatted updatedAt

#### Scenario: Note card links to editor
- **WHEN** the user clicks a note card
- **THEN** the system SHALL navigate to `/notes/:id` for that note

#### Scenario: Tags displayed on card
- **WHEN** a note has associated tags
- **THEN** each tag name SHALL be visible on the note card

#### Scenario: Note with no tags
- **WHEN** a note has no tags
- **THEN** the card SHALL render without a tags section or with an empty tags area

---

### Requirement: Notes list page shows loading state while fetching
The system SHALL display a loading skeleton or spinner while the notes API request is in-flight.

#### Scenario: Loading state shown on initial fetch
- **WHEN** the notes list page mounts and the API request has not completed
- **THEN** the system SHALL render a loading indicator in place of the note cards

---

### Requirement: Notes list page shows error state on API failure
The system SHALL display an error message when the `GET /notes` request fails for a reason other than 401.

#### Scenario: API error displayed to user
- **WHEN** the `GET /notes` request returns a non-401 error
- **THEN** the system SHALL display an error message and a retry action

#### Scenario: 401 response triggers logout and redirect
- **WHEN** the `GET /notes` request returns HTTP 401 after token refresh fails
- **THEN** the system SHALL log out the user and redirect to `/login`

---

### Requirement: Notes list page shows empty state when no notes exist
The system SHALL display an empty state message when the API returns an empty `notes` array.

#### Scenario: Empty state for user with no notes
- **WHEN** an authenticated user has no notes and navigates to `/notes`
- **THEN** the system SHALL display a message indicating no notes exist

#### Scenario: Empty state when filters match no notes
- **WHEN** active filters result in zero matching notes
- **THEN** the system SHALL display an empty state message rather than a blank list

---

### Requirement: User can sort the notes list
The system SHALL provide sort controls allowing the user to select `sortBy` (`createdAt`, `updatedAt`, `title`) and `sortOrder` (`asc`, `desc`). Changing a sort value SHALL reset pagination to page 1 and re-fetch the notes list.

#### Scenario: User changes sort field
- **WHEN** the user selects `title` from the sortBy control
- **THEN** the system SHALL update the filter store with `sortBy: 'title'`, reset `page` to 1, and re-fetch notes

#### Scenario: User changes sort order
- **WHEN** the user toggles sortOrder to `asc`
- **THEN** the system SHALL update the filter store with `sortOrder: 'asc'`, reset `page` to 1, and re-fetch notes

---

### Requirement: User can filter notes by tags
The system SHALL provide a tag multi-select control. Selecting tags SHALL update the active tag filter, reset pagination to page 1, and re-fetch the notes list with those tag IDs. The tag list for the control SHALL be loaded from `GET /tags`.

#### Scenario: User selects a tag filter
- **WHEN** the user selects a tag in the tag filter control
- **THEN** the system SHALL update the filter store with the selected tag ID, reset `page` to 1, and re-fetch notes

#### Scenario: User clears tag filter
- **WHEN** the user removes all selected tags
- **THEN** the system SHALL update the filter store with an empty tags array and re-fetch notes

#### Scenario: Tag filter disabled when tags fail to load
- **WHEN** `GET /tags` returns an error
- **THEN** the tag filter control SHALL be rendered in a disabled state

---

### Requirement: User can toggle display of soft-deleted notes
The system SHALL provide an `includeDeleted` toggle control. When enabled, the notes list SHALL include soft-deleted notes. Toggling SHALL reset pagination to page 1 and re-fetch.

#### Scenario: includeDeleted toggle off by default
- **WHEN** the notes list page first loads
- **THEN** the `includeDeleted` filter SHALL be `false` and soft-deleted notes SHALL not appear

#### Scenario: User enables includeDeleted toggle
- **WHEN** the user turns on the includeDeleted toggle
- **THEN** the system SHALL update the filter store with `includeDeleted: true`, reset `page` to 1, and re-fetch notes showing both active and deleted notes

---

### Requirement: User can paginate the notes list
The system SHALL provide pagination controls showing the current page and allowing navigation to previous/next pages. Controls SHALL be disabled when at the first or last page respectively. The total number of pages SHALL be derived from `total` and `limit` in the API response.

#### Scenario: Next page navigation
- **WHEN** the user clicks the next page control and the current page is not the last page
- **THEN** the system SHALL increment `page` in the filter store and re-fetch notes

#### Scenario: Previous page navigation
- **WHEN** the user clicks the previous page control and `page > 1`
- **THEN** the system SHALL decrement `page` in the filter store and re-fetch notes

#### Scenario: Previous page disabled on first page
- **WHEN** the current page is 1
- **THEN** the previous page control SHALL be disabled

#### Scenario: Next page disabled on last page
- **WHEN** the current page equals the total number of pages
- **THEN** the next page control SHALL be disabled

#### Scenario: Filter change resets to page 1
- **WHEN** the user changes any filter (sort, tags, includeDeleted)
- **THEN** the system SHALL reset `page` to 1 before re-fetching notes
