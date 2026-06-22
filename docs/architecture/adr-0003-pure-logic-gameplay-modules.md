# ADR-0003: Pure Logic Gameplay Modules

## Status

Accepted — 2026-06-22

## Context

Board placement, food definitions, clear detection, pressure, scoring, and RNG must be deterministic and testable. Putting these rules directly inside DOM handlers would make smoke testing and regression detection unreliable.

## Decision

Implement Board Model, Food Config, RNG / Difficulty Scheduler, Clear Resolver, Pressure / Pending System, and Scoring / Result Rules as pure JavaScript modules with no DOM dependency. DOM-facing systems consume their outputs through Session Runtime snapshots and events.

## Consequences

- Unit tests can run in Node.
- UI cannot mutate game truth directly.
- Data contracts between systems must remain explicit.
- Production implementation should avoid copying logic from prototype inline scripts without extracting it into modules.

## Engine Compatibility

- Engine: Web Platform / HTML5 Browser Runtime + Node.js test runtime
- APIs: ES modules, Node built-in test runner
- Reference: `docs/engine-reference/web-platform/modules/testing.md`
- Risk: LOW for chosen APIs.

## GDD Requirements Addressed

- TR-board-001
- TR-board-002
- TR-food-001
- TR-clear-001
- TR-pressure-001
- TR-score-001

## ADR Dependencies

- Depends On: ADR-0001, ADR-0002
- Enables: ADR-0005
