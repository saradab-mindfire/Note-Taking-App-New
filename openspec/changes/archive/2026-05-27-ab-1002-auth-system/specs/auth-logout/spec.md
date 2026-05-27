## ADDED Requirements

### Requirement: User can log out by revoking their refresh token
The system SHALL accept a `POST /api/auth/logout` request containing the user's refresh token. If the token exists in the `refresh_tokens` table, the system SHALL set its `revokedAt` timestamp to the current UTC time. The system SHALL return HTTP 200 regardless of whether the token was already revoked, to prevent token probing.

#### Scenario: Successful logout
- **WHEN** a `POST /api/auth/logout` request is made with a refresh token that exists in the database
- **THEN** the system sets `revokedAt` on the matching `refresh_tokens` row and returns HTTP 200 with `{ success: true }`

#### Scenario: Already-revoked token logout is idempotent
- **WHEN** a `POST /api/auth/logout` request is made with a refresh token that is already revoked
- **THEN** the system returns HTTP 200 with `{ success: true }` (no error, idempotent)

### Requirement: Logout with a token not in the database returns success
The system SHALL return HTTP 200 even if the provided refresh token is not found in the `refresh_tokens` table. This prevents probing for valid token values.

#### Scenario: Unknown token logout
- **WHEN** a `POST /api/auth/logout` request is made with a refresh token value not present in the database
- **THEN** the system returns HTTP 200 with `{ success: true }`

### Requirement: Logout with missing refresh token is rejected
The system SHALL validate the logout payload; a missing `refreshToken` field SHALL result in a 400 error.

#### Scenario: Missing refresh token in logout request
- **WHEN** a `POST /api/auth/logout` request is made without a `refreshToken` field
- **THEN** the system returns HTTP 400 with `{ success: false, error: <validation message> }`
