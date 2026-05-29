## 1. TanStack Query Hooks

- [x] 1.1 Create `useVersionList` hook: `GET /notes/:id/versions` with `enabled: isOpen` flag and `noteVersionListQuerySchema` params
- [x] 1.2 Create `useRestoreVersion` mutation hook: `POST /notes/:id/versions/:versionId/restore`, invalidates `["note", id]` and `["versions", id]` on success

## 2. Version History Drawer Component

- [x] 2.1 Install shadcn Sheet component if not already present (`npx shadcn@latest add sheet`)
- [x] 2.2 Create `VersionHistoryDrawer` component wrapping shadcn Sheet with open/close props
- [x] 2.3 Create `VersionList` component: renders version items from list data, shows loading skeleton, empty state, and error state with retry
- [x] 2.4 Create `VersionPreviewPanel` component: displays selected version's `title` and `content` as plain text; shows prompt when no version selected
- [x] 2.5 Create `RestoreConfirmDialog` component using shadcn AlertDialog: confirm/cancel actions, disabled state during in-flight mutation
- [x] 2.6 Compose `VersionHistoryDrawer` with `VersionList`, `VersionPreviewPanel`, and `RestoreConfirmDialog`; wire selected version state locally

## 3. Note Editor Toolbar Integration

- [x] 3.1 Add `isOpen` / `setIsOpen` local state for the version history drawer to `NoteEditorPage`
- [x] 3.2 Add History button to the editor toolbar (visible only when `noteId` is defined), alongside Save and Share buttons
- [x] 3.3 Render `VersionHistoryDrawer` at the page level in `NoteEditorPage`, passing `noteId`, `isOpen`, `onClose`, and the active restore mutation
- [x] 3.4 Disable the History button while a restore mutation is in-flight

## 4. Error & Loading States

- [x] 4.1 Verify loading skeleton renders in `VersionList` while `useVersionList` is fetching
- [x] 4.2 Verify error message and retry button render in `VersionList` when `useVersionList` fails
- [x] 4.3 Verify error message renders in `VersionPreviewPanel` / drawer when `useRestoreVersion` fails (drawer stays open)
- [x] 4.4 Verify Restore button is disabled while any save or restore mutation is in-flight

## 5. Build & Quality

- [x] 5.1 Run `pnpm build` and fix any TypeScript errors
- [x] 5.2 Run `pnpm lint --max-warnings 0` and fix all lint warnings
- [x] 5.3 Run `pnpm test` and confirm no regressions
