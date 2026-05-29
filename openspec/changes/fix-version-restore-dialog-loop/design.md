## Context

The version history drawer's restore flow has a bug where the confirmation dialog re-opens repeatedly after the user confirms a restore. The drawer is a frontend-only concern — the backend restore endpoint (`POST /notes/:id/versions/:versionId/restore`) is working correctly. All fixes are contained to the React component tree that manages the restore dialog and its associated TanStack Query mutation.

**Current broken flow:**
1. User clicks Restore → dialog opens
2. User confirms → dialog state is set to close, mutation fires
3. Something causes dialog open state to be set back to `true` (likely a stale closure, missing `isPending` guard, or effect re-running on query invalidation)
4. Dialog appears again; user confirms again → duplicate API call

## Goals / Non-Goals

**Goals:**
- Confirmation dialog appears exactly once per Restore button click
- `POST /notes/:id/versions/:versionId/restore` is called exactly once per user confirmation
- Dialog closes immediately when the user confirms (before the API response)
- Restore button and dialog confirm button are disabled while the mutation is in-flight
- Note editor reflects restored content after success (query invalidated/refetched)
- Success toast shown after restore completes
- Error scenarios (network failure, 4xx/5xx) surface a message without re-opening the dialog

**Non-Goals:**
- Backend changes
- Shared schema changes
- Changes to the version list or preview behaviour
- Optimistic UI (content shows before API confirms)

## Decisions

### Decision 1: Close dialog immediately on confirm, not on API success

**Choice:** Set `dialogOpen = false` synchronously when the user clicks "Confirm", before awaiting the mutation.

**Rationale:** Closing on `onSuccess` means the dialog stays open during the in-flight request. If a re-render occurs during that window (e.g., from query invalidation), the dialog can re-open if its open state is tied to component-level state that gets reset. Closing immediately removes the window and provides snappier UX. The `isPending` guard on the confirm button prevents double-clicks.

**Alternative considered:** Close on `onSuccess` — rejected because the in-flight window is the source of the re-open bug.

---

### Decision 2: `isPending` from the mutation disables confirm button

**Choice:** Use the `isPending` boolean returned by the TanStack Query `useMutation` hook to disable the confirm button and the Restore button in the preview panel during the in-flight request.

**Rationale:** Prevents duplicate submissions if the dialog somehow re-appears. Also provides visual feedback that work is in progress.

---

### Decision 3: Invalidate note query on success rather than manual state update

**Choice:** Call `queryClient.invalidateQueries({ queryKey: ['note', noteId] })` in `onSuccess`, letting TanStack Query refetch the note and update the editor.

**Rationale:** Consistent with the rest of the app's data-fetching pattern. Avoids manually stitching restored content into Zustand/editor state. The refetch is cheap for a single note.

---

### Decision 4: Error shown in-drawer without re-opening dialog

**Choice:** On mutation error, display a toast or inline error message. The dialog stays closed (it was already closed on confirm). The Restore button in the preview panel becomes re-enabled so the user can retry.

**Rationale:** Re-opening the dialog on error would reintroduce the loop risk. The user can simply click Restore again to retry.

## Risks / Trade-offs

- **[Risk] Brief flash if restore fails**: The dialog closes before the API responds, so on error the user sees the drawer with an error message rather than the dialog. This is acceptable UX but may feel abrupt.
  → **Mitigation**: Clear error message with a "Restore failed — try again" toast.

- **[Risk] Root cause not yet confirmed**: Without reading the exact component code, the root cause of the re-open loop is assumed to be one of: stale closure on `onSuccess`, effect dependency on query state, or missing `isPending` guard. The fix addresses all three defensively.
  → **Mitigation**: Implementation task includes root-cause identification before applying fix.
