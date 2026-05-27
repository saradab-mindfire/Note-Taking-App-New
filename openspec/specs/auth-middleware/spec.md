### Requirement: Protected routes require a valid Bearer access token
The system SHALL provide an `authMiddleware` Express middleware that reads the `Authorization` header, validates the JWT access token using `JWT_SECRET`, and attaches the decoded user payload (`{ userId, email }`) to `req.user` before passing control to the next handler. This middleware SHALL be applied to all routes that require authentication.

#### Scenario: Valid access token grants access
- **WHEN** a request includes a valid, non-expired `Authorization: Bearer <accessToken>` header
- **THEN** `authMiddleware` populates `req.user` with `{ userId, email }` and calls `next()`

#### Scenario: req.user is available in downstream handlers
- **WHEN** a protected route handler is reached after `authMiddleware`
- **THEN** `req.user.userId` is the authenticated user's UUID and `req.user.email` is their email

### Requirement: Requests without Authorization header are rejected
The system SHALL reject requests to protected routes that do not include an `Authorization` header.

#### Scenario: Missing Authorization header
- **WHEN** a request to a protected route is made without an `Authorization` header
- **THEN** `authMiddleware` returns HTTP 401 with `{ success: false, error: "Unauthorized" }` without calling `next()`

### Requirement: Requests with expired access token are rejected
The system SHALL reject requests bearing an access token whose `exp` claim has passed.

#### Scenario: Expired access token
- **WHEN** a request is made with an `Authorization: Bearer` header containing an expired JWT
- **THEN** `authMiddleware` returns HTTP 401 with `{ success: false, error: "Unauthorized" }` without calling `next()`

### Requirement: Requests with malformed or tampered token are rejected
The system SHALL reject any access token that fails JWT signature verification or has a malformed structure.

#### Scenario: Tampered token payload
- **WHEN** a request is made with a token whose payload has been modified (invalid signature)
- **THEN** `authMiddleware` returns HTTP 401 with `{ success: false, error: "Unauthorized" }`

#### Scenario: Malformed Authorization header format
- **WHEN** a request is made with `Authorization: Token <value>` (wrong scheme) or `Authorization: Bearer` (missing token)
- **THEN** `authMiddleware` returns HTTP 401 with `{ success: false, error: "Unauthorized" }`
