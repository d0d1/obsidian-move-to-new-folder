# Contributing

## Commit standard

This project uses **Conventional Commits 1.0.0**.

Examples:

- `feat: add tab file-menu integration`
- `fix: handle modal close without selection`
- `docs: document android test checklist`

## Engineering priority order

When making changes, follow this order:

1. Obsidian standards and Obsidian plugin standards
2. Optimize for agent-driven development and long-term agent maintainability
3. Then apply general best practices for the technologies in use

## Plugin-specific guidelines

- Use Obsidian APIs for file/folder operations
- Prefer safe rename/move APIs (`FileManager.renameFile`)
- Keep `onload()` lightweight
- Defer heavier work to `workspace.onLayoutReady()` when relevant
- Avoid unnecessary whole-vault scans
- Keep UI sentence case and concise
- Do not add telemetry or network dependencies
