# Systems Index: 冰箱爆仓了

> **Status**: Approved
> **Created**: 2026-06-21
> **Last Updated**: 2026-06-22
> **Source Concept**: design/gdd/fridge-overflow-game-concept.md

---

## Overview

《冰箱爆仓了》是一个移动端优先的短局 H5 空间整理三消游戏。系统设计重点不是复杂内容量,而是把 `6x8` 网格占位、不同食物 footprint、限时传送带、同类 `3+` 连通清除、压力条和结算反馈串成一个稳定、可调、可测试的核心循环。MVP 必须优先保障"快放不下了,但一次三消救回来"的瞬间成立。

---

## Systems Enumeration

| # | System Name | Category | Priority | Status | Design Doc | Depends On |
|---|-------------|----------|----------|--------|------------|------------|
| 1 | Board Model | Core | MVP | Approved | design/gdd/board-model.md | — |
| 2 | Food Config | Core | MVP | Approved | design/gdd/food-config.md | — |
| 3 | Game State Machine | Core | MVP | Approved | design/gdd/game-state-machine.md | — |
| 4 | RNG / Difficulty Scheduler | Gameplay | MVP | Approved | design/gdd/rng-difficulty-scheduler.md | Food Config |
| 5 | Input Adapter | Core | MVP | Approved | design/gdd/input-adapter.md | Board Model, Game State Machine |
| 6 | Clear Resolver | Gameplay | MVP | Approved | design/gdd/clear-resolver.md | Board Model, Food Config |
| 7 | Pressure / Pending System | Gameplay | MVP | Approved | design/gdd/pressure-pending-system.md | Board Model, Food Config, RNG / Difficulty Scheduler |
| 8 | Session Runtime | Core | MVP | Approved | design/gdd/session-runtime.md | Board Model, Food Config, Game State Machine, RNG / Difficulty Scheduler, Input Adapter, Clear Resolver, Pressure / Pending System |
| 9 | Scoring / Result Rules | Gameplay | MVP | Approved | design/gdd/scoring-result-rules.md | Clear Resolver, Pressure / Pending System, Session Runtime |
| 10 | Gameplay HUD / Result UI (inferred) | UI | MVP | Approved | design/gdd/gameplay-hud-result-ui.md | Session Runtime, Scoring / Result Rules, Pressure / Pending System |
| 11 | Feedback Layer | UI | MVP | Approved | design/gdd/feedback-layer.md | Input Adapter, Clear Resolver, Pressure / Pending System, Game State Machine |
| 12 | Storage | Persistence | MVP | Approved | design/gdd/storage.md | Scoring / Result Rules |
| 13 | Smoke Test Harness | Meta | MVP | Approved | design/gdd/smoke-test-harness.md | Board Model, Food Config, RNG / Difficulty Scheduler, Clear Resolver, Pressure / Pending System |
| 14 | Visual Asset Spec | UI | MVP | Approved | design/gdd/visual-asset-spec.md | Food Config, Feedback Layer, Gameplay HUD / Result UI |
| 15 | Onboarding / Accessibility (inferred) | Meta | Vertical Slice | Not Started | — | Input Adapter, Gameplay HUD / Result UI, Feedback Layer |
| 16 | Share / Export (inferred) | Meta | Vertical Slice | Not Started | — | Scoring / Result Rules, Gameplay HUD / Result UI |
| 17 | Audio / Haptics (inferred) | Audio | Full Vision | Not Started | — | Feedback Layer, Game State Machine |
| 18 | Daily Challenge | Meta | Full Vision | Not Started | — | RNG / Difficulty Scheduler, Storage, Share / Export |
| 19 | Collection / Themes | Progression | Full Vision | Not Started | — | Storage, Visual Asset Spec |
| 20 | Platform SDK / Leaderboard | Meta | Full Vision | Not Started | — | Storage, Share / Export, Scoring / Result Rules |

---

## Categories

