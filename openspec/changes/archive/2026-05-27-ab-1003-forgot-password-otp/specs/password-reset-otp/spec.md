## ADDED Requirements

### Requirement: User can reset their password using a valid OTP
The system SHALL accept a `POST /api/auth/reset-password` request with `email`, `otp`, and `newPassword`. If the OTP exists for that email, has not expired, and has not been used, the system SHALL hash the new password with bcrypt (salt rounds ≥ 12), update the user's `passwordHash`, mark the OTP as used (`usedAt = now`), and return HTTP 200 `{ success: true }`.

#### Scenario: Successful password reset
- **WHEN** a `POST /api/auth/reset-password` request is made with a valid email, a correct unexpired unused OTP, and a new password of at least 8 characters
- **THEN** the system updates the user's password hash and returns HTTP 200 with `{ success: true }`

#### Scenario: OTP is marked as used after successful reset
- **WHEN** a password reset succeeds
- **THEN** the `password_reset_otps` row for that email SHALL have `usedAt` set to the current UTC timestamp

#### Scenario: New password is stored as bcrypt hash
- **WHEN** a password reset succeeds
- **THEN** the user's `passwordHash` in the `users` table SHALL be the bcrypt hash of the submitted `newPassword`, not the plaintext value

### Requirement: Expired OTP is rejected
The system SHALL reject any OTP whose `expiresAt` timestamp is in the past, even if the code value is otherwise correct.

#### Scenario: Expired OTP
- **WHEN** a `POST /api/auth/reset-password` request is made with an OTP whose `expiresAt` has passed
- **THEN** the system returns HTTP 400 with `{ success: false, error: "OTP is invalid or has expired" }`

### Requirement: Invalid OTP is rejected
The system SHALL reject any OTP that does not match the stored code for the given email, or for which no record exists.

#### Scenario: Wrong OTP code
- **WHEN** a `POST /api/auth/reset-password` request is made with an incorrect OTP code for the given email
- **THEN** the system returns HTTP 400 with `{ success: false, error: "OTP is invalid or has expired" }`

#### Scenario: No OTP record for email
- **WHEN** a `POST /api/auth/reset-password` request is made for an email with no pending OTP
- **THEN** the system returns HTTP 400 with `{ success: false, error: "OTP is invalid or has expired" }`

### Requirement: Already-used OTP is rejected
The system SHALL reject an OTP that has already been consumed in a previous successful reset, even if it is not yet expired.

#### Scenario: Already-used OTP
- **WHEN** a `POST /api/auth/reset-password` request is made with an OTP whose `usedAt` is already set
- **THEN** the system returns HTTP 400 with `{ success: false, error: "OTP is invalid or has expired" }`

### Requirement: Invalid reset-password input is rejected
The system SHALL validate the request body against `ResetPasswordSchema` from `packages/shared`. Missing fields or a password shorter than 8 characters SHALL result in a 400 response.

#### Scenario: Missing otp field
- **WHEN** a `POST /api/auth/reset-password` request is made without an `otp` field
- **THEN** the system returns HTTP 400 with `{ success: false, error: <validation message> }`

#### Scenario: New password too short
- **WHEN** a `POST /api/auth/reset-password` request is made with a `newPassword` shorter than 8 characters
- **THEN** the system returns HTTP 400 with `{ success: false, error: <validation message> }`
