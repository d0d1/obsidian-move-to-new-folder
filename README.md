# Move to New Folder

`Move to New Folder` is an Obsidian community plugin that improves the workflow for moving a note into a newly created folder.

Instead of typing a full destination path in one step, it uses a fast two-step flow:

1. Choose an existing parent folder from a searchable picker.
2. Enter the new child folder name.

Then the plugin creates the folder (if needed) and moves the note safely.

## Features

- Command palette action: `Move note to new folder`
- File explorer context menu action: `Move note to new folder`
- File menu support for open note tabs when Obsidian emits `file-menu` for that source
- Searchable parent-folder picker with keyboard and mouse navigation
- Separate prompt for the new folder name (no manual full-path typing)
- Folder conflict handling:
  - If folder exists, prompt to reuse or cancel
  - If a file exists at folder path, stop with an error notice
- File conflict handling:
  - Never overwrites an existing destination note
- Safe move implementation through Obsidian `FileManager.renameFile` so Obsidian link behavior is preserved according to user preferences
- Setting: default picker selection to current note parent folder

## Platform support

- `isDesktopOnly` is set to `false`
- Designed to support desktop and mobile
- Primary test targets: Windows and Android
- Other Obsidian-supported platforms should work, but are not fully validated yet

## Installation (manual)

1. Build the plugin:
   - `npm install`
   - `npm run build`
2. Copy these files to your vault plugin folder:
   - `main.js`
   - `manifest.json`
   - `styles.css`
3. Enable **Move to New Folder** in Obsidian community plugins.

## Usage

### From file explorer

1. Right-click a markdown note.
2. Choose `Move note to new folder`.
3. Pick a parent folder.
4. Enter new folder name.
5. Confirm.

### From command palette

1. Open the target markdown note.
2. Run `Move note to new folder`.
3. Complete the same two-step flow.

## Settings

- **Default parent to current note folder**
  - When enabled, parent folder picker starts from the current note's parent.
  - When disabled, it defaults to vault root.

## Development

- Build: `npm run build`
- Watch mode: `npm run dev`

Release assets:

- `main.js`
- `manifest.json`
- `styles.css` (optional but provided)

## Privacy and external services

- No telemetry
- No analytics
- No network access
- No account required
- No payments/subscriptions
- No external service dependencies at runtime

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md).
