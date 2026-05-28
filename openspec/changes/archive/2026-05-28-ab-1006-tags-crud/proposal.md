## Why

Notes CRUD (AB-1004) already supports associating tags with notes via `tagIds`, but there is no API to manage those tags themselves. Users cannot create, rename, recolor, or delete tags, making the tag association feature unusable.

## What Changes

- New `POST /tags` endpoint — create a tag (name + optional color) scoped to the authenticated user
- New `GET /tags` endpoint — list all of the user's tags, each including a `_count.notes` field
- New `PATCH /tags/:id` endpoint — rename or recolor an owned tag
- New `DELETE /tags/:id` endpoint — hard-delete a tag and remove all its note associations
- Shared Zod schemas (`createTagSchema`, `updateTagSchema`, `tagResponseSchema`) added to `packages/shared`
- Prisma migration to add unique constraint `(userId, name)` on the `tags` table (table already exists from AB-1004 schema)
- Tag name normalization: leading/trailing whitespace trimmed; duplicate names per user rejected (case-insensitive)

## Capabilities

### New Capabilities

- `tags-crud`: Full CRUD management for user-scoped tags including note-count per tag, color support, duplicate-name prevention, and cascade removal of note-tag associations on delete.

### Modified Capabilities

*(none — existing notes-crud requirements already specify tagIds handling; no spec-level behavior changes required)*

## Impact

- **packages/shared**: new `createTagSchema`, `updateTagSchema`, `tagResponseSchema` exports
- **apps/backend**: new tags router, controller, service; Prisma migration for unique constraint
- **apps/backend/prisma/schema.prisma**: add `@@unique([userId, name])` to `Tag` model
- No breaking changes to existing notes endpoints
