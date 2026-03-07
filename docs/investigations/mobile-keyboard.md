# Mobile Keyboard Investigation: input obscured by Android keyboard

## Status

This issue is resolved for the current release direction, but not in the ideal originally requested way.

The original goal was to keep the input visible above the Android keyboard while preserving the same centered modal behavior. That was not achieved cleanly. Instead, the accepted solution was to move `New folder name` higher in the modal layout so the mobile experience is acceptable without retaining brittle keyboard-avoidance hacks.

## Problem statement

Desired behavior:

- the user taps `New folder name`
- the keyboard opens
- the text input stays visible above the keyboard while typing
- when typing ends and the keyboard closes, the modal returns to its normal layout

Observed behavior before the accepted layout change:

- the Android keyboard could cover `New folder name`
- the user might not be able to see what they were typing
- attempted fixes created either no meaningful movement or dead space in the modal without actually solving the occlusion

## Why this matters

This is a real usability problem on mobile, not just polish.

- typing into a hidden field is poor UX
- repeated CSS and timing tweaks are easy to add and hard to justify
- the project rules require a maintainable solution, not a pile of speculative mobile hacks

## Technical context

This plugin UI is not a native Android screen. It is:

- a plugin UI
- rendered inside Obsidian mobile
- inside Obsidian's modal system
- effectively running as hosted web UI inside a mobile WebView environment

That means plugin code likely does not control:

- the host Android activity keyboard resize policy
- the host WebView keyboard behavior
- the app-wide viewport policy
- the modal host container semantics

This boundary is the key reason the issue is harder than normal web-form work.

## What was tried

### 1. Make modal content scrollable and call `scrollIntoView()`

Implementation shape:

- allow `.modal-content` to scroll
- call `scrollIntoView()` on the name section when the input was focused

Result:

- the keyboard still covered the input in testing
- scrolling the section did not reliably move the visible field above the keyboard

Assessment:

- reasonable first attempt
- insufficient in the hosted modal environment

### 2. Delayed and repeated scroll attempts after focus

Implementation shape:

- after focus, run scroll logic on a delay
- repeat scrolling during the expected keyboard animation window

Result:

- no reliable improvement
- the field still remained obscured in real Android testing

Assessment:

- timing-based workaround
- not strong enough to keep

### 3. Reduce folder list height on mobile

Implementation shape:

- cap the folder list height more aggressively on mobile
- attempt to create more usable room for the rest of the form

Result:

- did not solve the actual occlusion
- at best it changed internal spacing pressure

Assessment:

- harmless by itself
- not a real keyboard-avoidance solution

### 4. Resize modal content using `window.visualViewport.height`

Implementation shape:

- compute a mobile max-height using `visualViewport.height`
- apply that to the modal content area

Result:

- the modal gained extra empty space in testing
- the field still did not move above the keyboard

Assessment:

- demonstrated that internal size changes alone were not enough
- rejected

### 5. Reposition the modal using `visualViewport.offsetTop` and explicit modal height

Implementation shape:

- compute a top offset and height from `visualViewport`
- set CSS variables on the modal so it would behave more like a fixed sheet inside the visible viewport

Result:

- produced dead space / empty space in the modal
- the modal still did not visibly shift/shrink in the way needed
- the field still remained covered by the keyboard

Assessment:

- more invasive than the earlier attempts
- still failed in actual testing
- rejected and reverted

### 6. Keep fighting the existing centered modal design

Implementation shape:

- continue adapting the current single centered modal while preserving the same overall interaction model

Result:

- repeated attempts did not achieve the target behavior
- evidence accumulated that the issue is at the host/modal boundary, not just inside the plugin's local DOM

Assessment:

- not a productive path without better runtime evidence

## What was learned

### The current modal design is likely working against mobile text entry

The plugin currently uses a desktop-style modal pattern. On Android, the input can live too low in the modal for robust keyboard-safe interaction.

### Moving the input higher is an acceptable product compromise

The final accepted approach was not a true keyboard-avoidance implementation.

Instead:

- `New folder name` was moved above `Parent folder`
- that places the text field in a better location for mobile use
- the result is acceptable for release even though it does not reproduce ideal native mobile keyboard behavior

This is an intentional product decision, not an accidental leftover state.

### Local DOM scrolling is not the same as real keyboard avoidance

The repeated failed attempts suggest:

- the modal's local content can move
- but the modal as a visible unit is still constrained by host behavior the plugin does not control

That explains the observed "dead space but no real fix" failure mode.

### `visualViewport` is not enough by itself here

`visualViewport` provided numbers, but using them did not produce reliable user-visible keyboard avoidance in this hosted environment.

That does not prove `visualViewport` is useless in general. It does show that it is not a standalone fix for this plugin modal.

## Why the hacks were reverted

They failed the project quality bar because they caused one or more of:

- no meaningful improvement in real Android testing
- additional empty space / degraded layout
- higher implementation complexity without confidence
- reliance on host behavior the plugin probably does not control

Those are not acceptable long-term tradeoffs for this codebase.

## Current code policy

The repository should keep the clean baseline:

- do not retain speculative `visualViewport` sizing/repositioning hacks that already failed
- do not keep repeated focus/scroll timing tricks for this issue
- prefer a structurally simpler mobile UI
- keep the current higher input placement unless there is a clearly better mobile-safe alternative

## Recommended future path

If this issue becomes worth revisiting, do not restart from the same failed assumptions.

Recommended sequence:

1. Treat the current centered modal as suspect for mobile text entry.
2. Prefer a mobile-specific interaction pattern rather than trying to force native-style keyboard avoidance inside the same modal.
3. Best candidate approach:
   - mobile-specific two-step flow, or
   - a top-anchored mobile layout with the text input much higher on screen
4. Use `visualViewport` only as a secondary enhancement after the interaction pattern itself is mobile-appropriate.
5. Re-test on a real Android device after each structural change.

## Explicitly rejected approaches

Unless there is new evidence, do not re-try these as blind experiments:

- repeated `scrollIntoView()` timing variants
- delayed multi-pass focus/scroll hacks
- internal modal-content resizing as the main fix
- explicit modal repositioning from `visualViewport` numbers alone
- continuing to tweak the same centered modal layout without changing the mobile interaction model

## Practical conclusion

The issue was investigated thoroughly and the current conclusion is intentional:

- the ideal keyboard-avoidance behavior was not achieved
- previous workaround attempts were not good enough to keep
- the accepted release solution is the higher input placement in the modal
- if this is revisited, the next serious step should be a different mobile interaction pattern rather than more local keyboard hacks inside the same modal
