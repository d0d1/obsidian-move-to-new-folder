# Move modal action-area copy

## Context

The move modal creates a new folder and then moves the selected item into it.

The modal title already states the high-level operation:

- `Move file to new folder`
- `Move folder to new folder`

The question was whether the action area also needed extra explanatory copy to make the final action clearer.

## Problem

The original primary CTA was concise but narrow:

- `Move file`
- `Move folder`

That wording describes the final outcome, but it does not explicitly mention that a new folder is created as part of the action.

## Options explored

### Keep a short target-specific CTA

Examples:

- `Move file`
- `Move folder`

Assessment:

- concise
- natural button copy
- partially underspecified because it does not mention folder creation

### Use a shared CTA plus helper text

Tested CTA:

- `Create and move`

Tested helper direction:

- helper text near the action row explaining that a new folder would be created and the selected item would be moved into it

Assessment:

- helper placement near the buttons was better than placing explanatory text higher in the modal
- the pattern still created phrasing strain
- `Create and move` did not read as natural primary-button copy
- the helper text started doing too much work to compensate for a weak CTA

### Make the CTA fully explicit

Examples considered:

- `Create folder and move file`
- `Create folder and move folder`

Assessment:

- clearer
- too long and heavy for a primary button

## Decision

Do not use helper text to rescue weak primary CTA wording in this modal.

For now, keep the cleaner action area without extra helper copy. If this problem is revisited later, start by looking for a stronger primary CTA first rather than adding explanatory text around a weak one.

## Resulting guidance

- prefer concise, natural button copy
- avoid helper text whose main purpose is to make an awkward CTA acceptable
- treat helper text as optional support, not as a crutch for weak primary actions
- if no strong CTA emerges, keep the simpler action area
