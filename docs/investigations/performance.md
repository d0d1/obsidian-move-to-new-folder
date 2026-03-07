# Performance Investigation: modal open-time console violations

## Status

This issue is only partially improved.

Opening the move modal previously triggered browser console warnings such as:

- `[Violation] 'click' handler took 483ms`
- `[Violation] Forced reflow while executing JavaScript took 199ms`

One targeted performance pass improved those numbers to:

- `[Violation] 'click' handler took 361ms`
- `[Violation] Forced reflow while executing JavaScript took 186ms`

The improvement was real but modest. The issue is not fully solved.

## Problem statement

When opening the move modal, the browser console reported relatively heavy synchronous work and layout cost. The goal was not to eliminate every warning blindly, but to reduce obviously avoidable work without making the code more fragile.

## Why this matters

- large click-handler work can make modal opening feel sluggish on larger vaults
- forced reflow warnings are a sign that rendering and layout work may be more expensive than necessary
- performance work can easily become low-ROI if it turns into speculative DOM surgery

That means the bar here is:

- keep improvements that are simple and defensible
- stop when the next steps become invasive without clear evidence

## Initial hypothesis

The main suspected sources were:

1. scanning and sorting all folders on every modal open
2. immediate DOM-heavy list rendering and selection reveal work

## What was tried

### 1. Cache folder paths in the plugin instead of scanning on every modal open

Implementation shape:

- move folder-path collection out of the modal
- cache the sorted folder list in the plugin
- invalidate the cache on vault `create`, `delete`, and `rename`
- pass the cached folder paths into the modal constructor

Result:

- click-handler warning improved from about `483ms` to about `361ms`
- forced reflow warning improved from about `199ms` to about `186ms`

Assessment:

- worthwhile improvement
- low complexity
- maintainable
- kept

## What was learned

### The vault scan was part of the cost, but not the whole problem

Removing the scan from modal open improved the timing, especially the click-handler warning. That confirms the scan/sort work mattered.

### The remaining cost is likely dominated by DOM rendering and layout

The remaining warnings suggest the heavier cost is now probably in:

- creating the full folder list DOM
- updating selection state
- revealing the selected item at open time

That is a different class of problem than the whole-vault scan.

## Why no further performance pass was pursued

Only one focused pass was budgeted for this issue.

The next likely steps would be more invasive and lower-ROI:

- incremental list updates instead of rebuilding
- reducing or restructuring selection reveal logic
- deeper profiling of layout/reflow hotspots
- possibly list virtualization or larger rendering changes

Those are harder to justify without evidence that the real UI still feels slow enough to warrant the complexity.

## Current code policy

The repository should keep the folder-path cache improvement because it is:

- simple
- justified by measured improvement
- low-risk

But it should not accumulate speculative performance hacks without profiling evidence.

## Recommended future path

If performance becomes worth revisiting, do it with real profiling rather than broad guessing.

Recommended sequence:

1. Reproduce the warning in a representative large vault.
2. Profile the modal open path to confirm whether DOM rendering is now the dominant cost.
3. Investigate whether the initial list render can be reduced or deferred.
4. Investigate whether the selected-item reveal can be made less layout-expensive.
5. Only consider more invasive list rendering changes if real UX still feels slow.

## Explicitly rejected approaches

Do not start the next investigation by blindly piling on generic optimizations.

Avoid:

- speculative virtualization without evidence it is needed
- broad DOM rewrites without profiling
- retaining hacks that reduce console warnings but make the code less maintainable

## Practical conclusion

This issue was investigated once and improved once.

- The folder-path cache is worth keeping.
- The console warnings were reduced but not eliminated.
- The remaining cost is likely in DOM rendering/reflow rather than vault scanning.
- Further work should be profiling-driven, not assumption-driven.
