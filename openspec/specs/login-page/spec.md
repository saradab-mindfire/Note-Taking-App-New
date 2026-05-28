### Requirement: Login page renders an email/password form
The system SHALL render a login page at route `/login` containing an email input, a password input, a submit button, and a link to the `/register` page.

#### Scenario: Login page is accessible
- **WHEN** an unauthenticated user navigates to `/login`
- **THEN** the page renders with email input, password input, and a "Sign in" submit button

#### Scenario: Register link is present
- **WHEN** the login page is rendered
- **THEN** a navigation link to `/register` SHALL be visible

### Requirement: Login form validates input before submission
The system SHALL validate the form using `LoginSchema` from `packages/shared` and display inline field-level error messages for any violations before calling the API.

#### Scenario: Empty email shows error
- **WHEN** the user submits the login form with an empty email field
- **THEN** an error message is shown beneath the email input and no API call is made

#### Scenario: Invalid email format shows error
- **WHEN** the user submits the login form with a value that is not a valid email
- **THEN** an error message "Invalid email address" is shown beneath the email input and no API call is made

#### Scenario: Empty password shows error
- **WHEN** the user submits the login form with an empty password field
- **THEN** an error message is shown beneath the password input and no API call is made

### Requirement: Successful login redirects to the intended destination
The system SHALL call `POST /api/auth/login`, store the returned access token and refresh token in the auth store, and redirect the user to the route they originally attempted (or `/` if none).

#### Scenario: Successful login redirects
- **WHEN** the user submits valid credentials and the API returns HTTP 200
- **THEN** the access token is stored in the Zustand auth store, the refresh token is persisted to localStorage, and the user is redirected to the post-login destination

### Requirement: Invalid credentials display an error message
The system SHALL display a non-field error message when the API returns HTTP 401.

#### Scenario: Invalid credentials error
- **WHEN** the user submits credentials and the API returns HTTP 401
- **THEN** an error banner "Invalid email or password" is shown on the page and the user remains on `/login`

### Requirement: Login form shows a loading state while the request is in flight
The system SHALL disable the submit button and display a loading indicator while the login API call is pending.

#### Scenario: Submit button is disabled during request
- **WHEN** the user has submitted the form and the API call is pending
- **THEN** the submit button is disabled and a loading indicator is visible

### Requirement: Network errors are handled gracefully
The system SHALL display a generic error message when the login API call fails due to a network error or unexpected server error.

#### Scenario: Network failure shows error
- **WHEN** the login API call fails with a network error or HTTP 5xx response
- **THEN** an error banner "Something went wrong. Please try again." is shown

### Requirement: Authenticated users are redirected away from the login page
The system SHALL redirect users who already have a valid access token away from `/login` to `/`.

#### Scenario: Already authenticated user visits login
- **WHEN** a user with a valid access token navigates to `/login`
- **THEN** they are redirected to `/`
