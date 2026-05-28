## ADDED Requirements

### Requirement: Authenticated user can create a tag
The system SHALL allow an authenticated user to create a tag by sending `name` (required, 1–50 chars, trimmed) and optional `color` (string, defaults to `"#6B7280"`). The tag SHALL be scoped to the requesting user. Tag names SHALL be unique per user (case-insensitive after trimming). The response SHALL return the created tag inside `{ success: true, data: tag }`.

#### Scenario: Successful tag creation with name only
- **WHEN** an authenticated user sends `POST /tags` with `{ "name": "Work" }`
- **THEN** the system SHALL return HTTP 201 with `{ success: true, data: { id, userId, name: "Work", color: "#6B7280", createdAt, updatedAt } }`

#### Scenario: Successful tag creation with name and color
- **WHEN** an authenticated user sends `POST /tags` with `{ "name": "Personal", "color": "#3B82F6" }`
- **THEN** the system SHALL return HTTP 201 with `{ success: true, data: { id, userId, name: "Personal", color: "#3B82F6", createdAt, updatedAt } }`

#### Scenario: Duplicate tag name for the same user is rejected
- **WHEN** an authenticated user who already has a tag named "Work" sends `POST /tags` with `{ "name": "work" }`
- **THEN** the system SHALL return HTTP 409 with `{ success: false, error: "Tag name already exists" }`

#### Scenario: Tag creation with missing name
- **WHEN** an authenticated user sends `POST /tags` with `{ "color": "#FF0000" }` and no `name`
- **THEN** the system SHALL return HTTP 400 with `{ success: false, error: "Name is required" }`

#### Scenario: Tag creation without authentication
- **WHEN** a request is sent to `POST /tags` without a valid JWT
- **THEN** the system SHALL return HTTP 401

---

### Requirement: Authenticated user can list all their tags with note counts
The system SHALL allow an authenticated user to retrieve all their tags. Each tag in the response SHALL include a `noteCount` field reflecting the number of note-tag associations. The response SHALL be ordered by `createdAt` ascending.

#### Scenario: List tags for user with tags
- **WHEN** an authenticated user sends `GET /tags` and has two tags, one associated with 3 notes and one with 0
- **THEN** the system SHALL return HTTP 200 with `{ success: true, data: [{ id, userId, name, color, noteCount: 3, createdAt, updatedAt }, { ..., noteCount: 0 }] }`

#### Scenario: List tags for user with no tags
- **WHEN** an authenticated user sends `GET /tags` and has no tags
- **THEN** the system SHALL return HTTP 200 with `{ success: true, data: [] }`

#### Scenario: Tags from other users are not returned
- **WHEN** user A sends `GET /tags`
- **THEN** the system SHALL return only user A's tags, never user B's tags

#### Scenario: List tags without authentication
- **WHEN** a request is sent to `GET /tags` without a valid JWT
- **THEN** the system SHALL return HTTP 401

---

### Requirement: Authenticated user can update their tag
The system SHALL allow an authenticated user to update the `name` and/or `color` of a tag they own. All fields are optional (PATCH semantics). Renaming to a name that already exists for the same user SHALL be rejected. The response SHALL return the updated tag.

#### Scenario: Successful tag rename
- **WHEN** an authenticated user sends `PATCH /tags/:id` with `{ "name": "Renamed" }` for a tag they own
- **THEN** the system SHALL return HTTP 200 with `{ success: true, data: { id, userId, name: "Renamed", color, createdAt, updatedAt } }`

#### Scenario: Successful tag recolor
- **WHEN** an authenticated user sends `PATCH /tags/:id` with `{ "color": "#EF4444" }` for a tag they own
- **THEN** the system SHALL return HTTP 200 with `{ success: true, data: { id, userId, name, color: "#EF4444", createdAt, updatedAt } }`

#### Scenario: Rename to duplicate name is rejected
- **WHEN** an authenticated user who has tags "Work" and "Personal" sends `PATCH /tags/:id` for "Work" with `{ "name": "personal" }`
- **THEN** the system SHALL return HTTP 409 with `{ success: false, error: "Tag name already exists" }`

#### Scenario: Update of non-existent or unowned tag
- **WHEN** an authenticated user sends `PATCH /tags/:id` for a tag that does not exist or belongs to another user
- **THEN** the system SHALL return HTTP 404 with `{ success: false, error: "Tag not found" }`

#### Scenario: Update without authentication
- **WHEN** a request is sent to `PATCH /tags/:id` without a valid JWT
- **THEN** the system SHALL return HTTP 401

---

### Requirement: Authenticated user can delete their tag
The system SHALL allow an authenticated user to hard-delete a tag they own. All `NoteTag` rows referencing the deleted tag SHALL be removed atomically. The response SHALL be HTTP 204 No Content.

#### Scenario: Successful tag deletion
- **WHEN** an authenticated user sends `DELETE /tags/:id` for a tag they own
- **THEN** the system SHALL return HTTP 204 and the tag SHALL no longer exist in the database

#### Scenario: Tag deletion removes note associations
- **WHEN** an authenticated user deletes a tag that is associated with 2 notes
- **THEN** those 2 notes SHALL no longer have that tag in their `tags` array when fetched via `GET /notes/:id`

#### Scenario: Delete of non-existent or unowned tag
- **WHEN** an authenticated user sends `DELETE /tags/:id` for a tag that does not exist or belongs to another user
- **THEN** the system SHALL return HTTP 404 with `{ success: false, error: "Tag not found" }`

#### Scenario: Delete without authentication
- **WHEN** a request is sent to `DELETE /tags/:id` without a valid JWT
- **THEN** the system SHALL return HTTP 401

---

### Requirement: Shared Zod schemas for tags live in packages/shared
The `packages/shared` package SHALL export `createTagSchema`, `updateTagSchema`, and `tagResponseSchema`. `createTagSchema` SHALL validate `name` (string, 1–50 chars, trimmed) and optional `color` (string). `updateTagSchema` SHALL make all fields optional. `tagResponseSchema` SHALL include `id`, `userId`, `name`, `color`, `noteCount`, `createdAt`, and `updatedAt`. These schemas SHALL be the single source of truth consumed by both backend and (future) frontend.

#### Scenario: createTagSchema rejects missing name
- **WHEN** `createTagSchema.safeParse({ color: "#FF0000" })` is called
- **THEN** the result SHALL have `success: false` with an error on the `name` field

#### Scenario: createTagSchema trims name whitespace
- **WHEN** `createTagSchema.safeParse({ name: "  Work  " })` is called
- **THEN** the result SHALL have `success: true` and `data.name` SHALL equal `"Work"`

#### Scenario: tagResponseSchema includes noteCount field
- **WHEN** `tagResponseSchema` is parsed with a valid tag object containing `noteCount: 5`
- **THEN** the result SHALL have `success: true`

---

### Requirement: Tag model has unique constraint on (userId, name)
The Prisma `Tag` model SHALL define `@@unique([userId, name])` ensuring no two tags with the same user and name (after trimming) can exist at the database level.

#### Scenario: Prisma schema validates Tag unique constraint
- **WHEN** a developer runs `pnpm --filter backend prisma validate`
- **THEN** Prisma SHALL report no errors in the Tag model definition

#### Scenario: Migration applies unique constraint successfully
- **WHEN** a developer runs `pnpm --filter backend prisma migrate dev --name add-tag-unique-user-name`
- **THEN** the migration SHALL succeed and the `tags` table SHALL have a unique index on `(userId, name)`
