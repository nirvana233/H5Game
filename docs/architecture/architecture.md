# 冰箱爆仓了 — Master Architecture

## Document Status

- Version: 1.0
- Last Updated: 2026-06-22
- Engine: Web Platform / HTML5 Browser Runtime
- Technical Director Sign-Off: 2026-06-22 — APPROVED
- Lead Programmer Feasibility: FEASIBLE — solo/local review
- GDDs Covered: 14 MVP system GDDs in `design/gdd/`
- ADRs Referenced: ADR-0001, ADR-0002, ADR-0003, ADR-0004, ADR-0005

## Engine Knowledge Gap Summary

The project targets modern evergreen browsers rather than a packaged game engine. MVP APIs are mature: DOM, CSS, Pointer Events, `requestAnimationFrame`, ES modules, and Web Storage.

Risk areas are handled by architecture constraints:

- Mobile viewport behavior: layout must use stable responsive containers and be manually tested on mobile browser sizes.
- Pointer/touch behavior: Input Adapter owns Pointer Events and fallback behavior.
- Web Storage: Storage is optional and wrapped in an adapter.
- Audio/haptics/share APIs: optional feature-detected polish, not required for MVP.

Reference docs live in `docs/engine-reference/web-platform/`.

## Technical Requirements Baseline

| Req ID | GDD | System | Requirement | Domain | ADR Coverage |
|--------|-----|--------|-------------|--------|--------------|
| TR-board-001 | board-model.md | Board Model | Own a fixed `6x8` grid with stable coordinates. | Core Logic | ADR-0003 |
| TR-board-002 | board-model.md | Board Model | Expose pure placement, occupancy, and legal-placement queries. | Core Logic | ADR-0003 |
| TR-food-001 | food-config.md | Food Config | Provide canonical 7 MVP food definitions. | Data | ADR-0003 |
| TR-gsm-001 | game-state-machine.md | Game State Machine | Own state labels and same-frame event priority. | Runtime | ADR-0002 |
| TR-rng-001 | rng-difficulty-scheduler.md | RNG / Difficulty Scheduler | Use deterministic seeded spawn decisions and difficulty profiles. | Runtime | ADR-0002 |
| TR-input-001 | input-adapter.md | Input Adapter | Use mobile-first Pointer Events with single active pointer. | Input | ADR-0001, ADR-0002 |
| TR-clear-001 | clear-resolver.md | Clear Resolver | Resolve same-type `3+` connected food-instance clears. | Core Logic | ADR-0003 |
| TR-pressure-001 | pressure-pending-system.md | Pressure / Pending System | Maintain pressure `0..100` and pending `0..3`. | Core Logic | ADR-0003 |
| TR-runtime-001 | session-runtime.md | Session Runtime | Orchestrate run lifecycle, current food, timer, events, and snapshots. | Runtime | ADR-0002 |
| TR-score-001 | scoring-result-rules.md | Scoring / Result Rules | Compute placement, clear, streak, result index, and result payload. | Core Logic | ADR-0003 |
| TR-hud-001 | gameplay-hud-result-ui.md | Gameplay HUD / Result UI | Render mobile-first HUD and result card from runtime snapshots. | Presentation | ADR-0001 |
| TR-feedback-001 | feedback-layer.md | Feedback Layer | Render transient input, clear, pressure, score, and result feedback from events. | Presentation | ADR-0001 |
| TR-storage-001 | storage.md | Storage | Persist local bests/settings with failure-safe Web Storage adapter. | Persistence | ADR-0004 |
| TR-smoke-001 | smoke-test-harness.md | Smoke Test Harness | Run deterministic pure-logic and runtime smoke scenarios. | Testing | ADR-0005 |
| TR-asset-001 | visual-asset-spec.md | Visual Asset Spec | Define mobile-readable assets and fallback visuals. | Presentation | ADR-0001 |

## System Layer Map

| Layer | Modules |
|-------|---------|
| Platform | Browser runtime, DOM, CSS, Pointer Events, Web Storage, Node test runner |
| Foundation | Storage Adapter, Test Harness, Event Contracts, Runtime Clock/RNG adapters |
| Core | Board Model, Food Config, Game State Machine, RNG / Difficulty Scheduler, Input Adapter |
| Feature | Clear Resolver, Pressure / Pending System, Session Runtime, Scoring / Result Rules |
| Presentation | Gameplay HUD / Result UI, Feedback Layer, Visual Asset Spec |

Architecture dependency direction:

```text
Presentation -> Feature -> Core -> Foundation -> Platform
```

Core logic must not depend on Presentation. Presentation reads runtime snapshots and event payloads only.

## Module Ownership

