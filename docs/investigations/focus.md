# Focus Investigation: initial focus in move modal

## Status

This issue is not fully solved.

The modal currently contains a straightforward intent to focus the `New folder name` input on open, but Obsidian may still place initial focus on `Filter folders...` at runtime on desktop. The codebase has been reverted to the cleanest known non-hacky version rather than keeping workaround logic that proved brittle.

## Problem statement

In the combined `Move file to new folder` modal, the desired behavior was:

- initial caret in `New folder name`
- immediate focused border/highlight on that same input

Observed behavior in testing:

- Obsidian frequently moved initial focus to `Filter folders...`
- some workaround variants placed the caret in `New folder name` but the visual focus highlight appeared with a noticeable flicker or delay
- one workaround variant removed visible focus from both text inputs and effectively left focus on the folder list instead

## Why this matters

This is a polish issue, but it intersects with platform behavior and maintainability:

- the UX goal is reasonable
- repeated ad hoc focus hacks quickly become fragile
- the project rules prioritize Obsidian standards first and agent-maintainable code second

That means the correct bar is not "make it seem fixed once on one machine"; it is "use a solution that is technically defensible and likely to remain stable across Obsidian updates."

## What was tried

### 1. Immediate focus on `New folder name`

Implementation shape:

- call `nameInput.focus()`
- call `nameInput.select()`

Result:

- at runtime, Obsidian still often placed effective initial focus on `Filter folders...`
- arrow-key behavior suggested focus was not reliably staying on the desired input

Assessment:

- clean and reasonable
- insufficient to force the desired runtime outcome

### 2. Delayed focus with `requestAnimationFrame(...)`

Implementation shape:

- wait one animation frame
- then call `nameInput.focus()` and `nameInput.select()`

Result:

- caret appeared in `New folder name`
- however, the focus border/highlight visually lagged and flickered in after the caret

Assessment:

- improved target field selection
- introduced a visual artifact that did not match native-quality Obsidian UI behavior

### 3. Temporary `tabIndex = -1` on `Filter folders...` during modal open

Implementation shape:

- make the filter input temporarily non-tabbable
- focus `New folder name`
- restore normal tab order on the next frame

Result:

- prevented the filter input from trivially winning focus
- but in testing, focus could land on the list/modal instead of a text input
- arrow keys then scrolled the list, indicating the wrong element held focus

Assessment:

- clearly workaround-style logic
- not stable enough to keep
- rejected and reverted

### 4. Combined `tabIndex` workaround plus delayed focus

Implementation shape:

- remove filter from tab order temporarily
- wait a frame
- focus/select the name input
- restore filter tab order

Result:

- produced the same general class of non-native focus behavior
- either the focus highlight lagged or the runtime behavior remained inconsistent

Assessment:

- too hacky relative to the value of the issue
- rejected and reverted

## Investigation findings

### Bundled Obsidian app evidence

Local inspection of the installed Obsidian desktop bundle showed:

- bookmark-specific modal styling exists in the core app CSS:
  - `.modal.mod-bookmark .setting-item-control input`

This suggests the bookmark dialog is implemented as a more standard Obsidian modal/form structure rather than relying on obvious custom focus hacks.

### Likely cause

The likely cause is Obsidian's own modal/focus lifecycle, not just our explicit focus call.

During investigation, bundled app code suggested Obsidian has a focus-management fallback that can target the first tabbable control in a scoped container. That makes our current layout vulnerable because:

- `Filter folders...` appears before `New folder name` in the DOM
- if Obsidian's focus manager runs after our direct focus call, it may override the target

This is a plausible explanation for why the filter input repeatedly won focus even when `nameInput.focus()` was called.

## Why the hacks were reverted

They failed the project quality bar for at least one of these reasons:

- inconsistent runtime behavior
- visible flicker
- incorrect focus ending up on the list
- dependence on timing and temporary tab-order manipulation

Those approaches are not good enough to preserve as permanent code in this project.

## Current code policy

The repository should keep the clean baseline:

- a direct `nameInput.focus()` / `nameInput.select()` intent is acceptable
- timing hacks and temporary `tabIndex` tricks are not

If Obsidian overrides that focus, the issue remains documented rather than papered over with brittle logic.

## Recommended future path

If this issue becomes worth revisiting, do not start by re-trying timing hacks.

Recommended sequence:

1. Study the built-in Bookmarks modal structure more closely.
2. Determine whether it uses a different form/layout composition that affects initial focus naturally.
3. Check whether our modal should be restructured so the desired field is the first tabbable input in DOM order while preserving the visual layout.
4. Only introduce a workaround if it is clearly justified, stable, and materially better than the current behavior.

## Explicitly rejected approaches

Unless there is new evidence, do not re-try these as blind experiments:

- `requestAnimationFrame(...)` focus sequencing as the main fix
- temporary `tabIndex = -1` removal on the folder filter input
- mixed timing plus `tabIndex` focus workarounds
- CSS-only attempts to fake focus highlight without actually fixing focus ownership

## Practical conclusion

The issue is real, the attempted fixes were recorded, and the current choice is intentional:

- keep the implementation clean
- accept the unresolved focus quirk for now
- revisit only with a better understanding of the native Obsidian core-plugin pattern
