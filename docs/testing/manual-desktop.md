# Manual desktop testing

## General

- [ ] Plugin loads without errors in Obsidian desktop
- [ ] `Move file to new folder...` appears in the command palette
- [ ] File explorer note context menu shows `Move file to new folder...`
- [ ] File explorer folder context menu shows `Move folder to new folder...`

## File flow

- [ ] Running from the file explorer acts on the clicked note
- [ ] Running from the command palette acts on the active note
- [ ] The modal title is correct for file moves
- [ ] The default selected parent folder is correct when `Default parent to current note folder` is enabled
- [ ] The default selected parent folder is visible at the top of the folder list on open
- [ ] The parent folder can be changed by clicking
- [ ] The parent folder can be changed with keyboard navigation
- [ ] `Filter folders...` narrows the list correctly
- [ ] `New folder name` accepts valid names
- [ ] The primary action is disabled for an empty folder name
- [ ] The primary action is disabled for an invalid folder name
- [ ] An invalid non-empty folder name shows an inline error
- [ ] A valid folder name clears the inline error and enables the primary action
- [ ] Pressing `Enter` in `New folder name` submits when valid
- [ ] A missing destination folder is created automatically
- [ ] The file is moved into the selected destination folder
- [ ] Obsidian updates links according to the current link-update preference
- [ ] The moved note is reopened or remains accessible as expected

## Folder flow

- [ ] Running from the file explorer acts on the clicked folder
- [ ] The modal title is correct for folder moves
- [ ] The selected folder is moved into the newly created destination folder
- [ ] Child files and folders move with it as expected

## Conflicts and errors

- [ ] If the target folder already exists, the reuse dialog appears
- [ ] Choosing `Back` returns to the previous modal instead of closing the flow
- [ ] Choosing `Move file` or `Move folder` reuses the existing folder and continues
- [ ] Closing the reuse dialog cancels the flow safely
- [ ] If a file already exists at the intended folder path, the plugin shows an error
- [ ] If a destination file already exists, the plugin does not overwrite it silently
- [ ] If a destination folder already exists for a folder move, the plugin does not overwrite it silently
- [ ] `Cancel` closes the move modal without changes
- [ ] The close button closes the move modal without changes

## Settings

- [ ] With `Default parent to current note folder` enabled, the current note parent is the default
- [ ] With it disabled, vault root is the default
- [ ] The setting persists after reload
