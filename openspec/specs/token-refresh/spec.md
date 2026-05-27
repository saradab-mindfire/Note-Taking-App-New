### Requirement: Client can exchange a valid refresh token for a new access token
The system SHALL accept a `POST /api/auth/refresh` request containing a refresh token. If the token is a valid, unexpired JWT signed with `JWT_REFRESH_SECRET` and exists in the `refresh_tokens` table without being revoked, the system SHALL issue and return a new JWT access token (15-minute expiry). The refresh token itself is NOT rotated in this iteration.

#### Scenario: Successful token refresh
- **WHEN** a `POST /api/auth/refresh` request is made with a valid, non-revoked refresh token that has not expired
- **THEN** the system returns HTTP 200 with `{ success: true, data: { accessToken } }`

#### Scenario: New access token has correct expiry
- **WHEN** a new access token is issued via refresh
- **THEN** the `exp` claim in the token SHALL be approximately 15 minutes from the time of issuance

### Requirement: Expired refresh token is rejected
The system SHALL reject refresh tokens whose `exp` claim has passed.

#### Scenario: Expired refresh token
- **WHEN** a `POST /api/auth/refresh` request is made with a refresh token whose JWT `exp` has passed
- **THEN** the system returns HTTP 401 with `{ success: false, error: "Refresh token expired or invalid" }`

### Requirement: Revoked refresh token is rejected
The system SHALL reject refresh tokens that are marked as revoked in the `refresh_tokens` table, even if the JWT signature and expiry are still valid.

#### Scenario: Revoked refresh token
- **WHEN** a `POST /api/auth/refresh` request is made with a token that has been revoked (e.g., after logout)
- **THEN** the system returns HTTP 401 with `{ success: false, error: "Refresh token expired or invalid" }`

### Requirement: Malformed or tampered refresh token is rejected
The system SHALL reject any refresh token that fails JWT signature verification.

#### Scenario: Invalid signature
- **WHEN** a `POST /api/auth/refresh` request is made with a token signed with a different secret or a tampered payload
- **THEN** the system returns HTTP 401 with `{ success: false, error: "Refresh token expired or invalid" }`

#### Scenario: Missing refresh token
- **WHEN** a `POST /api/auth/refresh` request is made without a `refreshToken` field in the body
- **THEN** the system returns HTTP 400 with `{ success: false, error: <validation message> }`
