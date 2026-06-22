# Story 003: Pointer Drag And Session Flow

> **Epic**: Core Loop
> **Status**: Complete
> **Layer**: Core
> **Type**: Integration
> **Manifest Version**: 2026-06-22

## Context

**GDDs**: `design/gdd/input-adapter.md`, `design/gdd/session-runtime.md`
**Requirements**: TR-input-001, TR-runtime-001
**ADR Governing Implementation**: ADR-0001, ADR-0002

## Acceptance Criteria

- [x] Single pointer controls current food.
- [x] Legal preview and illegal preview use distinct non-color cues.
- [x] Pointer cancel/blur cancels drag safely.
- [x] Restart clears prior run state.

## Test Evidence

- `games/fridge-overflow/src/game.js`
- `production/qa/evidence/fridge-overflow-mvp-evidence.md`
