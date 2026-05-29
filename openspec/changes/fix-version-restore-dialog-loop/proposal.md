## Why

The version restore confirmation dialog appears repeatedly after the user confirms a restore, preventing clean completion of the restore action. This is a critical UX bug that makes the version history feature unusable and risks creating duplicate restores.

## What Changes

- Fix duplicate dialog trigger caused by missing loading/in-progress guard on the restore action
- Disable the restore button and confirm action while a restore request is in progress
- Close the confirmation dialog immediately after the user confirms (before or immediately on success)
- Refresh note data in the editor after a successful restore
- Display a success toast/feedback after restore completes
- Handle error scenarios (network failure, version not found, unauthorized) with appropriate feedback without re-triggering the dialog

## Capabilities

### New Capabilities
<!-- No new capabilities introduced — this is a bug fix to existing behavior -->

### Modified Capabilities
- `version-history-drawer`: Restore action must be idempotent per user interaction — dialog appears once, API is called once, dialog closes on confirmation, editor reflects restored content

## Impact

- `apps/frontend`: Version history drawer component and its restore confirmation dialog logic
- `apps/frontend`: TanStack Query mutation for restore — add `isPending` guard and `onSuccess`/`onError` handlers
- No backend changes required
- No shared schema changes required
