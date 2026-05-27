## ADDED Requirements

### Requirement: Prisma schema defines the users table
The Prisma schema SHALL define a `User` model with fields: `id` (cuid), `email` (unique String), `passwordHash` (String), `createdAt` (DateTime, default now), `updatedAt` (DateTime, auto-updated). It SHALL have a one-to-many relation to `Note`, `RefreshToken`, `Tag`, and `SharedLink`.

#### Scenario: User model compiles in Prisma schema
- **WHEN** a developer runs `pnpm --filter backend prisma validate`
- **THEN** Prisma SHALL report no errors in the User model definition

### Requirement: Prisma schema defines the refresh_tokens table
The Prisma schema SHALL define a `RefreshToken` model with fields: `id` (cuid), `userId` (foreign key to User), `token` (unique String), `expiresAt` (DateTime), `revokedAt` (DateTime, optional).

#### Scenario: RefreshToken model compiles in Prisma schema
- **WHEN** a developer runs `pnpm --filter backend prisma validate`
- **THEN** Prisma SHALL report no errors in the RefreshToken model definition

### Requirement: Prisma schema defines the notes table with soft delete
The Prisma schema SHALL define a `Note` model with fields: `id` (cuid), `userId` (foreign key to User), `title` (String), `content` (String, mapped to `@db.Text`), `deletedAt` (DateTime, optional), `createdAt` (DateTime, default now), `updatedAt` (DateTime, auto-updated). It SHALL have relations to `NoteTag`, `SharedLink`, and `NoteVersion`.

#### Scenario: Note model includes deletedAt for soft delete
- **WHEN** a developer inspects the Prisma schema
- **THEN** the `Note` model SHALL contain a nullable `deletedAt DateTime?` field

#### Scenario: Note model compiles in Prisma schema
- **WHEN** a developer runs `pnpm --filter backend prisma validate`
- **THEN** Prisma SHALL report no errors in the Note model definition

### Requirement: Prisma schema defines the tags and note_tags tables
The Prisma schema SHALL define a `Tag` model with fields: `id` (cuid), `userId` (foreign key to User), `name` (String), `color` (String). It SHALL define a `NoteTag` join model with `noteId` and `tagId` as a composite primary key.

#### Scenario: Tag and NoteTag models compile in Prisma schema
- **WHEN** a developer runs `pnpm --filter backend prisma validate`
- **THEN** Prisma SHALL report no errors in the Tag and NoteTag model definitions

### Requirement: Prisma schema defines the shared_links table
The Prisma schema SHALL define a `SharedLink` model with fields: `id` (cuid), `noteId` (foreign key to Note), `token` (unique String), `expiresAt` (DateTime, optional), `revokedAt` (DateTime, optional), `viewCount` (Int, default 0).

#### Scenario: SharedLink model compiles in Prisma schema
- **WHEN** a developer runs `pnpm --filter backend prisma validate`
- **THEN** Prisma SHALL report no errors in the SharedLink model definition

### Requirement: Prisma schema defines the note_versions table
The Prisma schema SHALL define a `NoteVersion` model with fields: `id` (cuid), `noteId` (foreign key to Note), `title` (String), `content` (String, mapped to `@db.Text`), `createdAt` (DateTime, default now).

#### Scenario: NoteVersion model compiles in Prisma schema
- **WHEN** a developer runs `pnpm --filter backend prisma validate`
- **THEN** Prisma SHALL report no errors in the NoteVersion model definition

### Requirement: Initial Prisma migration can be applied to a fresh PostgreSQL database
The `apps/backend/prisma/` directory SHALL contain a `schema.prisma` with `provider = "postgresql"` and `datasource` pointing to `DATABASE_URL`. Running `prisma migrate dev --name init` on a fresh database SHALL succeed and create all seven tables.

#### Scenario: Migration creates all seven tables
- **WHEN** a developer runs `pnpm --filter backend prisma migrate dev --name init` against a clean PostgreSQL 16 database
- **THEN** all seven tables (users, refresh_tokens, notes, tags, note_tags, shared_links, note_versions) SHALL be present in the database

#### Scenario: Prisma client generates without errors
- **WHEN** a developer runs `pnpm --filter backend prisma generate`
- **THEN** the Prisma client SHALL be generated in `node_modules/.prisma/client` without errors

### Requirement: .env.example documents required environment variables
An `.env.example` file SHALL exist at the repo root and SHALL document all required environment variables, including at minimum `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET`.

#### Scenario: .env.example is present and non-empty
- **WHEN** a developer clones the repository
- **THEN** `.env.example` SHALL exist at the root and SHALL contain at minimum `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` as documented keys
