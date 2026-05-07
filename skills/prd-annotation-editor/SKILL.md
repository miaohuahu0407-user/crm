---
name: prd-annotation-editor
description: Create or update PRD-linked page annotations with a right-side editable requirements panel, local save, publishable HTML export, optional JSON persistence, and whole-document Markdown export. Use when the user wants initialization marking, incremental annotation updates, editable annotation copy, GitHub Pages publishing, or full Markdown export.
---

# PRD Annotation Editor

## Overview

Use this skill to turn a page implementation into modular requirement annotations with a right-side editable requirements panel. The current format is a page anchor plus a fixed right panel, not a tooltip-only overlay.

## Workflow Decision

- If the user is starting from a new page or an unannotated prototype, run Workflow A.
- If the user is changing existing annotations, reusing the same page, or asking to sync to a changed UI, run Workflow B.
- If the user asks why deployed annotation content did not change, explain the persistence model before editing: browser save is local unless the state is exported into HTML or an external data file.
- If the user asks to export the full requirement set, include Markdown export.
- If the user plans to publish to GitHub Pages, include a publishable persistence path.

## Workflow A: Initialize

1. Group requirements by module.
2. Place one badge per module or tightly coupled area.
3. Keep the full requirement text inside the right-side editable panel.
4. Use the current panel format: title, numbered requirement chip, rich-text editor, save button, Markdown export button, and publish export button.
5. Anchor badges to the target module without affecting page layout.
6. Prefer writing new prototype output to a new HTML file rather than overwriting the original prototype.

## Workflow B: Update

1. Compare the current page, current panel content, and the user's updated requirement intent.
2. Keep module grouping stable unless the target component moved.
3. Replace only the affected requirement content.
4. Preserve the panel format and badge style.
5. If a module was removed from the page, remove its badge and panel entry.
6. Update `agents/openai.yaml` and any user-facing skill index when this skill itself is changed.

## Persistence And Publishing

The panel save action cannot directly modify a static HTML file on disk from a browser. It normally saves to `localStorage`, which is private to the current browser and origin. Publishing the original HTML to GitHub Pages will not include unsaved-to-file annotation edits.

Support one of these publishing models:

1. **Publishable HTML export**
   - Keep an embedded JSON node such as `<script id="prd-annotation-export-state" type="application/json">[]</script>`.
   - On save, sync the edited annotation state into that node.
   - Provide `Export Publishable HTML`, which downloads an HTML file containing the current annotation state.
   - Tell users to deploy the exported HTML, not the unchanged source HTML, if they want edits visible on GitHub Pages.

2. **External JSON persistence**
   - Keep the main HTML stable.
   - Load annotation content from a sidecar file such as `annotations.json`.
   - For publishing, update and deploy the JSON file with the HTML.
   - Use this when the user does not want to re-export a whole HTML file for every annotation edit.

3. **Server-backed save**
   - Only use if the project has a backend or API that can write files or database records.
   - GitHub Pages alone cannot support direct server-side saving.

## Markdown Export

Support whole-document Markdown export for the complete requirement set.

- File name example: `prd-page-annotation.md`.
- Each annotation should export as `## Requirement [n]: Module Name` followed by the current edited body.
- Export should use the latest saved or in-memory annotation content, not only the default annotation copy.

## Editing Rules

- Preserve the original requirement detail inside grouped content.
- Keep text readable with headings, paragraphs, lists, emphasis, and blockquotes.
- Use the panel for direct editing and local saving.
- Do not let annotations change the original page flow.
- Make the publishing behavior explicit in the final answer whenever deployment is involved.

## Validation

Check that:
- Each module has only one badge.
- The active panel content matches the selected badge.
- Save persists the edited state in the chosen persistence model.
- Markdown export produces a single Markdown file for the whole requirement set.
- Publishable HTML export or external JSON persistence carries the edited annotation content beyond local browser storage.
- The final answer states whether the current session skill list needs a restart/new session to show skill changes.
