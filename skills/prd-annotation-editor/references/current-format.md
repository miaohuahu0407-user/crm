# Current Annotation Format

## UI Pattern

- Left side: page anchors with numbered badges.
- Right side: fixed requirements panel.
- Editor: rich-text `contenteditable` area with formatting buttons.
- Actions: save current annotation, export full Markdown, export publishable HTML when using embedded state.

## Persistence Model

Browser `localStorage` is local only. It is useful for editing convenience, but it is not enough for GitHub Pages publishing.

For a static site, choose one:

1. Embedded state + publishable HTML export.
2. External `annotations.json` loaded by the page.
3. Backend/API save if the project has a server.

## Publishable HTML Export

- Add an embedded JSON script node: `prd-annotation-export-state`.
- On save, sync current annotation state into the node.
- Provide a button named `Export Publishable HTML`.
- The downloaded HTML is the file to deploy when publishing edited annotations.

## Markdown Export

- Whole-document export target: Markdown.
- File name: `prd-page-annotation.md`.
- Each annotation exports as `## Requirement [n]: ...` followed by the current edited content.

## Content Rules

- Group related PRD requirements into one module.
- Keep explicit business rules, states, exceptions, and interactions.
- Preserve the current page layout and do not let annotations reflow the page.
