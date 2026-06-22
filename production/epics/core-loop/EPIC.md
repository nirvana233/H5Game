# Epic: Core Loop

> **Layer**: Core
> **GDDs**: `design/gdd/rng-difficulty-scheduler.md`, `design/gdd/input-adapter.md`, `design/gdd/clear-resolver.md`, `design/gdd/pressure-pending-system.md`, `design/gdd/session-runtime.md`, `design/gdd/scoring-result-rules.md`
> **Architecture Modules**: Difficulty Scheduler, Input Adapter, Clear Resolver, Pressure / Pending, Session Runtime, Scoring
> **Status**: Complete for MVP
> **Stories**: 3 stories

## Overview

Implement the playable loop: spawn timed food, accept drag placement, resolve clears, escalate pressure, score results, and end/restart the run.

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|------------------|-------------|
| ADR-0001 | Web Platform input and UI runtime | MEDIUM |
| ADR-0002 | Deterministic Session Runtime | LOW |
| ADR-0003 | Pure logic modules | LOW |

## Stories

| # | Story | Type | Status | Evidence |
|---|-------|------|--------|----------|
| 001 | Difficulty and spawn schedule | Logic | Complete | `tests/unit/fridge-overflow-core.test.js` |
| 002 | Clear, pressure, score resolution | Logic | Complete | `games/fridge-overflow/src/game.js` |
| 003 | Pointer drag and session flow | Integration | Complete | `games/fridge-overflow/index.html` |

## Definition of Done

- Full start -> challenge -> resolution loop is playable.
- Difficulty increases over time.
- Failure causes produce result card and restart.