| Category | Description | Systems |
|----------|-------------|---------|
| **Core** | Game loop foundations and runtime contracts | Board Model, Food Config, Game State Machine, Input Adapter, Session Runtime |
| **Gameplay** | Rules that create pressure, rescue, and score | RNG / Difficulty Scheduler, Clear Resolver, Pressure / Pending System, Scoring / Result Rules |
| **Persistence** | Local state and continuity | Storage |
| **UI** | Player-facing information and feedback | Gameplay HUD / Result UI, Feedback Layer, Visual Asset Spec |
| **Audio** | Optional sound and device feedback | Audio / Haptics |
| **Progression** | Lightweight long-term collection | Collection / Themes |
| **Meta** | Testing, onboarding, sharing, and platform wrappers | Smoke Test Harness, Onboarding / Accessibility, Share / Export, Daily Challenge, Platform SDK / Leaderboard |

---

## Priority Tiers

| Tier | Definition | Target Milestone | Design Urgency |
|------|------------|------------------|----------------|
| **MVP** | Required for the core loop to function and be testable | First complete H5 MVP | Design FIRST |
| **Vertical Slice** | Required for a complete polished public demo | Vertical slice / demo | Design SECOND |
| **Alpha** | Additional mechanical breadth; none currently required beyond MVP for this concept | Alpha milestone | Design THIRD if scope expands |
| **Full Vision** | Nice-to-have retention, platform, and polish systems | Beta / Release | Design as needed |

---

## Dependency Map

### Foundation Layer (no dependencies)

1. Board Model — owns the `6x8` grid, occupancy, coordinates, and footprint legality.
2. Food Config — owns food types, shapes, unlock times, weights, and visual labels.
3. Game State Machine — defines allowed state transitions and event priority before runtime systems attach.

### Core Layer (depends on foundation)

1. RNG / Difficulty Scheduler — depends on: Food Config.
2. Input Adapter — depends on: Board Model, Game State Machine.
3. Clear Resolver — depends on: Board Model, Food Config.
4. Pressure / Pending System — depends on: Board Model, Food Config, RNG / Difficulty Scheduler.

### Feature Layer (depends on core)

1. Session Runtime — depends on: Board Model, Food Config, Game State Machine, RNG / Difficulty Scheduler, Input Adapter, Clear Resolver, Pressure / Pending System.
2. Scoring / Result Rules — depends on: Clear Resolver, Pressure / Pending System, Session Runtime.
3. Storage — depends on: Scoring / Result Rules.
4. Smoke Test Harness — depends on: Board Model, Food Config, RNG / Difficulty Scheduler, Clear Resolver, Pressure / Pending System.

### Presentation Layer (depends on features)

1. Gameplay HUD / Result UI — depends on: Session Runtime, Scoring / Result Rules, Pressure / Pending System.
2. Feedback Layer — depends on: Input Adapter, Clear Resolver, Pressure / Pending System, Game State Machine.
3. Visual Asset Spec — depends on: Food Config, Feedback Layer, Gameplay HUD / Result UI.
4. Onboarding / Accessibility — depends on: Input Adapter, Gameplay HUD / Result UI, Feedback Layer.
5. Share / Export — depends on: Scoring / Result Rules, Gameplay HUD / Result UI.

### Polish Layer (depends on everything)

1. Audio / Haptics — depends on: Feedback Layer, Game State Machine.
2. Daily Challenge — depends on: RNG / Difficulty Scheduler, Storage, Share / Export.
3. Collection / Themes — depends on: Storage, Visual Asset Spec.
4. Platform SDK / Leaderboard — depends on: Storage, Share / Export, Scoring / Result Rules.

---

## Recommended Design Order

