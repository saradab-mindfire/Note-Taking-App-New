## Context

The notes list page (AB-1011) is live. Users can see their notes but cannot create or edit them. The backend already supports `POST /notes`, `GET /notes/:id`, and `PATCH /notes/:id`. This change wires up a frontend editor to those endpoints and introduces autosave behaviour.

TipTap is already listed in the project stack. The `packages/shared` package owns all Zod schemas; this change adds an editor-specific form schema there.

## Goals / Non-Goals

**Goals:**
- Render a TipTap rich text editor at `/notes/new` (create) and `/notes/:id` (edit)
- Store content as TipTap JSON (not raw HTML)
- Debounced autosave — triggers after 1 s of inactivity, skips if content unchanged
- Manual save button available at all times
- Save status indicator: Saving / Saved / Error
- Loading skeleton on note fetch; error state on fetch failure or 403/404
- Tag multi-select inline in the editor header
- All API calls via TanStack Query mutations/queries

**Non-Goals:**
- Real-time collaboration
- Markdown import/export
- Attachment upload
- Diff / version history visualisation (backend already creates versions; UI deferred)
- Offline support

## Decisions

### 1. TipTap JSON as content format

**Decision**: Store and transmit content as TipTap's native JSON (`editor.getJSON()`), not HTML or Markdown.

**Rationale**: JSON is structured and diff-friendly for future version history UI. HTML is fragile to sanitise; Markdown requires a round-trip parser. The existing backend `content` field is `String` — JSON is serialised before sending and deserialised on load. No backend schema change needed.

**Alternative considered**: HTML (`editor.getHTML()`) — simpler but harder to diff and XSS-prone.

---

### 2. Debounced autosave with dirty-state guard

**Decision**: Use a `useRef`-held debounce timer (1 000 ms). On each editor `onUpdate` event, compare the new JSON with the last-saved JSON using `JSON.stringify`. If identical, skip. Otherwise reset the timer.

**Rationale**: Avoids React re-render overhead of storing the serialised content in state on every keystroke. The dirty-state guard prevents no-op API calls that would create empty `note_versions` snapshots on the backend.

**Alternative considered**: `useDebouncedCallback` from `use-hooks-ts` — acceptable but adds a dependency; the ref approach is zero-dep and equally readable.

---

### 3. Single `NoteEditorPage` component for both create and edit

**Decision**: One page component handles both `/notes/new` and `/notes/:id`. It detects mode via `useParams` — if `id` is `undefined` the page is in create mode.

**Rationale**: The editor UI is identical in both modes. Separating into two components would duplicate the entire autosave and TipTap wiring.

**Divergence between modes**:
- Create: no initial fetch; on first save calls `POST /notes` and then navigates to `/notes/:id`
- Edit: fetches note on mount; on save calls `PATCH /notes/:id`

---

### 4. Save orchestration via `useNoteEditor` custom hook

**Decision**: Extract all save logic (autosave timer, mutation calls, status tracking) into a `useNoteEditor` hook. The page component only handles layout and routing.

**Rationale**: Keeps the page component thin and makes the save logic independently testable.

---

### 5. `noteEditorFormSchema` in `packages/shared`

**Decision**: Add a Zod schema to `packages/shared` for the editor form values (`title`, `content` as string, `tagIds`).

**Rationale**: Consistent with project rule — shared schemas in `packages/shared` only. This schema is used for client-side validation before save; it mirrors the existing `createNoteSchema` / `updateNoteSchema` but is framed around the form (content as a serialised JSON string).

## Risks / Trade-offs

- **Autosave creates `note_versions` snapshots on every save** — The backend unconditionally snapshots on `PATCH`. Frequent autosaves will create many version rows. Mitigation: the 1 s debounce + dirty-state guard minimises saves; version pruning is a separate concern.
- **Large JSON content in localStorage/memory** — TipTap documents with many nodes can be large. Mitigation: no local persistence is implemented here; content lives only in component state and the server.
- **Race condition: user navigates away mid-save** — If the user clicks a link while a save mutation is in-flight, the mutation resolves after unmount. Mitigation: TanStack Query handles unmounted mutations gracefully; no explicit cancel needed for this scope.
- **First save in create mode triggers navigation** — After `POST /notes` resolves, the page navigates to `/notes/:id`. Any in-progress debounce timer is cleared. The note is now in edit mode. This is a one-way transition with no rollback concern.
