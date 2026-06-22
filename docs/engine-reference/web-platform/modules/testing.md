# Web Platform Testing Module Reference

Last verified: 2026-06-22

## Relevant APIs

- Node.js built-in `node:test`
- Node.js built-in `assert`

## Project Guidance

- Unit-test pure logic modules without a browser.
- Use integration smoke tests for runtime event order and documentation invariants.
- Browser visual verification remains manual until a browser automation stack is intentionally added.
