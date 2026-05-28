## ADDED Requirements

### Requirement: Forgot-password page renders an email form
The system SHALL render a forgot-password page at route `/forgot-password` containing an email input, a submit button, and a link back to `/login`.

#### Scenario: Forgot-password page is accessible
- **WHEN** an unauthenticated user navigates to `/forgot-password`
- **THEN** the page renders with an email input and a "Send reset code" submit button

#### Scenario: Back to login link is present
- **WHEN** the forgot-password page is rendered
- **THEN** a navigation link to `/login` SHALL be visible

### Requirement: Forgot-password form validates email before submission
The system SHALL validate the email using `ForgotPasswordSchema` from `packages/shared` and display an inline error for invalid input.

#### Scenario: Empty email shows error
- **WHEN** the user submits the form with an empty email field
- **THEN** an error message is shown beneath the email input and no API call is made

#### Scenario: Invalid email format shows error
- **WHEN** the user submits the form with a malformed email
- **THEN** an error message "Invalid email address" is shown beneath the email input and no API call is made

### Requirement: Successful submission shows a confirmation message and redirects to reset-password page
The system SHALL call `POST /api/auth/forgot-password` and, on HTTP 200, display a confirmation message and navigate to `/reset-password` passing the submitted email as state.

#### Scenario: Successful submission shows confirmation
- **WHEN** the user submits a valid email and the API returns HTTP 200
- **THEN** the user is redirected to `/reset-password` with the submitted email pre-populated

### Requirement: Forgot-password form shows a loading state while the request is in flight
The system SHALL disable the submit button and display a loading indicator while the API call is pending.

#### Scenario: Submit button is disabled during request
- **WHEN** the user has submitted the form and the API call is pending
- **THEN** the submit button is disabled and a loading indicator is visible

### Requirement: Network errors are handled gracefully
The system SHALL display a generic error when the forgot-password API call fails unexpectedly.

#### Scenario: Unexpected error shows message
- **WHEN** the API call fails with a network error or HTTP 5xx response
- **THEN** an error banner "Something went wrong. Please try again." is shown

### Requirement: Authenticated users are redirected away from the forgot-password page
The system SHALL redirect users who already have a valid access token away from `/forgot-password` to `/`.

#### Scenario: Already authenticated user visits forgot-password
- **WHEN** a user with a valid access token navigates to `/forgot-password`
- **THEN** they are redirected to `/`
