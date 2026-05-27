### Requirement: User can register with email and password
The system SHALL allow a new user to create an account by providing a valid email address and a password. The email SHALL be stored in lowercase. The password SHALL be hashed with bcrypt (salt rounds ≥ 12) before persisting. The system SHALL return a `201 Created` response with the created user's `id` and `email` (no password hash).

#### Scenario: Successful registration
- **WHEN** a `POST /api/auth/register` request is made with a valid, unique email and a password of at least 8 characters
- **THEN** the system creates a `User` record, returns HTTP 201 with `{ success: true, data: { id, email } }`

#### Scenario: Password is not returned in response
- **WHEN** registration succeeds
- **THEN** the response body SHALL NOT include the `passwordHash` field

### Requirement: Duplicate email registration is rejected
The system SHALL reject registration attempts where the provided email already exists in the `users` table, regardless of case.

#### Scenario: Duplicate email
- **WHEN** a `POST /api/auth/register` request is made with an email that already exists
- **THEN** the system returns HTTP 409 with `{ success: false, error: "Email already in use" }`

### Requirement: Invalid registration input is rejected
The system SHALL validate all registration payloads against the `RegisterSchema` Zod schema defined in `packages/shared`. Any payload that fails validation SHALL be rejected before hitting business logic.

#### Scenario: Missing email field
- **WHEN** a `POST /api/auth/register` request is made without an `email` field
- **THEN** the system returns HTTP 400 with `{ success: false, error: <validation message> }`

#### Scenario: Invalid email format
- **WHEN** a `POST /api/auth/register` request is made with a malformed email (e.g., `"notanemail"`)
- **THEN** the system returns HTTP 400 with `{ success: false, error: <validation message> }`

#### Scenario: Password too short
- **WHEN** a `POST /api/auth/register` request is made with a password shorter than 8 characters
- **THEN** the system returns HTTP 400 with `{ success: false, error: <validation message> }`
