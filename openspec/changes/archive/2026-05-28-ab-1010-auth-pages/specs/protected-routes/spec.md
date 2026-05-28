## ADDED Requirements

### Requirement: Protected routes redirect unauthenticated users to login
The system SHALL provide a `<ProtectedRoute>` component that renders its children when the user is authenticated and redirects to `/login` when they are not. While `isAuthLoading` is true, it SHALL show a loading spinner rather than redirecting.

#### Scenario: Unauthenticated user is redirected to login
- **WHEN** an unauthenticated user (no access token) navigates to a protected route
- **THEN** they are redirected to `/login` with `state.from` set to the attempted path

#### Scenario: Authenticated user can access protected route
- **WHEN** a user with a valid access token navigates to a protected route
- **THEN** the route renders normally

#### Scenario: Loading state shows spinner, not redirect
- **WHEN** `isAuthLoading` is true (silent refresh in progress) and a user navigates to a protected route
- **THEN** a loading spinner is shown and no redirect occurs until the auth check completes

### Requirement: Auth routes redirect authenticated users away from auth pages
The system SHALL provide an `<AuthRoute>` component that renders auth pages (login, register, forgot-password, reset-password) for unauthenticated users and redirects authenticated users to `/`.

#### Scenario: Authenticated user visiting login is redirected
- **WHEN** a user with a valid access token navigates to `/login`
- **THEN** they are redirected to `/`

#### Scenario: Unauthenticated user can access auth pages
- **WHEN** an unauthenticated user navigates to `/login`, `/register`, `/forgot-password`, or `/reset-password`
- **THEN** the page renders normally

#### Scenario: Auth loading state shows spinner on auth pages
- **WHEN** `isAuthLoading` is true and a user navigates to an auth page
- **THEN** a loading spinner is shown and no redirect occurs until the auth check completes

### Requirement: Post-login redirect sends user to their intended destination
The system SHALL redirect a user to the path stored in `state.from` after successful login if that state is present, falling back to `/` otherwise.

#### Scenario: User is redirected to originally-intended path after login
- **WHEN** a user was redirected to `/login` from a protected route at path `/notes` and then logs in successfully
- **THEN** they are redirected to `/notes`

#### Scenario: User with no prior path is redirected to root after login
- **WHEN** a user visits `/login` directly (no `state.from`) and logs in successfully
- **THEN** they are redirected to `/`
