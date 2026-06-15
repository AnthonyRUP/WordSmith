# WordSmith — Development Plan

A phased roadmap from the current v0.1 editor to a credible, open-source Word alternative. Each phase ships something usable; nothing here requires a big-bang rewrite.

## Where we are (v0.1 — done)

React + Vite web app with a Word-style ribbon, paginated Letter page, live word count, autosave, `.docx` open/export, HTML export, and print/PDF. The editor currently uses the browser's built-in `execCommand` engine.

## Guiding principles

- Ship a working app at the end of every phase.
- Prefer boring, well-supported libraries over bespoke code.
- Fidelity to real `.docx` is the north star — round-tripping a document without losing formatting is the headline feature.
- Keep it contributor-friendly: small modules, clear boundaries, tests on the risky parts.

---

## Phase 1 — Foundation & editor engine (highest priority)

The single most important technical decision. `execCommand` is deprecated and inconsistent across browsers; it will cap how far the editor can go (tables, comments, track changes all become painful). Replacing it now, while the surface area is small, is far cheaper than later.

- Migrate the editing surface to a dedicated rich-text framework — **Lexical** (Meta) or **ProseMirror**. Lexical is recommended: smaller learning curve, React-native, strong plugin model.
- Model the document as a structured tree (nodes for paragraphs, runs, headings, lists) rather than raw HTML. This becomes the backbone for clean `.docx` mapping.
- Re-implement the existing ribbon actions against the new engine.
- Add a proper undo/redo history tied to the document model.

Exit criteria: feature parity with v0.1 on the new engine, with a structured document model underneath.

## Phase 2 — Document fidelity & core objects

Make WordSmith handle the content people actually put in documents.

- **Tables**: insert, resize, add/remove rows & columns, cell alignment, borders.
- **Images**: insert from file, drag-to-resize, inline vs. wrapped placement.
- **Lists**: multi-level nesting, restart numbering, bullet/number style choices.
- **Page model**: real page breaks, margins UI, page size (Letter/A4), headers & footers, page numbers.
- **Links & bookmarks**: edit/remove links, internal cross-references.

Exit criteria: a document with tables, images, and headers exports to `.docx` and reopens in Microsoft Word looking right.

## Phase 3 — `.docx` round-trip fidelity

The current export uses an HTML→docx shim — fine for simple docs, lossy for complex ones.

- Replace export with structured generation from the document model using the **`docx`** library (or direct OOXML writing).
- Improve import mapping (styles, numbering, tables, images) from mammoth, or move to a custom OOXML reader for fuller fidelity.
- Build a round-trip test corpus: a set of real `.docx` files that must open → export → reopen with no visible loss.
- Support `.doc` (legacy) import as best-effort, and `.odt` if cheap.

Exit criteria: the test corpus round-trips cleanly; export covers everything Phase 2 introduced.

## Phase 4 — Productivity features

The everyday tools that make an editor feel complete.

- Find & replace (with regex option).
- Spell check (browser-native first; later a bundled dictionary).
- Styles panel: named paragraph/character styles, not just ad-hoc formatting.
- Word count details (selection count, reading time), document outline / navigation pane.
- Keyboard shortcut parity with Word (Ctrl/Cmd+B, etc.) and a shortcut reference.

Exit criteria: a writer can do a full editing session without reaching for another app.

## Phase 5 — Persistence, files & collaboration

- Local file open/save that survives reloads (File System Access API on supported browsers).
- Optional cloud sync / account layer (kept modular so self-hosters can swap it).
- Real-time collaboration via CRDT (**Yjs**) — Lexical/ProseMirror both have Yjs bindings, which is another reason to migrate early.
- Comments and track changes (depends on the structured model from Phase 1).
- Version history.

Exit criteria: two people can edit the same document simultaneously with comments.

## Phase 6 — Desktop app

- Wrap the web app with **Tauri** (preferred — small binaries, Rust core) or Electron.
- Native open/save dialogs and OS file associations for `.docx`.
- Auto-update channel.
- macOS, Windows, and Linux builds in CI.

Exit criteria: downloadable installers that open local files directly.

## Phase 7 — Polish, performance & community

- Performance pass for large documents (virtualized rendering, lazy pagination).
- Accessibility (screen-reader support, full keyboard navigation, WCAG pass).
- Theming / dark mode; localization scaffolding.
- "Pay what you will" support links, sponsorship, and contribution funnel.

---

## Cross-cutting workstreams (run continuously)

- **Testing**: unit tests for `.docx` mapping; end-to-end tests (Playwright) for editor behavior; the round-trip corpus from Phase 3 as a regression gate.
- **CI/CD**: lint, test, and build on every PR; preview deploys for the web app.
- **Docs & contribution**: `CONTRIBUTING.md`, architecture notes, good first issues, and a public roadmap mirroring this file.
- **Releases**: semantic versioning, changelog, tagged releases.

## Suggested immediate next steps

1. Decide the editor engine (recommend Lexical) and spike a migration of the current ribbon onto it.
2. Stand up CI (lint + build + a smoke test) so quality is enforced from the start.
3. Add a `CONTRIBUTING.md` and convert this plan's phases into tracked issues/milestones.

## Risks & open questions

- **`.docx` fidelity is the hardest part** and easy to underestimate; budget generously and lean on the test corpus.
- **Engine migration cost** grows with every feature built on `execCommand`, so do it before Phase 2.
- **Scope discipline**: Word has thousands of features. Define a "good enough" bar per feature and resist gold-plating.
- **Licensing of dependencies** should stay compatible with MIT.
