# Release Readiness

Status date: 2026-03-07

This document tracks submission readiness for the Obsidian community plugin review process.

## Status summary

- Ready to submit: no
- Buildable release asset state: yes
- Runtime testing complete across claimed platforms: pending final maintainer confirmation

## Checklist audit

### 1. Basic repo/release setup

- `PASS` Root [README.md](/home/dbhul/code/obsidian-move-to-new-folder/README.md) exists and explains the plugin.
- `PASS` Root [LICENSE](/home/dbhul/code/obsidian-move-to-new-folder/LICENSE) exists.
- `PASS` Root [manifest.json](/home/dbhul/code/obsidian-move-to-new-folder/manifest.json) exists and is valid JSON.
- `PASS` GitHub release assets have been created and uploaded.
- `PASS` Release tag/version alignment is prepared with tag `1.0.0`.
- `PASS` Root [versions.json](/home/dbhul/code/obsidian-move-to-new-folder/versions.json) exists and maps plugin version to minimum Obsidian version.

### 2. Naming and metadata

- `PASS` Plugin id is `move-to-new-folder` and matches the intended submission id.
- `PASS` Manifest description is short and does not include the word `Obsidian`.
- `PASS` Sample-plugin placeholder names are gone.
- `PASS` Command names are clean and not redundantly prefixed with plugin name or id.

### 3. Platform testing

- `PASS` Windows and Android have been primary manual test targets.
- `UNKNOWN` macOS and Linux testing has not been confirmed in this document.
- `UNKNOWN` iOS testing has not been confirmed in this document.
- `PASS` The code uses Obsidian platform checks and avoids desktop-only modules in runtime plugin code.

### 4. Obsidian-specific compatibility

- `PASS` No default hotkeys are assigned.
- `PASS` Styling is scoped under plugin-specific classes.
- `PASS` No global `app` usage; plugin code uses `this.app`.
- `PASS` No `as any` shortcuts are present.
- `PASS` Preferred Obsidian APIs are used for the implemented feature set:
  - `loadData()` / `saveData()`
  - `normalizePath()`
  - `Vault`
  - `FileManager.renameFile()`
- `PASS` No filesystem hacks are used for move operations.

### 5. Performance

- `PASS` [main.js](/home/dbhul/code/obsidian-move-to-new-folder/main.js) is built from the production build command.
- `PASS` `onload()` is lightweight.
- `PASS` menu registration work is deferred to `workspace.onLayoutReady()`.
- `PASS` Event listeners are registered through Obsidian lifecycle management.
- `PASS` Load time has been checked in Obsidian's startup profiler / stopwatch view.

### 6. Security and policy

- `FAIL` Developer policy review is not explicitly documented as completed.
- `PASS` README discloses runtime behavior relevant to policy:
  - no telemetry
  - no analytics
  - no network access
  - no account required
  - no payments/subscriptions
  - no external service dependencies at runtime
- `PASS` No client-side telemetry.
- `PASS` Dependencies are minimal and a lockfile is committed.
- `UNKNOWN` Reused-code attribution is not known to be needed; no intentional code reuse from another plugin is documented.

### 7. UI polish

- `PASS` Settings UI uses sentence case.
- `PASS` No extra settings heading remains for a single-section settings page.
- `PASS` No unnecessary `console.log` noise remains in the plugin source.

### 8. Submission

- `PASS` Initial public GitHub release is published.
- `FAIL` Submission PR to `obsidianmd/obsidian-releases` has not been prepared.
- `UNKNOWN` Ongoing maintenance commitment is a maintainer decision, not a codebase property.
