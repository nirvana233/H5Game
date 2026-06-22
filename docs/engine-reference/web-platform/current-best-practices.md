# Web Platform Current Best Practices

Last verified: 2026-06-22

## Runtime Structure

- Keep gameplay rules in pure JavaScript modules.
- Keep DOM rendering and feedback in presentation modules.
- Use a single runtime coordinator for frame update and state-machine event ordering.
- Use immutable event payloads between systems where practical.

## Input

- Prefer Pointer Events for gameplay drag.
- Track one active pointer for MVP.
- Cache layout at drag start and cancel drag on layout invalidation.
- Coalesce preview rendering to `requestAnimationFrame`.

## Storage

- Wrap Web Storage access in an adapter.
- Treat storage failure as non-fatal.
- Version stored payloads.

## Performance

- Avoid full DOM rebuilds during pointermove.
- Use CSS transforms for moving drag ghosts and feedback.
- Use small optimized assets and CSS fallback shapes.
- Keep the 6x8 board logic independent from the DOM so smoke tests can run in Node.
