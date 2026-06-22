# Story 001: Board And Food Data Foundation

> **Epic**: Foundation Runtime
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Manifest Version**: 2026-06-22

## Context

**GDD**: `design/gdd/board-model.md`, `design/gdd/food-config.md`
**Requirements**: TR-board-001, TR-board-002, TR-food-001
**ADR Governing Implementation**: ADR-0003

## Acceptance Criteria

- [x] Board is fixed `6x8`.
- [x] Multi-cell food cannot overlap or leave board bounds.
- [x] MVP food definitions include 7 types.

## Test Evidence

- `tests/unit/fridge-overflow-core.test.js`
