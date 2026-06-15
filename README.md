# WordSmith

A pay-what-you-will, open-source Microsoft Word clone. Runs in the browser today, packageable as a desktop app later.

## Features

- Rich-text editing on a familiar paginated page (Letter size with margins)
- Word-style ribbon: font family & size, bold/italic/underline/strikethrough, text & highlight color, paragraph styles (headings), alignment, ordered/unordered lists, indent, undo/redo, clear formatting
- Open real Microsoft `.docx` files (via mammoth)
- Export back to `.docx`, plus print / save-as-PDF
- Live word & character count
- Autosave to your browser so you never lose work

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build into dist/
npm run preview  # preview the production build
```

Then open the printed local URL in your browser.

## Tech

React + Vite. `.docx` import uses [mammoth](https://github.com/mwilliamson/mammoth.js); export uses [html-docx-js-typescript](https://github.com/lujqme/html-docx-js-typescript).

## Roadmap

- Desktop builds (Tauri/Electron) for direct local file open/save
- Tables, images, and page-break controls
- Find & replace, spell check
- Comments and track changes

## License

MIT. Pay what you will — contributions and tips welcome, but the code is free for everyone.
