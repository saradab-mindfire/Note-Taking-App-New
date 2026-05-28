## Why

Users need confidence when editing notes — today there is no way to recover previous content after a save. Version history provides an immutable audit trail so users can review, compare, and restore past states without risk of data loss.

## What Changes

- Every note update automatically creates an immutable snapshot (title + content + timestamp)
- New API endpoints to list, view, and restore historical versions of a note
- Restore creates a new active version rather than overwriting history, preserving the full chain
- Automatic purge of versions older than a configurable retention period
- User-scoped access enforcement: only note owners can access their note history
- Shared zod schemas and types for version entities added to `packages/shared`

## Capabilities

### New Capabilities

- `note-versions`: Snapshot creation on note update; list, view, and restore historical versions; auto-purge of old versions beyond retention policy; user-scoped access control

### Modified Capabilities

- `notes-crud`: Note update operation must now also create a version snapshot as part of the same transaction; no change to existing request/response contracts

## Impact

- **Database**: New `note_versions` table (id, noteId, title, content, createdAt); index on `(noteId, createdAt DESC)`
- **Backend**: New `versionsRouter` (`GET /notes/:id/versions`, `GET /notes/:id/versions/:versionId`, `POST /notes/:id/versions/:versionId/restore`); `notesService.update` extended to write snapshot in a transaction
- **Shared package**: New `NoteVersionSchema`, `NoteVersionListSchema`, and response types
- **Scheduled job**: Cron or startup task for auto-purge of versions past retention window
- **No frontend changes** in scope for this ticket
