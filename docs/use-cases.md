# Use cases

This document shows concrete ways to use `Move to New Folder` beyond the README overview.

## Move a note into a new project folder

Use this when a note starts as a loose capture and later deserves its own folder.

Example:
- You create `Project idea.md` in your vault root.
- Later, you want it under `Projects/Project idea/`.

Flow:
1. Right-click `Project idea.md` or run `Move file to new folder...` from the command palette while the note is open.
2. Select `Projects` as the parent folder.
3. Enter `Project idea` as the new folder name.
4. Confirm the move.

Result:
- The plugin creates `Projects/Project idea/` if needed.
- The note is moved into that folder using Obsidian’s file manager behavior.
- Obsidian handles link updates according to the user’s settings.

## Start from the current note’s folder

Use this when the new folder should usually live next to the current note.

Example:
- You are working inside `Clients/Acme/Notes/meeting.md`.
- You want to create a new sibling folder under `Clients/Acme/Notes/` and move the note into it.

Flow:
1. Enable `Default parent to current note folder` in plugin settings.
2. Run `Move file to new folder...`.
3. Keep the preselected parent folder or adjust it.
4. Enter the new folder name and confirm.

Result:
- The picker starts from the current note’s parent folder instead of vault root.
- The number of steps is reduced for the common case.

## Move a folder into a new grouping folder

Use this when an existing folder should be wrapped in a newly created parent folder.

Example:
- You already have a folder named `Acme`.
- You want it moved under a new folder like `Archived clients/Acme/`.

Flow:
1. Right-click the `Acme` folder in the file explorer.
2. Choose `Move folder to new folder...`.
3. Select `Archived clients` as the parent folder.
4. Enter the new folder name.
5. Confirm the move.

Result:
- The plugin creates the new folder under the chosen parent.
- The selected folder is moved into that location.

## Reuse an existing folder when appropriate

Use this when the destination parent already contains a folder with the name you want.

Example:
- You choose parent folder `Projects`.
- You enter `Acme`, but `Projects/Acme/` already exists.

Flow:
1. Start the move normally.
2. When the plugin detects the existing folder, review the confirmation dialog.
3. Choose `Back` to change the parent or folder name, or continue with the move if reusing the folder is correct.

Result:
- The plugin does not silently assume the right conflict behavior.
- You keep control over whether the existing folder should be used.

## Use file explorer for folder moves and command palette for file moves

The plugin supports two primary entry points, and each one is better suited to a different target type.

Recommended pattern:
- Use the command palette when you are already editing a note and want to move that file.
- Use the file explorer context menu when you want to move either a file or a folder.

Reason:
- Files have a clear active-note context in Obsidian.
- Folders are more naturally selected from the file explorer.

## Keep the workflow fast during vault cleanup

Use the plugin when reorganizing a vault that has many notes sitting in overly broad folders.

Example cleanup pattern:
1. Identify a note that deserves its own folder.
2. Trigger `Move file to new folder...`.
3. Pick the destination parent from the searchable folder list.
4. Create the new folder directly from the modal.
5. Repeat for the next note.

Why this is useful:
- You do not have to type full destination paths by hand.
- You can stay inside one focused workflow instead of switching between folder creation and move actions.
