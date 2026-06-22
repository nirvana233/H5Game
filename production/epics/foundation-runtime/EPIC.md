# Epic: Foundation Runtime

> **Layer**: Foundation
> **GDDs**: `design/gdd/board-model.md`, `design/gdd/food-config.md`, `design/gdd/game-state-machine.md`, `design/gdd/storage.md`, `design/gdd/smoke-test-harness.md`
> **Architecture Modules**: Board Model, Food Config, Game State Machine, Storage Adapter, Smoke Test Harness
> **Status**: Complete for MVP
> **Stories**: 3 stories

## Overview

Build the deterministic foundation needed for the `6x8` fridge, canonical food data, safe persistence, and repeatable smoke checks.

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|------------------|-------------|
| ADR-0001 | Web Platform static runtime | MEDIUM |
| ADR-0003 | Pure logic gameplay modules | LOW |
| ADR-0004 | Local Storage Adapter | LOW/MEDIUM |
| ADR-0005 | Node Smoke Test Harness | LOW |

## Stories

| # | Story | Type | Status | Evidence |
|---|-------|------|--------|----------|
| 001 | Board and food data foundation | Logic | Complete | `tests/unit/fridge-overflow-core.test.js` |
| 002 | Optional best-score storage | Integration | Complete | `games/fridge-overflow/src/game.js` |
| 003 | Node smoke harness | Integration | Complete | `npm test` |

## Definition of Done

- Core data modules exist and are testable in Node.
- Storage failure is non-fatal.
- `npm test` runs without browser dependencies.
