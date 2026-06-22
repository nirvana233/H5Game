# Story 002: Clear Pressure Score Resolution

> **Epic**: Core Loop
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Manifest Version**: 2026-06-22

## Context

**GDDs**: `design/gdd/clear-resolver.md`, `design/gdd/pressure-pending-system.md`, `design/gdd/scoring-result-rules.md`
**Requirements**: TR-clear-001, TR-pressure-001, TR-score-001
**ADR Governing Implementation**: ADR-0003

## Acceptance Criteria

- [x] Same-type connected `3+` instances clear.
- [x] Multi-cell food clears as one instance but releases all cells.
- [x] Timeout increments pending.
- [x] No-space state increases pressure.
- [x] Result payload includes score, failure reason, survival, cleared count, and pending count.

## Test Evidence

- `tests/unit/fridge-overflow-core.test.js`
- `production/qa/smoke-fridge-overflow-2026-06-22.md`
