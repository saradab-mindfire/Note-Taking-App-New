## 1. New Note Button (NotesListPage)

- [x] 1.1 Verify the `/notes/new` route exists in the router config
- [x] 1.2 Add `useNavigate` import and a "New Note" `<Button>` to the `NotesListPage` header with `onClick={() => navigate('/notes/new')}`
- [x] 1.3 Apply `flex justify-between items-center` to the header row so the button aligns opposite the "My Notes" title on all screen sizes

## 2. Share Link Expiry ISO Datetime Fix (ShareModal)

- [x] 2.1 Add client-side validation in `handleGenerate` to check `new Date(expiresAt)` is a valid date before calling the mutation; display an inline error if invalid
- [x] 2.2 Convert the `expiresAt` value to an ISO-8601 UTC string via `new Date(expiresAt).toISOString()` before passing it to `createLink.mutate`

## 3. Note Editor Single Border Fix (RichTextEditor)

- [x] 3.1 In `RichTextEditor.tsx`, remove `focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background` from the outer wrapper div
- [x] 3.2 Add `focus-within:border-ring` (or `focus-within:border-primary`) to the outer wrapper div to indicate focus via border-color change only
- [x] 3.3 Ensure `EditorContent` has `focus:outline-none` in its `className` to suppress any TipTap-internal outline

## 4. Verification

- [x] 4.1 Run `pnpm build` — no TypeScript errors
- [x] 4.2 Run `pnpm lint --max-warnings 0` — no lint warnings
- [x] 4.3 Run `pnpm test` — all existing tests pass
- [x] 4.4 Manually verify: "New Note" button appears on `/notes` and navigates to `/notes/new`
- [x] 4.5 Manually verify: generating a share link with a future expiry date succeeds (no ISO datetime error)
- [x] 4.6 Manually verify: the note editor shows a single border in rest and focus states without expanding ring artifacts
