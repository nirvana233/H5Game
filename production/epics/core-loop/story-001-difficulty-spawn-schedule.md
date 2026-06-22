# Story 001: Difficulty And Spawn Schedule

> **Epic**: Core Loop
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Manifest Version**: 2026-06-22

## Context

**GDD**: `design/gdd/rng-difficulty-scheduler.md`
**Requirement**: TR-rng-001
**ADR Governing Implementation**: ADR-0002

## Acceptance Criteria

- [x] Food pool starts with 5 types.
- [x] Pot unlocks at 20 seconds.
- [x] Fish unlocks at 40 seconds.
- [x] Late timer reaches 2.7 seconds.
- [x] Short spawn history is not treated as a streak.

## Test Evidence

- `tests/unit/fridge-overflow-core.test.js`
