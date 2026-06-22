# Smoke Test Harness

> **Status**: Approved
> **Author**: Fox + Codex agents
> **Last Updated**: 2026-06-22
> **Implements Pillar**: 短局高复玩; 消除必须救命; 形状制造戏剧

## Overview

Smoke Test Harness 是《冰箱爆仓了》的核心循环自动验证系统，负责用确定性 seed、固定棋盘、脚本化输入和预期结果快速验证 MVP 规则是否仍然成立。它覆盖 Board Model、Food Config、RNG / Difficulty Scheduler、Input Adapter、Clear Resolver、Pressure / Pending System、Session Runtime、Scoring / Result Rules、Storage 和关键 UI 状态，不做完整 QA，但必须能在改动后快速回答“核心玩法有没有坏”。

## Player Fantasy

这是玩家不可见的保障系统。它服务的幻想是“每次极限救场都公平可靠”。如果测试能稳定覆盖刚好放下、刚好三消、同帧超时救回、压力爆仓、待处理爆仓等路径，玩家就更不容易遇到莫名其妙的失败。

## Detailed Design

### Core Rules

1. Smoke Test Harness owns deterministic test scenarios for the MVP critical path.
2. It must run without manual browser play when possible.
3. Tests use fixed seeds, fixed elapsed-time requests, fixed board states, and fixed pointer sequences.
4. It must not rely on ambient randomness.
5. It should test pure systems independently before runtime integration.
6. It must include at least one end-to-end session path.
7. It must cover valid placement winning over same-frame timeout.
8. It must cover same-type `3+` connected clear by food instance.
9. It must cover no-space pressure and pending failure.
10. It must cover input active-pointer filtering.
11. It must cover result scoring and storage best update.
12. It should produce a concise pass/fail report with scenario names and failure details.

### States and Transitions

| State | Entry Condition | Exit Condition | Behavior |
|-------|-----------------|----------------|----------|
| `NotRun` | Test command not started | Harness command starts | No test state |
| `PreparingFixtures` | Command starts | Fixtures ready | Load config, seeds, board snapshots |
| `RunningUnitScenarios` | Fixtures ready | Unit scenarios complete | Test pure rule systems |
| `RunningIntegrationScenarios` | Unit pass or continue flag | Integration scenarios complete | Test runtime loop |
| `Reporting` | Scenarios complete | Report written | Summarize pass/fail |
| `Failed` | Any required scenario fails | Developer fixes issue | Exit non-zero |
| `Passed` | All required scenarios pass | New run | Exit zero |

| From | Trigger | Guard | To | Required Side Effects |
|------|---------|-------|----|-----------------------|
| `NotRun` | Start | Test environment available | `PreparingFixtures` | Load fixtures |
| `PreparingFixtures` | Fixture validation pass | Config and docs present | `RunningUnitScenarios` | Freeze seeds and inputs |
| `RunningUnitScenarios` | Unit pass | None | `RunningIntegrationScenarios` | Continue to runtime paths |
| `RunningUnitScenarios` | Unit fail | Required scenario failed | `Failed` | Emit failure details |
| `RunningIntegrationScenarios` | Integration pass | None | `Reporting` | Build report |
| `Reporting` | All pass | None | `Passed` | Exit zero |
| `Reporting` | Any required fail | None | `Failed` | Exit non-zero |

### Interactions with Other Systems

| System | Test Contract |
|--------|---------------|
| Board Model | Footprint, bounds, placement, removal, legal placement scan. |
| Food Config | Exact 7 types, footprints, unlocks, validation failures. |
| RNG / Difficulty Scheduler | Fixed seed spawn sequence, profile values, anti-streak caps. |
| Input Adapter | Pointer offset, candidate coordinates, active pointer filtering, cancel. |
| Clear Resolver | Connected components, multi-cell instance clears, simultaneous clears. |
| Pressure / Pending System | Ticks, timeout pressure, relief, thresholds, failure cause. |
| Session Runtime | End-to-end spawn, drag, place, clear, timeout, game over, restart. |
| Scoring / Result Rules | Placement score, clear score, streak, result tier. |
| Gameplay HUD / Result UI | Snapshot-to-UI state smoke checks, result card presence. |
| Feedback Layer | Event count and no duplicate spam, not pixel-perfect animation. |
| Storage | Best update, corrupt data fallback, write failure fallback. |

## Formulas

### `scenarioResult`

The `scenarioResult` formula is defined as:

`scenarioResult(assertions) = pass if every assertion is true else fail`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Assertions | `assertions` | list<bool> | one or more | Checks inside one scenario |

**Output Range:** `pass` or `fail`.
**Example:** A placement scenario with all coordinate and board assertions true passes.

### `suiteResult`

The `suiteResult` formula is defined as:

`suiteResult(requiredScenarios) = pass if every scenarioResult is pass else fail`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Required scenarios | `requiredScenarios` | list<scenario> | MVP smoke scenarios | Must-pass scenario set |

**Output Range:** `pass` or `fail`.
**Example:** If one no-space pressure scenario fails, suite fails.

### `deterministicReplayKey`

The `deterministicReplayKey` formula is defined as:

`deterministicReplayKey = hash(seed, fixtureVersion, inputScriptId, configVersion)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Seed | `seed` | int/string | test seed | RNG seed |
| Fixture version | `fixtureVersion` | string | semantic id | Board/input fixture version |
| Input script id | `inputScriptId` | string | scenario id | Pointer/event script |
| Config version | `configVersion` | string | config id | Food/difficulty config version |

**Output Range:** Stable hash/id string.
**Example:** Same inputs produce same replay key across machines.

### `coverageStatus`

The `coverageStatus` formula is defined as:

`coverageStatus(requiredTags, scenarioTags) = covered if every tag in requiredTags appears in scenarioTags else missing(requiredTags - scenarioTags)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Required tags | `requiredTags` | set<string> | critical-path tags | Required coverage labels |
| Scenario tags | `scenarioTags` | set<string> | observed labels | Tags covered by implemented scenarios |

**Output Range:** `covered` or missing tag set.
**Example:** If `same_frame_timeout_rescue` has no scenario, coverage is missing that tag.

## Edge Cases

- **If RNG output differs for the same seed**: fail the scenario and print replay key.
- **If browser timing makes an integration scenario flaky**: use fixed clock/fake timer instead of widening assertions.
- **If visual animation duration varies slightly**: assert event completion/state, not pixel-perfect frame timing, unless the test is explicitly visual.
- **If local storage is unavailable in test environment**: use storage adapter mock for storage scenarios.
- **If a required GDD-defined fixture becomes stale**: fail fixture validation and name the missing/changed value.
- **If one required unit scenario fails**: fail fast by default; optional continue flag may collect more failures.
- **If no test can run in the current environment**: report blocked, not pass.

## Dependencies

| Dependency | Type | Contract |
|------------|------|----------|
| All MVP GDD systems | Hard | Harness verifies their critical contracts. |
| Session Runtime | Hard integration target | Runs full loop scenarios. |
| Storage | Soft/mockable | Tests persistence paths with adapter. |
| Gameplay HUD / Result UI | Soft | Smoke checks DOM/state output if UI exists. |
| Feedback Layer | Soft | Tests event emissions rather than full art fidelity. |

## Tuning Knobs

| Knob | Current Value | Safe Range | Effect |
|------|---------------|------------|--------|
| `failFast` | `true` | `true/false` | Stops quickly on first core failure. |
| `requiredScenarioCount` | `>=12` | grows with systems | Ensures broad MVP coverage. |
| `maxSmokeRuntimeSeconds` | `30s` | `10..90s` | Keeps smoke check fast. |
| `fixedClock` | `true` | MVP locked | Prevents timing flakes. |
| `reportFormat` | `markdown + console` | markdown/json/console | Human and automation readable. |

## Visual/Audio Requirements

Smoke Test Harness has no player-facing visuals/audio. It may output Markdown or console reports. Visual tests should attach screenshots only when a UI smoke check fails or when a future visual regression suite is added.

## UI Requirements

No player UI. Developer report should include scenario name, status, replay key, failed assertion, expected value, actual value, and related GDD system.

## Acceptance Criteria

- **GIVEN** fixed seed and spawn request sequence, **WHEN** RNG smoke scenario runs twice, **THEN** selected food sequence and timers match.
- **GIVEN** a scripted valid drop on the last timer frame, **WHEN** runtime scenario runs, **THEN** placement wins before timeout and pending does not increment.
- **GIVEN** three same-type connected instances, **WHEN** clear scenario runs, **THEN** Clear Resolver returns one eligible group.
- **GIVEN** no legal placement for current food, **WHEN** pressure scenario advances `1s`, **THEN** pressure increases by the profile no-space rate.
- **GIVEN** pending count reaches `3`, **WHEN** runtime checks failure, **THEN** result cause is `pending_full`.
- **GIVEN** corrupt storage data, **WHEN** storage scenario loads, **THEN** defaults return and suite continues.
- **GIVEN** a required scenario fails, **WHEN** report is generated, **THEN** suite exits fail and prints expected/actual values.

## Open Questions

| Question | Current Assumption | Owner | Target Resolution |
|----------|--------------------|-------|-------------------|
| Which runner should implementation use? | Use the project’s H5 tooling once production stack is chosen. | Technical | Test setup phase. |
| Should smoke include screenshot tests in MVP? | Only basic UI state checks first; screenshot regression later. | QA | UI implementation. |
| Should reports be committed? | Keep generated reports out unless a milestone requires evidence. | Producer / QA | Pre-production. |
