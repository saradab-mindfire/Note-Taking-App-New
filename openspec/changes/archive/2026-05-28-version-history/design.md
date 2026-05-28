## Context

Notes are currently stored with a single mutable record per note. Once a user saves an update the previous state is lost. The version history feature introduces an append-only `note_versions` table that captures a snapshot of title and content on every note update, plus REST endpoints to list, view, and restore those snapshots.

The backend uses Express 5, Prisma ORM against PostgreSQL 16, and JWT auth. All shared types/schemas live in `packages/shared`.

## Goals / Non-Goals

**Goals:**
- Capture an immutable snapshot of title + content on every `PATCH /notes/:id` update
- Expose `GET /notes/:id/versions`, `GET /notes/:id/versions/:versionId`, and `POST /notes/:id/versions/:versionId/restore`
- Restore creates a new active note state without deleting history
- Auto-purge versions older than a configurable retention period (default: 30 days)
- User-scoped access: a user may only see/restore versions of notes they own
- Shared zod schemas for version entities in `packages/shared`

**Non-Goals:**
- Diff or side-by-side compare UI
- Version labels or comments
- Real-time collaboration or conflict resolution
- Frontend implementation (out of scope for AB-1009)

## Decisions

### 1. Append-only `note_versions` table (not event sourcing)

**Decision**: Store snapshots as simple rows in a dedicated `note_versions` table. Each row is immutable after insert.

**Alternatives considered**:
- Event sourcing / JSONB change log — overkill for this use case; reconstructing state from events adds read complexity.
- Storing diffs only — reduces storage but makes "view version N" expensive; full snapshots are simpler and fast.

**Rationale**: Full snapshot rows keep reads O(1) per version. The table stays narrow (id, noteId, title, content, createdAt) and is easy to query and purge.

### 2. Snapshot written in the same transaction as the note update

**Decision**: `notesService.update` opens a Prisma `$transaction` that updates the `notes` row AND inserts into `note_versions` atomically.

**Rationale**: Prevents a state where the note is updated but no snapshot exists (or vice versa) on failure.

### 3. Restore creates a new active version (does not mutate history)

**Decision**: `POST /notes/:id/versions/:versionId/restore` copies the snapshot's title and content into a new `PATCH` of the live note (inside a transaction that also writes a new snapshot for the restored state).

**Rationale**: History remains append-only and immutable. Users can undo a restore by restoring an earlier version.

### 4. Auto-purge via a scheduled startup/cron job

**Decision**: A lightweight cron task (using `node-cron` or a plain `setInterval` on startup) runs daily and deletes `note_versions` rows with `createdAt < now() - retentionDays`. `retentionDays` defaults to 30 and is controlled by the `VERSION_RETENTION_DAYS` env var.

**Alternatives considered**:
- PostgreSQL `pg_cron` — requires DB-level extension, adds ops complexity.
- Manual trigger endpoint — no guarantee it runs; puts burden on client.

**Rationale**: Application-level job is easy to observe and test without DB extensions.

### 5. Pagination for version list

**Decision**: `GET /notes/:id/versions` returns a paginated list (page + limit query params, default limit 20) ordered by `createdAt DESC`.

**Rationale**: Consistent with existing list endpoints in this codebase; prevents large payloads for notes with many versions.

## Risks / Trade-offs

- **Storage growth** → Mitigated by auto-purge; retention period is tunable.
- **Write amplification on every note save** → Each PATCH now writes two rows. For the expected load this is acceptable; revisit with per-user rate limiting if needed.
- **Purge job missing versions of soft-deleted notes** → Purge query is independent of `deletedAt`; versions are retained and purged on the same schedule regardless of note state.
- **Clock skew on `createdAt`** → Use `now()` via Prisma `default(now())` to ensure server-side timestamps; client-provided timestamps are never trusted.
