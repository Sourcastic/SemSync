# SemSync Change Guide

How to change SemSync without growing it. Read this before adding a file, a style, or a package.

The visual source of truth is the design-system page: run the client and open `/design-system.html`.

## Run it

```bash
npm install
npm run dev
```

`npm run dev` starts the sync server (`ws://localhost:3030`) and the client (`http://localhost:5173`).
Every new browser tab starts at sign-in: any email and password work, or use **Continue with Google** (signs in as Eshaal).
Add `?as=atika` or `?as=ibrahim` before the `#` to join a document as another collaborator, e.g.
`http://localhost:5173/?as=atika#/doc/market-demand`. The two demo documents (Market Demand Analysis, The Quick Brown Fox) each have a grammar mistake and a scenario sentence. In the editor, **Demo → Both online** or **You offline, then reconnect** runs a real concurrent edit and its analysis; **Reset document** starts over. See [DEMO-GUIDE.md](DEMO-GUIDE.md) for the presentation script.

Optional environment variables (client): `VITE_SYNC_SERVER_URL`, `VITE_NLP_URL` (an NLI service exposing `POST /analyze`).

## Who owns what

| Concern | Owner | Where |
| --- | --- | --- |
| Collaborative document content | Automerge | `lib/repo.js`, `lib/documentContent.js` |
| Editor state, selection, undo | ProseMirror | `components/editor/` |
| Automerge ↔ ProseMirror | `@automerge/prosemirror` sync plugin | `components/editor/createEditor.js`, `schema.js` |
| Semantic results (conflicts, grammar) | Semantic plugin state | `components/semantic/` |
| Presence (carets, selections) | Presence plugin + ephemeral messages | `components/collaboration/` |
| Workspace metadata (titles, stars, folders) | Local document index | `lib/documents.js` |
| Screens and app UI | React | `features/`, `components/` |
| Demo simulation | Demo modules only | `demo/` |

There is no second copy of document text anywhere. React never holds content and never renders inside the editor.

```
src/
  components/ui/            Shared primitives (Button, IconButton, Dropdown, Dialog, Popover, Select, Tabs, Tooltip, Toast, Avatar, ThemePicker)
  components/editor/        Editor surface, schema, commands, toolbar, menu bar, sync status
  components/semantic/      Semantic plugin, grammar check, analysis, rail, popover, Review panel
  components/collaboration/ Presence plugin and avatars
  components/documents/     Document list, menu, share dialog
  features/                 Screens: auth, onboarding, workspace, editor
  demo/                     Demo identity, scenarios, controls (DEMO_MODE)
  lib/                      Repo, document index, router, session, theme, formatting helpers
  styles/                   tokens.css first, then base, ui, and one file per domain
  design-system/            The browser-viewable design system
```

## Before any change

1. Understand the existing behaviour (run it, read the owning file).
2. Search for an existing component, style, and helper.
3. Check `styles/tokens.css`.
4. Check the editor plugins in `components/editor/createEditor.js`.
5. Check `client/package.json` for what's already installed.
6. Find the smallest owner for the change (table above).
7. Change the existing implementation whenever you can.
8. Add a file only for a genuinely new responsibility.

Don't start by creating another component.

## Adding a UI control

Use `components/ui/*` first. Need a new look? Add a `variant` or `size` to the existing primitive.
Don't create `EditorButton`, `SemanticButton`, `ToolbarButton2`. Screens import SemSync wrappers, never Radix directly.
Add the new state to the design-system page in the same change.

Icons come from `react-icons/md` (Material, as in Google Docs), imported one by one. Don't add another icon set.
No emoji as icons.

## Adding styles

- Never hardcode a colour, radius, spacing value, size, shadow or z-index. Use a token.
- If a real need isn't covered, add **one** token to `tokens.css` (and its dark override), then use it.
- Each class has one owner file. Primitives live in `ui.css`; domains in `workspace.css`, `editor.css`, `semantic.css`, `auth.css`, `onboarding.css`.
- Variants use `data-variant` / `data-size`; state uses ARIA (`aria-pressed`, `aria-current`, `aria-expanded`).
- Transitions name their properties (never `transition: all`). No animation libraries. Shadows only on floating layers; hover changes colour, not elevation.
- No `!important` (the reduced-motion rule in `base.css` is the single exception).

## Adding editor features

Decide what it is, then put it there:

| It is… | Put it in |
| --- | --- |
| Document structure or formatting stored in the doc | `schema.js` (node/mark + Automerge mapping) |
| An action on the document | `commands.js`, run with `editor.run(command)` |
| Non-document highlighting | A plugin's `DecorationSet` |
| Something keyed to positions that must survive edits | Plugin state, mapped through `tr.mapping` |
| Chrome around the page (title, dialogs, panels) | React in `features/editor/` |

Toolbar and menus read state from the editor (`useEditorState`) and dispatch commands. No duplicate React booleans like `isBold`.
Every content change must be a ProseMirror transaction so Automerge syncs it. Never touch the editor DOM.

## Adding semantic features

```
document change → changed range → analysis request → structured result
→ semantic plugin state → decoration → user action → ProseMirror transaction → Automerge sync
```

- Analysis never edits the document. It adds issues through `semantic.actions`.
- New issue kinds extend the issue model in `semanticPlugin.js`, the decoration mapping, `IssueDetails`/`IssueSummary`, and the design system. No new card or panel components.
- Failures set `analysis = "unavailable"`; editing must keep working.

## Adding dependencies

Before `npm install`, write down why. It must remove more complexity than it adds (size, API surface, updates).
No utility library for one helper, no second icon set, no UI framework because one component is hard to style.
Keep a single Automerge version (root `package.json` `overrides`).

## Modify before adding, delete what you replace

Extend `Button`, `Dropdown`, the issue model, the decoration plugin, or menu config instead of copying them.
When something replaces old code, delete the old code in the same change. No `ToolbarNew`, `ToolbarFinal`.
Keep functions small but meaningful. No plugin registries, factories or config engines.

## Worked example: add a "Neutral" semantic state

1. Extend the classification handling in `analysis.js` and the issue model comment in `semanticPlugin.js`.
2. Map it to an existing token, or add one token (with a dark override).
3. Extend the decoration class mapping in `semanticPlugin.js`.
4. Extend the label in `IssueSummary` / `IssueDetails`.
5. Show it on the design-system page.
6. Update the demo scenario if the evaluator should see it.

Wrong: a `NeutralConflictCard.jsx`, a `neutral.css`, a new icon package, a hardcoded colour, a copied popover.

## Test after each change

- Editor loads; typing works; selection behaves.
- Two tabs on the same document stay in sync (and `?as=atika` shows presence).
- Undo/redo work and never undo a collaborator's edit.
- Formatting works from toolbar, menu and shortcuts.
- Semantic decorations stay on the right text while editing; resolutions change the document in both tabs.
- Light and dark both look right; phone width has no horizontal scroll.
- No new console errors; `npm run build` passes.

## End-of-change cleanup

Search for and remove: unused imports, dead CSS, duplicate declarations or helpers, abandoned components,
`console.log`, temporary values, hardcoded colours or z-index, `!important`, new TODOs, needless wrapper elements.
