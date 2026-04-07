# FAQ

## What problem does this plugin solve?

Obsidian’s built-in move flow works well when you already know the full destination path. This plugin improves the case where you want to create a new folder during the move without manually typing the whole path.

## What can the plugin move?

The plugin supports:
- files
- folders from the file explorer context menu

## How do I move a file?

You can:
- right-click a file in the file explorer and choose `Move file to new folder...`
- run `Move file to new folder...` from the command palette while the note is open

## How do I move a folder?

Right-click the folder in the file explorer and choose `Move folder to new folder...`.

## Why is folder move not available in the command palette?

The plugin intentionally keeps folder moves on the file explorer context menu because folders do not have the same active-document context that notes do.

## Does the plugin create the destination folder automatically?

Yes. After you choose the parent folder and enter the new folder name, the plugin creates the child folder if it does not already exist.

## What happens if the folder already exists?

The plugin does not silently guess. It shows a confirmation flow so you can decide whether to go back or continue using the existing folder.

## What happens if moving the file would overwrite something?

The plugin does not overwrite silently. It checks for conflicts and stops with a notice instead of replacing existing content.

## Does the plugin preserve Obsidian link behavior?

Yes. File moves use Obsidian’s file manager behavior so link updates continue to follow the user’s Obsidian settings.

## Does the plugin work on mobile?

It is designed for desktop and mobile. It has been tested on Windows, Android, and Linux.

## Does the plugin use the network?

No.

## Does the plugin collect telemetry or analytics?

No.

## Does the plugin require an account, subscription, or external service?

No.

## How do I install it before Community Plugins approval?

Use BRAT or install it from the latest GitHub release. The README covers both paths.
