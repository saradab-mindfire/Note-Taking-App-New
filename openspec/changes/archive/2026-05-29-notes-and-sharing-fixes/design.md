## Context

Three frontend defects were identified during QA. All fixes are isolated to frontend components with no backend or shared-package changes required.

**Current state:**
- `NotesListPage.tsx`: header contains a "My Notes" title and note count, but no affordance to create a new note.
- `ShareModal.tsx`: `datetime-local` input stores a value like `"2024-01-15T14:30"` (no timezone), passed directly to `createLink.mutate({ expiresAt })`. The backend Zod schema requires a full ISO-8601 datetime string, so the missing timezone causes a validation error.
- `RichTextEditor.tsx`: the outer wrapper has `border border-input` plus `focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2`. TipTap's `EditorContent` can also render its own internal outline. The combination produces a second visible border on focus that grows as content expands.

## Goals / Non-Goals

**Goals:**
- Provide a "New Note" button on the notes list page that navigates to the note creation route
- Serialize the `datetime-local` value to a valid ISO-8601 string (with UTC offset) before API submission
- Eliminate duplicate/expanding border artifacts in the note editor while preserving a clean, accessible focus state

**Non-Goals:**
- Editor redesign or rich text toolbar changes
- Share modal or share link UI redesign
- Any backend API or database changes
- Changes to the shared package

## Decisions

### 1. "New Note" button placement
Add a `<Button>` component to the `NotesListPage` header row, aligned opposite the "My Notes" title. On click, call `navigate('/notes/new')` (the existing note creation route). Use the same shadcn/ui `Button` variant already used elsewhere in the app for consistency. Keep the layout responsive with `flex justify-between items-center` on the header.

**Alternative considered:** floating action button (FAB) — rejected; the app uses inline header actions throughout and a FAB would be inconsistent.

### 2. ISO datetime serialization in ShareModal
When `handleGenerate` is called, convert the raw `datetime-local` string to a UTC ISO-8601 string using `new Date(value).toISOString()` before passing it to the mutation. Add client-side validation to reject empty or unparseable values before submission (show an inline error rather than letting the API reject it).

`datetime-local` always produces local-time values without a timezone designator. `new Date(localString).toISOString()` interprets the value as local time and converts to UTC, which is the correct behavior.

**Alternative considered:** append `Z` directly — incorrect; that would mis-represent local time as UTC without conversion.

### 3. Editor border fix
Remove the `focus-within:ring-*` and `focus-within:ring-offset-*` classes from the outer wrapper div in `RichTextEditor.tsx`. Replace with a single `focus-within:border-ring` or `focus-within:border-primary` to shift the border color on focus instead of layering a ring on top. Also add `focus:outline-none` to the `EditorContent` element's className to suppress any TipTap-internal outline.

This retains keyboard accessibility (the border color change indicates focus) without the expanding ring artifact.

**Alternative considered:** keep the ring but constrain it with `overflow-hidden` — rejected; the ring renders outside the element bounds and cannot be clipped without hiding content.

## Risks / Trade-offs

- [datetime-local timezone handling] `new Date(localString).toISOString()` interprets the value in the browser's local timezone. If users are in different timezones, the UTC datetime stored will differ. → Acceptable for now; full timezone-aware UX is out of scope.
- [Focus accessibility] Removing the ring reduces focus visibility for keyboard users. → Mitigated by replacing with a border-color change, which remains visible and passes contrast requirements.
- [Route assumption] The "new note" route is assumed to be `/notes/new`. → Verify this route exists in the router config before implementation.
