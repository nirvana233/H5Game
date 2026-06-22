# Web Platform Core Module Reference

Last verified: 2026-06-22

## Relevant APIs

- ES modules for production code organization.
- `performance.now()` or an injected monotonic clock for runtime timing.
- `requestAnimationFrame` for frame-aligned rendering updates.
- `AbortController` for cleaning up event listeners when modules are destroyed.

## Project Guidance

- Pure logic modules must not import DOM APIs.
- Runtime modules may call logic modules and presentation modules.
- Use dependency injection for clocks, seeded RNG, and storage adapters where testability matters.
