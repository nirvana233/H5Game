# Web Platform Storage Module Reference

Last verified: 2026-06-22

## Relevant APIs

- `localStorage`
- JSON serialization

## Project Guidance

- Wrap storage calls in try/catch.
- Store versioned envelopes.
- Never block gameplay or restart on storage failure.
- Keep MVP local-only; no account or cloud sync.
