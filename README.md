# Move to New Folder

`Move to New Folder` is an Obsidian community plugin that moves a file or folder into a newly created folder without requiring you to type the full destination path.

## What it does

- Adds `Move file to new folder...` for notes
- Adds `Move folder to new folder...` in the file explorer for folders
- Lets you choose a parent folder from a searchable picker
- Creates the new child folder and moves the target safely with Obsidian APIs
- Preserves Obsidian's normal link-update behavior when moving files

## How to use it

### File explorer

1. Right-click a note or folder.
2. Choose `Move file to new folder...` or `Move folder to new folder...`.
3. Pick the parent folder.
4. Enter the new folder name.
5. Confirm the move.

### Command palette

1. Open a note.
2. Run `Move file to new folder...`.
3. Complete the same modal flow.

Folder moves are supported from the file explorer context menu.

## Settings

- **Default parent to current note folder**: start the picker from the active note's parent instead of vault root

## Platform support

- Designed for desktop and mobile
- Tested primarily on Windows and Android
- Other supported Obsidian platforms may work but are not fully validated yet

## Install with BRAT

This plugin is currently in beta and can be installed through BRAT before official Community Plugins submission.

1. Install and enable the BRAT plugin in Obsidian.
2. In BRAT, choose to add a beta plugin from GitHub.
3. Enter `d0d1/obsidian-move-to-new-folder`.
4. Install **Move to New Folder** from BRAT.

## Install from GitHub release

If you prefer not to use BRAT, you can install the plugin from the latest GitHub release:

1. Download `move-to-new-folder-<version>.zip` from the latest release.
2. Create the folder `.obsidian/plugins/move-to-new-folder/` in your vault if it does not already exist.
3. Extract the ZIP contents into that folder.
4. Enable **Move to New Folder** in Obsidian.

## Privacy and external services

- No telemetry
- No analytics
- No network access
- No account requirement
- No payments or subscriptions
- No external service dependencies at runtime
