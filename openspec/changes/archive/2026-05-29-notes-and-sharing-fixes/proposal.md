## Why

QA testing revealed three UI/UX defects: the notes list page lacks a visible entry point to create new notes, share link generation fails due to an invalid ISO datetime format being sent to the API, and the note editor renders duplicate borders with an expanding focus outline that grows with content. These regressions must be resolved before release.

## What Changes

- Add a "New Note" button to the notes list page that navigates to the note creation/editor flow
- Fix frontend date/time serialization in the share modal to produce valid ISO-8601 datetimes before API submission
- Remove duplicate border rendering in the note editor and fix the expanding focus outline so the editor grows with content without visual artifacts

## Capabilities

### New Capabilities
<!-- None introduced — all changes are defect fixes to existing capabilities -->

### Modified Capabilities
- `notes-list-page`: Add a prominent "New Note" button; requirement that users can initiate note creation directly from the list view
- `share-modal`: Require that expiry date/time is normalized to a valid ISO-8601 datetime string (with timezone) before submission; add client-side validation for invalid/past expiry values
- `note-editor-page`: Require single-border rendering for the editor container; focus styling must not produce an expanding outline artifact while typing

## Impact

- `apps/frontend/src/pages/` — notes list page component updated
- `apps/frontend/src/components/` — share modal date/time handling updated; note editor container styles updated
- `packages/shared` — no schema changes required (backend validation unchanged)
- No API or database changes