| Order | System | Priority | Layer | Agent(s) | Est. Effort |
|-------|--------|----------|-------|----------|-------------|
| 1 | Board Model | MVP | Foundation | systems-designer, gameplay-programmer | M |
| 2 | Food Config | MVP | Foundation | systems-designer, art-director | S |
| 3 | Game State Machine | MVP | Foundation | gameplay-programmer, technical-director | S |
| 4 | RNG / Difficulty Scheduler | MVP | Core | systems-designer, qa-lead | M |
| 5 | Input Adapter | MVP | Core | ux-designer, gameplay-programmer | M |
| 6 | Clear Resolver | MVP | Core | systems-designer, gameplay-programmer | M |
| 7 | Pressure / Pending System | MVP | Core | systems-designer, game-designer | M |
| 8 | Session Runtime | MVP | Feature | gameplay-programmer, technical-director | M |
| 9 | Scoring / Result Rules | MVP | Feature | game-designer, systems-designer | S |
| 10 | Gameplay HUD / Result UI | MVP | Presentation | ux-designer, ui-programmer | M |
| 11 | Feedback Layer | MVP | Presentation | ux-designer, technical-artist | M |
| 12 | Smoke Test Harness | MVP | Feature | qa-lead, gameplay-programmer | S |
| 13 | Visual Asset Spec | MVP | Presentation | art-director, technical-artist | S |
| 14 | Storage | MVP | Feature | gameplay-programmer | S |
| 15 | Onboarding / Accessibility | Vertical Slice | Presentation | ux-designer, accessibility-specialist | S |
| 16 | Share / Export | Vertical Slice | Presentation | ui-programmer, producer | S |
| 17 | Audio / Haptics | Full Vision | Polish | sound-designer, technical-artist | S |
| 18 | Daily Challenge | Full Vision | Polish | systems-designer, gameplay-programmer | M |
| 19 | Collection / Themes | Full Vision | Polish | art-director, economy-designer | M |
| 20 | Platform SDK / Leaderboard | Full Vision | Polish | gameplay-programmer, producer | M |

---

## Circular Dependencies

- None found.

---

## High-Risk Systems

| System | Risk Type | Risk Description | Mitigation |
|--------|-----------|------------------|------------|
| Board Model | Technical | All placement, clear, pressure, and testing depend on exact occupancy behavior. | Design first, keep pure logic independent from DOM/canvas. |
| Clear Resolver | Design / Technical | `3+` connected food-instance clearing is the rescue moment; ambiguity would break fairness. | Specify connected-component rules and cover diagonal, multi-cell, and simultaneous clears in tests. |
| RNG / Difficulty Scheduler | Design | Late pressure must rise without feeling unfair or impossible. | Preserve QA seeds, anti-streak caps, and tunable difficulty table. |
| Pressure / Pending System | Design | Failure must feel caused by player decisions, not hidden math. | Keep pressure changes visible and tie acceptance tests to rescue/no-space cases. |
| Input Adapter | UX / Technical | Mobile drag feel can make or break the whole game. | Use pointer-first design, legal/illegal previews, and viewport/safe-area tests early. |
| Feedback Layer | Performance | Too many DOM animations or particles can hurt low-end mobile performance. | Enforce performance budgets and use pooled/simple effects. |

---

## Progress Tracker

| Metric | Count |
|--------|-------|
| Total systems identified | 20 |
| Design docs started | 14 |
| Design docs reviewed | 14 |
| Design docs approved | 14 |
| MVP systems designed | 14/14 |
| Vertical Slice systems designed | 0/2 |

---

## Gate Notes

- Review mode: lean.
- TD-SYSTEM-BOUNDARY skipped — Lean mode.
- PR-SCOPE skipped — Lean mode.
- CD-SYSTEMS skipped — Lean mode.

---

## Next Steps

- [x] Design MVP-tier systems first with `/design-system Board Model`.
- [x] Run `/design-review` on each completed system GDD.
- [x] Run `/map-systems next` to continue from the highest-priority undesigned system.
- [x] Run `/review-all-gdds` after all MVP system GDDs are complete.
- [x] Run `/gate-check systems-design` for formal phase readiness before Technical Setup.
- [x] Run `/create-architecture` to begin Technical Setup.
- [x] Run `/gate-check technical-setup` to advance into Pre-Production.
