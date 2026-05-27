## ADDED Requirements

### Requirement: User can request a password reset using their email
The system SHALL accept a `POST /api/auth/forgot-password` request with an email address. If the email belongs to a registered user, the system SHALL generate a cryptographically random 6-digit numeric OTP, store it in the `password_reset_otps` table with a 15-minute expiry, and log it to the console. The system SHALL always return HTTP 200 `{ success: true }` regardless of whether the email is registered, to prevent user enumeration.

#### Scenario: Successful reset request for registered email
- **WHEN** a `POST /api/auth/forgot-password` request is made with an email that exists in the `users` table
- **THEN** the system generates a 6-digit OTP, stores it with `expiresAt = now + 15 minutes`, logs it to console, and returns HTTP 200 with `{ success: true }`

#### Scenario: Reset request for unknown email returns 200 (anti-enumeration)
- **WHEN** a `POST /api/auth/forgot-password` request is made with an email not in the `users` table
- **THEN** the system returns HTTP 200 with `{ success: true }` without creating any OTP record

#### Scenario: Re-request replaces existing unused OTP
- **WHEN** a `POST /api/auth/forgot-password` request is made for an email that already has an unused, unexpired OTP
- **THEN** the system replaces the existing OTP record with a new code and a fresh 15-minute expiry

### Requirement: OTP is a 6-digit numeric code
The system SHALL generate OTPs using a cryptographically secure random number generator. The OTP SHALL be exactly 6 decimal digits (100000–999999 inclusive).

#### Scenario: Generated OTP is 6 digits
- **WHEN** an OTP is generated for a reset request
- **THEN** the code SHALL be between 100000 and 999999 inclusive

### Requirement: Invalid forgot-password input is rejected
The system SHALL validate the request body against `ForgotPasswordSchema` from `packages/shared`. A missing or malformed email SHALL result in a 400 response.

#### Scenario: Missing email field
- **WHEN** a `POST /api/auth/forgot-password` request is made without an `email` field
- **THEN** the system returns HTTP 400 with `{ success: false, error: <validation message> }`

#### Scenario: Malformed email
- **WHEN** a `POST /api/auth/forgot-password` request is made with a value that is not a valid email address
- **THEN** the system returns HTTP 400 with `{ success: false, error: <validation message> }`
