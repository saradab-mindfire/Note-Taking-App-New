## Context

The backend version history API (`GET /notes/:id/versions`, `GET /notes/:id/versions/:versionId`, `POST /notes/:id/versions/:versionId/restore`) is fully implemented and tested. Shared Zod schemas (`noteVersionSchema`, `noteVersionListSchema`, `noteVersionListQuerySchema`) are already exported from `packages/shared`. The frontend has no UI to access any of this. The note editor toolbar currently has Save and Share buttons; a History button fits naturally alongside them.

## Goals / Non-Goals

**Goals:**
- Expose version list, version preview, and version restore to the user entirely through a drawer overlay on the note editor page
- Use TanStack Query for all data fetching (list, single version) and mutations (restore)
- Re-use existing shared schemas for type safety without duplicating zod definitions
- Keep all new UI contained to the note editor — no new routes

**Non-Goals:**
- Side-by-side diff view between versions
- Visual change tracking or highlighting
- Version labelling or comments
- Real-time updates to the version list while the drawer is open

## Decisions

### Decision 1: Drawer as local component state, not Zustand

The version history drawer open/closed state is page-local — no other page or component needs to know it. Using Zustand for this would add a store slice with no benefit.

**Alternative considered:** Add `versionHistoryOpen` to the notes Zustand store alongside other editor state.
**Rejected because:** The drawer has no cross-page relevance and the editor already controls it via a button on the same page.

### Decision 2: Lazy-fetch version list — only when drawer opens

The version list query is disabled until the drawer is opened (`enabled: isOpen`). Fetching on page load would be wasteful for users who never open the drawer.

**Alternative considered:** Prefetch on hover of the History button.
**Rejected because:** Premature optimisation; hover prefetch adds complexity not justified by the latency of a list query.

### Decision 3: Fetch full version content on selection, not upfront

When the user selects a version from the list, a separate query fetches the full version details (`GET /notes/:id/versions/:versionId`). The list endpoint returns `id`, `title`, `content`, and `createdAt` — enough for a preview — but fetching per-selection keeps the list payload small and is consistent with how the rest of the app handles detail fetches.

**Alternative considered:** Inline content in the list response and skip the detail query.
**Rejected because:** The list endpoint already returns content, so the detail query can be skipped. However, this decision stays as-is to match the existing API contract and avoid over-fetching large content for all versions at once.

> **Revised:** Since the API list response already includes `content`, use the list item data directly for preview and only call the detail endpoint when necessary (e.g., if content were omitted). This avoids the N+1 pattern.

### Decision 4: Restore triggers a full note refetch, not optimistic update

After a successful restore (`POST /notes/:id/versions/:versionId/restore`), the mutation invalidates both the `["note", id]` and `["versions", id]` query keys. This forces the editor to reload the latest note state from the server, which is the most reliable way to ensure the editor reflects the restored content.

**Alternative considered:** Optimistic update — directly write the restored version data into the `["note", id]` cache.
**Rejected because:** The restore endpoint returns the updated note; an optimistic update would need to anticipate the server response exactly and risks the editor being out of sync if the mutation response differs.

### Decision 5: Component structure

```
NoteEditorPage
└── EditorToolbar
    └── VersionHistoryButton   (opens drawer)
VersionHistoryDrawer           (shadcn Sheet)
├── VersionList                (list of version items)
└── VersionPreviewPanel        (displays selected version title + content)
    └── RestoreConfirmDialog   (shadcn AlertDialog)
```

The drawer is rendered as a sibling of the toolbar (at the page level) to avoid z-index and portal issues with shadcn Sheet.

## Risks / Trade-offs

- **Drawer content flash on open** → Mitigated by showing a loading skeleton in `VersionList` while the query is fetching.
- **Restore while autosave is in-flight** → The restore button is disabled while any save mutation is in-flight. This prevents a race where the autosave overwrites the restored state.
- **Large version lists** → The list query defaults to `limit: 20` and supports pagination. For MVP, infinite scroll is not implemented; a "Load more" button can be added if needed.
- **Shared schema version mismatch** → Frontend consumes `noteVersionSchema` from `packages/shared`. If the backend evolves the schema, the shared package update propagates to both; no separate sync required.

## Migration Plan

No backend changes, no database migrations, no environment variable changes. The change is purely additive frontend code. Deployment is a standard frontend build and publish.

**Rollback:** Revert the frontend deployment; backend is unaffected.

## Open Questions

- Should the drawer close automatically after a successful restore, or stay open so the user can see the updated version list? (Recommendation: close and let the user reopen if needed — a closed drawer confirms the action completed.)
