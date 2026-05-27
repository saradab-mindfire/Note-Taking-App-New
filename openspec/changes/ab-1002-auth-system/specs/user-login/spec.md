## ADDED Requirements

### Requirement: User can log in with valid credentials
The system SHALL authenticate a user by verifying their email and bcrypt-hashed password. On success, the system SHALL issue a JWT access token (signed with `JWT_SECRET`, expiry 15 minutes) and a JWT refresh token (signed with `JWT_REFRESH_SECRET`, expiry 7 days). The refresh token SHALL be persisted to the `refresh_tokens` table linked to the user. The system SHALL return HTTP 200 with both tokens.

#### Scenario: Successful login
- **WHEN** a `POST /api/auth/login` request is made with a correct email and password
- **THEN** the system returns HTTP 200 with `{ success: true, data: { accessToken, refreshToken } }`

#### Scenario: Refresh token is persisted
- **WHEN** login succeeds
- **THEN** a new row is inserted into `refresh_tokens` containing the token value, `userId`, and `expiresAt` (now + 7 days)

### Requirement: Login with incorrect password is rejected
The system SHALL return a generic `401 Unauthorized` error when the password does not match the stored hash. The error message SHALL NOT distinguish between "user not found" and "wrong password" to prevent user enumeration.

#### Scenario: Wrong password
- **WHEN** a `POST /api/auth/login` request is made with a valid email but incorrect password
- **THEN** the system returns HTTP 401 with `{ success: false, error: "Invalid credentials" }`

### Requirement: Login with unknown email is rejected
The system SHALL return the same generic `401 Unauthorized` error when no user exists with the given email, identical to the wrong-password response.

#### Scenario: Non-existent email
- **WHEN** a `POST /api/auth/login` request is made with an email not in the database
- **THEN** the system returns HTTP 401 with `{ success: false, error: "Invalid credentials" }`

### Requirement: Invalid login input is rejected
The system SHALL validate all login payloads against the `LoginSchema` Zod schema from `packages/shared`.

#### Scenario: Missing password field
- **WHEN** a `POST /api/auth/login` request is made without a `password` field
- **THEN** the system returns HTTP 400 with `{ success: false, error: <validation message> }`
