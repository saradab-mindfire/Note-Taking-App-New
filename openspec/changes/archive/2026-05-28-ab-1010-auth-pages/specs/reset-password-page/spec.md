## ADDED Requirements

### Requirement: Reset-password page renders an OTP and new-password form
The system SHALL render a reset-password page at route `/reset-password` containing a read-only email field (pre-populated from navigation state), a 6-digit OTP input, a new-password input, a confirm-new-password input, and a submit button.

#### Scenario: Reset-password page is accessible with email state
- **WHEN** a user navigates to `/reset-password` with an email passed via React Router location state
- **THEN** the page renders with the email pre-populated (read-only), an OTP input, a new-password input, a confirm-new-password input, and a "Reset password" submit button

#### Scenario: Reset-password page redirects when email state is missing
- **WHEN** a user navigates directly to `/reset-password` without a prior forgot-password submission (no email in location state)
- **THEN** the user is redirected to `/forgot-password`

### Requirement: Reset-password form validates input before submission
The system SHALL validate `email`, `otp`, and `newPassword` using `ResetPasswordSchema` from `packages/shared`, and additionally enforce that confirm-new-password matches new-password.

#### Scenario: OTP not 6 digits shows error
- **WHEN** the user submits the form with an OTP that is not exactly 6 digits
- **THEN** an error message "OTP must be exactly 6 digits" is shown beneath the OTP input and no API call is made

#### Scenario: New password too short shows error
- **WHEN** the user submits the form with a new password shorter than 8 characters
- **THEN** an error message "Password must be at least 8 characters" is shown beneath the new-password input and no API call is made

#### Scenario: Password mismatch shows error
- **WHEN** the user submits the form with a confirm-new-password that does not match new-password
- **THEN** an error message "Passwords do not match" is shown beneath the confirm-new-password input and no API call is made

### Requirement: Successful reset redirects to login with a success message
The system SHALL call `POST /api/auth/reset-password` and, on HTTP 200, redirect the user to `/login` with a success message.

#### Scenario: Successful reset redirects to login
- **WHEN** the user submits a valid OTP and new password and the API returns HTTP 200
- **THEN** the user is redirected to `/login` with a message "Password reset successful. Please sign in."

### Requirement: Invalid or expired OTP displays an error
The system SHALL display an inline error when the API returns HTTP 400.

#### Scenario: Invalid OTP error
- **WHEN** the user submits an incorrect or expired OTP and the API returns HTTP 400
- **THEN** an error banner "OTP is invalid or has expired." is shown and the user remains on `/reset-password`

### Requirement: Reset-password form shows a loading state while the request is in flight
The system SHALL disable the submit button and display a loading indicator while the API call is pending.

#### Scenario: Submit button is disabled during request
- **WHEN** the user has submitted the form and the API call is pending
- **THEN** the submit button is disabled and a loading indicator is visible

### Requirement: Authenticated users are redirected away from the reset-password page
The system SHALL redirect users who already have a valid access token away from `/reset-password` to `/`.

#### Scenario: Already authenticated user visits reset-password
- **WHEN** a user with a valid access token navigates to `/reset-password`
- **THEN** they are redirected to `/`
