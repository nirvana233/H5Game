# Story 003: Node Smoke Harness

> **Epic**: Foundation Runtime
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Integration
> **Manifest Version**: 2026-06-22

## Context

**GDD**: `design/gdd/smoke-test-harness.md`
**Requirement**: TR-smoke-001
**ADR Governing Implementation**: ADR-0005

## Acceptance Criteria

- [x] `npm test` runs Node tests.
- [x] CI workflow runs the same command.
- [x] Smoke checklist exists for manual QA.

## Test Evidence

- `.github/workflows/tests.yml`
- `tests/smoke/critical-paths.md`
