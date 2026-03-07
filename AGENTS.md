# Agent Development Rules

## Commit protocol

Use **Conventional Commits 1.0.0** for all commits.

## Decision priority

Apply standards in this strict order:

1. Obsidian standards and Obsidian plugin standards
2. Agent maintainability and efficiency for future automated maintenance
3. General software engineering best practices for the current stack

## Implementation notes

- Use Obsidian APIs instead of direct filesystem hacks
- Keep startup light; defer non-essential work to layout-ready
- Support desktop and mobile unless API constraints block it
- Avoid undocumented internals unless there is no supported alternative
- Keep dependencies minimal
- No telemetry, analytics, or external network use
