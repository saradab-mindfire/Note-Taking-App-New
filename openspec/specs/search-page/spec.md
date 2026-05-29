## ADDED Requirements

### Requirement: Authenticated user can navigate to the search page
The system SHALL provide a `/search` route that is accessible only to authenticated users. Unauthenticated users SHALL be redirected to `/login`. The route SHALL accept `q`, `page`, and `limit` URL query parameters.

#### Scenario: Authenticated user visits /search
- **WHEN** an authenticated user navigates to `/search`
- **THEN** the system SHALL render the search page with an empty search input and no results

#### Scenario: Unauthenticated user visits /search
- **WHEN** a user who is not authenticated navigates to `/search`
- **THEN** the system SHALL redirect the user to `/login`

---

### Requirement: Search input is debounced and updates the URL query param
The system SHALL render a text input on the search page. As the user types, the `q` URL query parameter SHALL be updated after a 300 ms debounce. The input SHALL reflect the current value of `q` on initial load. Clearing the input SHALL set `q` to empty and stop any pending API call.

#### Scenario: User types a query
- **WHEN** an authenticated user types "typescript" into the search input
- **THEN** after 300 ms the URL SHALL contain `?q=typescript` and the search API SHALL be called with `q=typescript`

#### Scenario: User clears the input
- **WHEN** an authenticated user clears the search input
- **THEN** no API call SHALL be made and any existing results SHALL be cleared

#### Scenario: Page loads with existing q param
- **WHEN** an authenticated user navigates to `/search?q=typescript`
- **THEN** the search input SHALL display "typescript" and the search API SHALL be called immediately

---

### Requirement: Search results are displayed with title and highlighted snippet
The system SHALL display a list of search result items. Each item SHALL show the note title and the highlighted content snippet returned by the API. Keywords matched in the snippet SHALL be visually emphasised (bold). Clicking a result item SHALL navigate to `/notes/:id` for that note.

#### Scenario: Results returned for a query
- **WHEN** the search API returns results for query "graphql"
- **THEN** each result SHALL display the note title and a snippet with matched keywords visually distinguished

#### Scenario: Clicking a result navigates to note
- **WHEN** an authenticated user clicks a search result item
- **THEN** the system SHALL navigate to `/notes/<note-id>`

---

### Requirement: Pagination controls update the page URL param
The system SHALL display Previous and Next buttons when results span multiple pages. Clicking Previous SHALL decrement `page` by 1 and clicking Next SHALL increment it. The Previous button SHALL be disabled on page 1. The Next button SHALL be disabled when the current page is the last page (`page * limit >= total`). Changing the page SHALL preserve the current `q` param. Changing the query SHALL reset `page` to 1.

#### Scenario: Next button advances the page
- **WHEN** an authenticated user is on page 1 of results and clicks Next
- **THEN** the URL SHALL contain `page=2` and the API SHALL be called with `page=2`

#### Scenario: Previous button is disabled on page 1
- **WHEN** an authenticated user is on page 1
- **THEN** the Previous button SHALL be rendered in a disabled state

#### Scenario: Next button is disabled on the last page
- **WHEN** `total=15`, `limit=20`, and `page=1`
- **THEN** the Next button SHALL be rendered in a disabled state

#### Scenario: Query change resets to page 1
- **WHEN** an authenticated user is on page 3 and changes the search query
- **THEN** the URL SHALL update to `page=1` and the API SHALL be called with `page=1`

---

### Requirement: Loading state is shown while search is in progress
The system SHALL display a loading skeleton or spinner while the search API call is in flight. The loading state SHALL replace the results area and SHALL not be shown when no query is active.

#### Scenario: Loading state shown during query
- **WHEN** the search API call is in progress for a non-empty query
- **THEN** the system SHALL render a loading indicator in the results area

---

### Requirement: Empty state is shown when no results match
The system SHALL display an empty state message when the API returns zero results for a non-empty query. The empty state SHALL clearly communicate that no notes were found for the given query.

#### Scenario: No results for query
- **WHEN** the search API returns `results: []` for query "nonexistentterm"
- **THEN** the system SHALL display an empty state indicating no notes were found

---

### Requirement: Error state is shown when the search API fails
The system SHALL display an error message when the search API call fails (network error, 5xx, or 401). A 401 response SHALL redirect to `/login`. Other errors SHALL show an inline error message in the results area.

#### Scenario: API returns a 5xx error
- **WHEN** the search API returns a 500 error
- **THEN** the system SHALL display an error message in the results area without crashing

#### Scenario: API returns 401
- **WHEN** the search API returns 401 (e.g. expired token)
- **THEN** the system SHALL redirect the user to `/login`

---

### Requirement: Search state is preserved in the URL
The system SHALL use `q`, `page`, and `limit` URL query parameters as the single source of truth for search state. Browser back/forward navigation SHALL restore the corresponding search state and re-execute the search.

#### Scenario: Browser back restores previous query
- **WHEN** an authenticated user searches for "react", navigates to a note, then presses browser back
- **THEN** the search page SHALL display with `q=react` and show the previous results
