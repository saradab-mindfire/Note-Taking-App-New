## Why

The application currently supports user authentication but has no way for users to create or manage notes — the core product functionality. Implementing Notes CRUD establishes the foundational data layer (notes, tags, note_tags tables) and the REST API surface that all future note features (search, sharing, versioning) will build on.

## What Changes

- New `notes` table with title, rich-text content, soft delete (`deletedAt`), and user ownership
- New `tags` and `note_tags` tables for tagging support
- Six REST endpoints: create, get by id, list all, update, soft-delete, and restore
- Shared Zod schemas and TypeScript types for note payloads in `packages/shared`
- Prisma migration and model definitions for all three new tables
- Route/controller/service layer in the backend for the `/notes` resource

## Capabilities

### New Capabilities

- `notes-crud`: Create, read, update, soft-delete, and restore notes belonging to the authenticated user; rich-text content storage; associates notes with tags via a join table

### Modified Capabilities

- `database-schema`: Adds `notes`, `tags`, and `note_tags` tables to the existing Prisma schema

## Impact

- **Backend**: New router `apps/api/src/routes/notes.ts`, controller, and service; Prisma schema updated; new migration
- **Shared package**: New Zod schemas and TypeScript types for note request/response payloads
- **Database**: Three new tables (`notes`, `tags`, `note_tags`) with foreign keys to `users`
- **Auth middleware**: All note endpoints require JWT authentication (reuses existing middleware)
- **No breaking changes** to existing auth endpoints
