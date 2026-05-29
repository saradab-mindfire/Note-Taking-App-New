## MODIFIED Requirements

### Requirement: User can edit note content with TipTap rich text editor
The system SHALL render a TipTap editor for the note body. The editor SHALL support bold, italic, headings, bullet lists, and ordered lists at minimum. Content SHALL be stored internally as TipTap JSON. The editor container SHALL display a single border at all times. On focus, the border color SHALL change to indicate active state; no additional ring or outline overlay SHALL be applied. The editor height SHALL grow with content without producing expanding border artifacts.

#### Scenario: User types in the editor
- **WHEN** the user types in the TipTap editor
- **THEN** the content SHALL update and the note SHALL be marked dirty

#### Scenario: Existing note content loads correctly
- **WHEN** the editor initialises with a note whose `content` is a serialised TipTap JSON string
- **THEN** the TipTap editor SHALL render the document correctly

#### Scenario: Editor displays a single border in resting state
- **WHEN** the TipTap editor is rendered and not focused
- **THEN** the editor container SHALL display exactly one border with no additional ring or outline

#### Scenario: Editor focus state uses border-color change only
- **WHEN** the user clicks into or tabs to the TipTap editor
- **THEN** the border color SHALL change to indicate focus and no additional ring overlay SHALL appear outside the border

#### Scenario: Editor height grows without border artifacts
- **WHEN** the user types content that exceeds the initial editor height
- **THEN** the editor container SHALL expand vertically with the content and the border SHALL remain a single consistent line at the container edge
