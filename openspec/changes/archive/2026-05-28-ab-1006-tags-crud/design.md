## Context

The `tags` and `note_tags` tables were created as part of AB-1004 (notes CRUD schema). Notes endpoints already accept `tagIds` and return associated tag objects. However, no endpoint exists to create, list, update, or delete tags themselves. This change adds the missing tag management layer without altering any existing notes behavior.

The backend follows an Express 5 router → controller → service layered pattern, with Prisma as the ORM and shared Zod schemas for request/response validation.

## Goals / Non-Goals

**Goals:**
- CRUD endpoints for tags scoped to the authenticated user
- Note count per tag in list responses (leveraging Prisma `_count`)
- Duplicate name prevention per user (case-insensitive, trimmed)
- Hard delete that cascades removal of note-tag join rows
- Shared Zod schemas in `packages/shared` consumed by both backend and (future) frontend

**Non-Goals:**
- Soft delete for tags (tags are simple metadata; hard delete is appropriate)
- Tag search or autocomplete endpoint
- Bulk tag operations
- Frontend implementation

## Decisions

### Hard delete vs soft delete for tags
Tags are lightweight metadata without an audit trail requirement. Soft-deleting a tag would leave orphaned `note_tags` rows and complicate note responses. Hard delete with cascade (`onDelete: Cascade` on `NoteTag.tagId`) is simpler and matches user expectations ("remove this tag from everything").

**Alternative considered**: soft delete with a background cleanup job — rejected as over-engineering for this scope.

### Unique constraint at DB level for `(userId, name)`
The `tags` table needs `@@unique([userId, name])` in the Prisma schema and a corresponding migration. Enforcing this at the DB layer ensures consistency even if application-level checks are bypassed. The backend service will also normalize names (`.trim().toLowerCase()` for comparison) before the insert to give a clean user-facing error.

**Alternative considered**: application-only uniqueness check — rejected because of TOCTOU race conditions under concurrent requests.

### Note count via Prisma `_count`
`prisma.tag.findMany({ include: { _count: { select: { noteTags: true } } } })` returns note counts in a single query. No raw SQL needed.

**Alternative considered**: separate COUNT query — rejected as unnecessary when Prisma handles it natively.

### Tag name normalization
Names are trimmed of leading/trailing whitespace before persistence. Case is preserved in storage (e.g., "Work" stays "Work") but uniqueness is enforced case-insensitively at the service layer. This matches common UX expectations (users shouldn't create both "work" and "Work").

## Risks / Trade-offs

- **Risk**: Prisma migration to add unique constraint fails if existing data already has duplicate `(userId, name)` pairs.
  → **Mitigation**: The `tags` table was introduced in AB-1004 but no tag management endpoints existed, so no user-created data should exist in any real environment. Document as a prerequisite.

- **Risk**: Hard-deleting a tag removes it from notes silently; users may be surprised.
  → **Mitigation**: The DELETE response returns HTTP 204 (no content expected). Notes still exist; they just no longer have that tag. This is the standard behavior for tag deletion.

- **Risk**: `_count` includes note-tag rows for soft-deleted notes, inflating the count.
  → **Mitigation**: Note count reflects all associated notes (active + soft-deleted). This is acceptable for MVP; a filtered count can be added in a later ticket if needed.

## Migration Plan

1. Add `@@unique([userId, name])` to `Tag` model in `schema.prisma`
2. Run `prisma migrate dev --name add-tag-unique-user-name`
3. Deploy backend with new tags router registered at `/tags`
4. No rollback complexity — migration is additive (unique constraint); existing rows are unaffected assuming no duplicates

## Open Questions

*(none — scope is well-defined)*
