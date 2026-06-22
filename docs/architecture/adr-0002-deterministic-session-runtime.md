# ADR-0002: Deterministic Session Runtime and Event Ordering

## Status

Accepted — 2026-06-22

## Context

The game depends on just-in-time saves: valid release must beat timeout in the same frame, clears must logically free cells before next spawn, and stale callbacks must not mutate restarted runs.

## Decision

Create a single Session Runtime module that owns run lifecycle, frame update order, current food context, timer advancement, run snapshots, and cross-system side effects. It delegates rule ownership to system modules but is the only orchestrator that applies multi-system events.

## Consequences

- Game State Machine remains authoritative for event priority.
- Runtime applies Board, Clear, Pressure, Score, Storage, HUD, and Feedback calls in a deterministic order.
- All delayed callbacks carry `runId`.
- Integration smoke tests can replay deterministic scenarios.

## Engine Compatibility

- Engine: Web Platform / HTML5 Browser Runtime
- APIs: `requestAnimationFrame`, injected monotonic clock, ES modules
- Reference: `docs/engine-reference/web-platform/modules/core.md`
- Risk: LOW for chosen APIs.

## GDD Requirements Addressed

- TR-gsm-001
- TR-rng-001
- TR-runtime-001

## ADR Dependencies

- Depends On: ADR-0001
- Enables: ADR-0003, ADR-0005
