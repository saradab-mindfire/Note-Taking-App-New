## Why

Users have no way to view or recover previous versions of their notes from the frontend, even though the backend API already supports full version history. This gap means the version history feature shipped in the API is entirely inaccessible to users.

## What Changes

- Add a **Version History button** to the note editor toolbar (visible only when editing an existing note)
- Add a **Version History drawer** that slides in from the right, listing all saved versions newest-first
- Add a **Version preview panel** within the drawer to display the title and content of a selected version
- Add a **Restore confirmation dialog** that prompts before overwriting the live note with a historical version
- Wire all UI to the existing backend endpoints (`GET /notes/:id/versions`, `GET /notes/:id/versions/:versionId`, `POST /notes/:id/versions/:versionId/restore`) via TanStack Query
- Export shared Zod schemas for version list query params and version metadata from `packages/shared` for frontend consumption

## Capabilities

### New Capabilities

- `version-history-drawer`: Version history drawer UI integrated into the note editor — lists versions, previews selected version content, and triggers restore with confirmation

### Modified Capabilities

- `note-editor-page`: A **History** button is added to the editor toolbar (visible only on existing notes) that opens the version history drawer

## Impact

- `apps/frontend/src/` — new components: `VersionHistoryDrawer`, `VersionList`, `VersionPreview`, `RestoreConfirmDialog`; updated `NoteEditorPage` toolbar
- `packages/shared/src/` — reuse existing `noteVersionSchema`, `noteVersionListSchema`, `noteVersionListQuerySchema` (already exported from the backend change)
- No backend changes required; all API endpoints already exist
- No new routes; drawer is an overlay within `/notes/:id`