| Module | Owns | Exposes | Consumes |
|--------|------|---------|----------|
| Board Model | Grid occupancy, active food instance cells | `canPlace`, `place`, `removeInstances`, `hasAnyLegalPlacement` | Food dimensions |
| Food Config | Canonical food data | `getFood(type)`, `allFoods`, validation | Board footprint constraints |
| Game State Machine | State, active pointer, event priority | `send(event)`, state snapshot | Runtime events |
| RNG / Difficulty Scheduler | Seed, profile, anti-streak history | `nextSpawn(elapsedSeconds)` | Food Config |
| Input Adapter | Pointer normalization, candidate calculation | drag intents, preview data | GSM gates, Board queries, layout rects |
| Clear Resolver | Clear graph resolution | `resolve(boardSnapshot)` | Board Model, Food Config |
| Pressure / Pending System | Pressure, pending count, failure cause | tick/event update APIs | Board Model, RNG profile, clear stats |
| Session Runtime | Run lifecycle, current food, timer, event order, snapshots | `start`, `restart`, `update`, `snapshot` | All core/feature modules |
| Scoring / Result Rules | Score, streak, run aggregates, result payload | scoring and result APIs | clear stats, pressure final state |
| Gameplay HUD / Result UI | DOM presentation state | render/update methods | runtime snapshots |
| Feedback Layer | transient effects and feedback throttles | event handlers | runtime/feedback events |
| Storage Adapter | versioned local persistence | load/save APIs | result payloads/settings |
| Smoke Test Harness | deterministic scenarios and reports | test suites | pure modules and runtime |

## Data Flow

### Frame Update Path

```text
Browser frame
  -> SessionRuntime.update(dt)
  -> GameStateMachine gates timer/input/pressure
  -> PressurePending.tick if allowed
  -> Runtime snapshot published
  -> HUD render + Feedback render
```

### Drag Placement Path

```text
PointerEvent
  -> InputAdapter normalizes pointer and candidate
  -> BoardModel.canPlace for preview
  -> GameStateMachine accepts release
  -> SessionRuntime places through BoardModel
  -> ClearResolver returns clearGroups
  -> PressurePending + Scoring update
  -> Runtime snapshot + Feedback events
```

### Timeout Path

```text
SessionRuntime timer reaches 0
  -> GameStateMachine checks valid placement priority first
  -> PressurePending increments pending and miss pressure
  -> SessionRuntime consumes current food
  -> GameStateMachine enters AwaitingNext or GameOver
```

### Save Path

```text
GameOver result payload
  -> ScoringResultRules builds result
  -> StorageAdapter saves bests/aggregates/settings
  -> Result UI reads in-memory result immediately
```

Storage write failure never blocks result UI or restart.

## API Boundaries

Production code should use small modules with explicit data contracts. Suggested entry points:

```js
createBoardModel({ cols: 6, rows: 8 })
createFoodConfig(foodEntries)
createGameStateMachine()
createDifficultyScheduler({ seed, foodConfig, profiles })
createInputAdapter({ boardModel, gameStateMachine, getLayout })
createClearResolver({ foodConfig })
createPressurePendingSystem({ boardModel, difficultyScheduler })
createScoringResultRules({ foodConfig })
createStorageAdapter({ key, version })
createSessionRuntime({ modules, clock })
```

Boundary rules:

- Board Model mutations happen only through Session Runtime at GSM-approved moments.
- Input Adapter never mutates Board Model.
- Clear Resolver decides clear groups but requests whole-instance removal through Runtime/Board Model.
- Pressure / Pending never changes RNG output.
- HUD and Feedback never own gameplay truth.
- Storage is side-effect-only after result payloads or settings changes.

## ADR Audit

| ADR | Status | Engine Compat | GDD Linkage | Conflicts | Valid |
|-----|--------|---------------|-------------|-----------|-------|
| ADR-0001 Web Platform Static Runtime | Accepted | Web Platform pinned | Yes | None | Yes |
| ADR-0002 Deterministic Session Runtime | Accepted | Web Platform pinned | Yes | None | Yes |
| ADR-0003 Pure Logic Gameplay Modules | Accepted | Web Platform + Node tests | Yes | None | Yes |
| ADR-0004 Local Storage Adapter | Accepted | Web Storage pinned | Yes | None | Yes |
| ADR-0005 Node Smoke Test Harness | Accepted | Node built-in test runner | Yes | None | Yes |

## Required ADRs

Must have before coding starts:

- ADR-0001 — Web Platform Static Runtime
- ADR-0002 — Deterministic Session Runtime and Event Ordering
- ADR-0003 — Pure Logic Gameplay Modules
- ADR-0004 — Local Storage Adapter
- ADR-0005 — Node Smoke Test Harness

All must-have ADRs are written and accepted.

Should have before relevant systems are expanded:

- Audio / Haptics browser policy ADR if that Full Vision system enters scope.
- Share/export fallback ADR if result-card sharing becomes MVP.
- Asset loading/cache ADR if production assets exceed the MVP file-size budget.

## Architecture Principles

1. Logic first, DOM second: gameplay rules must be testable without a browser.
2. Session Runtime is the only cross-system side-effect coordinator.
3. Game State Machine owns order; individual systems own their own data.
4. Mobile readability beats visual flourish.
5. Every optional browser API must have a fallback.

## Open Questions

| ID | Summary | Priority | Resolution Path |
|----|---------|----------|-----------------|
| QQ-01 | Whether production remains dependency-free or adopts a tiny build tool later. | Medium | Decide before creating implementation epics. |
| QQ-02 | Whether browser automation is needed before production or Node smoke tests are enough for MVP. | Medium | Revisit after first implementation sprint. |
| QQ-03 | Whether result sharing needs image export in MVP. | Low | Resolve during result UI UX design. |
