## ADDED Requirements

### Requirement: Auth store holds access token and user profile in memory
The system SHALL maintain a Zustand store with `accessToken` (string | null), `user` (id + email | null), and an `isAuthLoading` boolean. The access token SHALL never be persisted to localStorage or cookies.

#### Scenario: Initial state is unauthenticated
- **WHEN** the application first loads
- **THEN** `accessToken` is null, `user` is null, and `isAuthLoading` is true (pending silent refresh)

#### Scenario: Access token is stored after login
- **WHEN** a successful login response is received
- **THEN** `accessToken` is updated with the new token and `user` is updated with `{ id, email }`

### Requirement: Refresh token is persisted to localStorage
The system SHALL persist the refresh token to `localStorage` under the key `refresh_token` after a successful login or token refresh. The system SHALL remove it on logout.

#### Scenario: Refresh token is stored after login
- **WHEN** a successful login response is received
- **THEN** the refresh token is written to `localStorage['refresh_token']`

#### Scenario: Refresh token is cleared on logout
- **WHEN** the auth store `logout` action is called
- **THEN** `localStorage['refresh_token']` is removed

### Requirement: Silent token refresh on app initialization
The system SHALL attempt a token refresh using the stored refresh token when the app mounts. If the refresh succeeds, the store is populated with the new access token. If no refresh token exists or the refresh fails, the store transitions to an unauthenticated state.

#### Scenario: Successful silent refresh on mount
- **WHEN** the app mounts and `localStorage['refresh_token']` contains a valid refresh token
- **THEN** `POST /api/auth/refresh` is called, the new access token is stored, and `isAuthLoading` is set to false

#### Scenario: No refresh token on mount
- **WHEN** the app mounts and `localStorage['refresh_token']` is absent
- **THEN** no refresh call is made, `accessToken` remains null, and `isAuthLoading` is set to false

#### Scenario: Failed silent refresh clears auth state
- **WHEN** the app mounts, a refresh token exists, but `POST /api/auth/refresh` returns HTTP 401
- **THEN** the refresh token is removed from localStorage, `accessToken` and `user` are set to null, and `isAuthLoading` is set to false

### Requirement: Auth store logout action clears all auth state
The system SHALL provide a `logout` action on the Zustand store that sets `accessToken` and `user` to null and removes the refresh token from localStorage.

#### Scenario: Logout clears store
- **WHEN** the `logout` action is dispatched
- **THEN** `accessToken` is null and `user` is null

### Requirement: API client attaches access token to authorized requests
The system SHALL provide an `apiClient` utility that reads the current `accessToken` from the Zustand store and attaches it as `Authorization: Bearer <token>` on every outgoing request.

#### Scenario: Bearer token is attached to requests
- **WHEN** an API request is made via `apiClient` and `accessToken` is non-null in the store
- **THEN** the request includes the header `Authorization: Bearer <token>`

### Requirement: API client transparently refreshes the access token on 401 responses
The system SHALL intercept HTTP 401 responses from the API, attempt one silent token refresh, update the store with the new access token, and retry the original request. If the refresh also fails, the store is cleared and the user is redirected to `/login`.

#### Scenario: 401 triggers a refresh and retry
- **WHEN** an API call via `apiClient` receives HTTP 401 and a valid refresh token exists in localStorage
- **THEN** `POST /api/auth/refresh` is called, the new access token is stored, and the original request is retried with the updated token

#### Scenario: Refresh failure after 401 logs out the user
- **WHEN** an API call via `apiClient` receives HTTP 401 and the subsequent refresh call also fails
- **THEN** the auth state is cleared and the user is redirected to `/login`
