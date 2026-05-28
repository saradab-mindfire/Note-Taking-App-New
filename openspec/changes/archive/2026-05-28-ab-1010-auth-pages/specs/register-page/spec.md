## ADDED Requirements

### Requirement: Register page renders a registration form
The system SHALL render a registration page at route `/register` containing an email input, a password input, a confirm-password input, a submit button, and a link to `/login`.

#### Scenario: Register page is accessible
- **WHEN** an unauthenticated user navigates to `/register`
- **THEN** the page renders with email input, password input, confirm-password input, and a "Create account" submit button

#### Scenario: Login link is present
- **WHEN** the register page is rendered
- **THEN** a navigation link to `/login` SHALL be visible

### Requirement: Register form validates input before submission
The system SHALL validate email and password using `RegisterSchema` from `packages/shared`, and additionally enforce that the confirm-password field matches the password field, before calling the API.

#### Scenario: Invalid email format shows error
- **WHEN** the user submits the register form with a malformed email
- **THEN** an error message is shown beneath the email input and no API call is made

#### Scenario: Password too short shows error
- **WHEN** the user submits the register form with a password shorter than 8 characters
- **THEN** an error message "Password must be at least 8 characters" is shown beneath the password input and no API call is made

#### Scenario: Password mismatch shows error
- **WHEN** the user submits the register form with a confirm-password that does not match the password
- **THEN** an error message "Passwords do not match" is shown beneath the confirm-password input and no API call is made

### Requirement: Successful registration redirects to the login page
The system SHALL call `POST /api/auth/register` and, on HTTP 201, show a success message and redirect to `/login`.

#### Scenario: Successful registration redirects to login
- **WHEN** the user submits a valid registration form and the API returns HTTP 201
- **THEN** the user is redirected to `/login` with a success message "Account created. Please sign in."

### Requirement: Duplicate email displays an error
The system SHALL display an error message when the API returns HTTP 409.

#### Scenario: Duplicate email error
- **WHEN** the user submits a registration form with an email that is already registered and the API returns HTTP 409
- **THEN** an error banner "An account with this email already exists." is shown and the user remains on `/register`

### Requirement: Register form shows a loading state while the request is in flight
The system SHALL disable the submit button and display a loading indicator while the registration API call is pending.

#### Scenario: Submit button is disabled during request
- **WHEN** the user has submitted the form and the API call is pending
- **THEN** the submit button is disabled and a loading indicator is visible

### Requirement: Authenticated users are redirected away from the register page
The system SHALL redirect users who already have a valid access token away from `/register` to `/`.

#### Scenario: Already authenticated user visits register
- **WHEN** a user with a valid access token navigates to `/register`
- **THEN** they are redirected to `/`
