## 1. Investigation

- [x] 1.1 Locate the version history drawer component and identify the restore confirmation dialog state management (open/close flag and the code path that sets it back to `true`)
- [x] 1.2 Trace the restore mutation's `onSuccess` / `onError` handlers and any `useEffect` hooks to confirm the root cause of the repeated dialog trigger

## 2. Fix Restore Dialog State

- [x] 2.1 Update the confirm handler to set `dialogOpen = false` synchronously before calling the mutation (close-on-confirm pattern)
- [x] 2.2 Remove or correct any code that sets dialog open state to `true` outside of the explicit Restore button click handler
- [x] 2.3 Disable the confirm button using the mutation's `isPending` flag while the restore request is in-flight

## 3. Prevent Duplicate Submissions

- [x] 3.1 Ensure the Restore button in the preview panel is disabled when the mutation `isPending` is `true`
- [x] 3.2 Verify there is no double-invocation of the mutation call site (e.g., from stale closures or effect re-runs)

## 4. Post-Restore Success Handling

- [x] 4.1 In the mutation `onSuccess` handler, call `queryClient.invalidateQueries` for the note query key to trigger a refetch and reload the editor with restored content
- [x] 4.2 Show a success toast/notification after a successful restore
- [x] 4.3 Ensure the drawer closes after successful restore

## 5. Error Handling

- [x] 5.1 In the mutation `onError` handler, display an error toast/notification with an appropriate message for: general failure, network error, version not found (404), and unauthorized (401/403)
- [x] 5.2 Ensure the Restore button is re-enabled after an error so the user can retry
- [x] 5.3 Ensure the dialog does not reappear on error

## 6. Verification

- [x] 6.1 Manually test the full restore flow: open drawer → select version → click Restore → confirm → verify dialog closes once, editor updates, success notification appears
- [x] 6.2 Test error scenario: mock a failing restore API response and verify error toast appears with no dialog loop
- [x] 6.3 Run `pnpm build` and `pnpm lint --max-warnings 0` with no errors
- [x] 6.4 Run `pnpm test` and verify no regressions
