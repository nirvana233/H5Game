# ADR-0005: Node Smoke Test Harness

## Status

Accepted — 2026-06-22

## Context

The project needs fast verification for deterministic rules before adding production code. Browser automation can be added later, but MVP rule regressions should be caught with no external dependencies.

## Decision

Use Node.js built-in `node:test` and `assert` for unit and integration smoke tests. Pure gameplay modules are tested directly. Documentation and architecture invariants are smoke-tested until production source modules exist.

## Consequences

- `npm test` is the required CI command.
- Tests run without browser dependencies.
- UI pixel/regression testing is deferred until a browser automation stack is intentionally added.
- Smoke Test Harness GDD can map scenario coverage to Node tests first.

## Engine Compatibility

- Engine: Web Platform / HTML5 Browser Runtime
- Test Runtime: Node.js built-in test runner
- Reference: `docs/engine-reference/web-platform/modules/testing.md`
- Risk: LOW.

## GDD Requirements Addressed

- TR-smoke-001

## ADR Dependencies

- Depends On: ADR-0001, ADR-0003
- Enables: CI workflow and smoke test implementation.
