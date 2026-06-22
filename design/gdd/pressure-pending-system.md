# Pressure / Pending System

> **Status**: Approved
> **Author**: Fox + Codex agents
> **Last Updated**: 2026-06-22
> **Implements Pillar**: 一眼看懂冰箱要爆; 消除必须救命; 短局高复玩

## Overview

Pressure / Pending System 是《冰箱爆仓了》的失败压力系统，负责维护 `0..100` 的爆仓压力条和 `0..3` 的待处理 miss counter。它读取当前难度档、当前食物 footprint、Board Model 是否存在合法放置、Game State Machine 是否允许压力 ticking、Clear Resolver 的清除结果，并输出压力变化、待处理变化和失败阈值状态。它不生成食物、不处理拖拽、不计算分数、不展示 UI，但它决定玩家什么时候因为放不下、超时或连续浪费而爆仓。

## Player Fantasy

玩家幻想是“冰箱正在被撑爆，但我的消除真的能把它压回去”。压力条必须让玩家一眼看懂危险正在接近；待处理区必须让超时失误有明确次数感；清除后的压力回落必须明显，让玩家觉得每一次三消都救命。失败应该像是空间管理失误的自然结果，而不是隐藏数值突然判死。

## Detailed Design

### Core Rules

1. Pressure / Pending System owns run-local `pressure` and `pendingCount`.
2. `pressure` is clamped to `0..100`.
3. `pendingCount` is clamped to `0..3`.
4. Pending is a miss counter, not a recoverable queue.
5. A conveyor timeout that is not beaten by a valid placement increments pending by `1`.
6. Pending reaching `3` is a failure condition.
7. Pressure reaching `100` is a failure condition.
8. If pending and pressure fail in the same frame, Game State Machine records `pending_full`.
9. Pressure ticks only when Game State Machine allows pressure ticking: `Ready` or `Dragging` with a live current food.
10. If the current food has no legal placement anywhere on Board Model, pressure increases by the current difficulty no-space rate.
11. If the current food has at least one legal placement, pressure decays by the current difficulty decay rate.
12. A valid placement applies a small placement relief after Board Model accepts the placement.
13. A clear applies clear relief based on cleared item count, streak, and multi-clear count.
14. Timeout applies miss pressure based on current difficulty.
15. Invalid release does not directly alter pressure or pending; timeout may still apply if the timer has expired.
16. Pointer cancel, page hidden, and orientation cancel do not increment pending or pressure by themselves.
17. Pressure / Pending System does not substitute the current food when no placement exists. No-space pressure is intentional.

### States and Transitions

| State | Entry Condition | Exit Condition | Behavior |
|-------|-----------------|----------------|----------|
| `Inactive` | No active run or GameOver | New run starts | Holds zeroed values |
| `Stable` | Run active, no tick event being applied | Tick, timeout, placement, or clear event | Exposes current pressure/pending |
| `ApplyingTick` | Timer frame allows pressure tick | Tick delta applied | Raises or decays pressure |
| `ApplyingTimeout` | Timeout-to-pending event accepted | Pending and miss pressure applied | Increments pending and pressure |
| `ApplyingRelief` | Valid placement or clear result arrives | Relief applied | Lowers pressure |
| `FailureReady` | Pending or pressure threshold reached | Game State Machine consumes failure | Exposes failure cause |

| From | Trigger | Guard | To | Required Side Effects |
|------|---------|-------|----|-----------------------|
| `Inactive` | New run | Runtime reset complete | `Stable` | Set `pressure=0`, `pendingCount=0` |
| `Stable` | Pressure tick | `isPressureTickAllowed == true` | `ApplyingTick` | Query Board Model `hasAnyLegalPlacement(currentFood)` |
| `ApplyingTick` | Tick applied | No threshold reached | `Stable` | Clamp pressure to `0..100` |
| `Stable` | Timeout event | No valid placement won frame | `ApplyingTimeout` | Increment pending and add miss pressure |
| `Stable` | Valid placement accepted | Board Model placed food | `ApplyingRelief` | Apply placement relief |
| `Stable` | Clear result | `clearedItems > 0` | `ApplyingRelief` | Apply clear relief |
| Any active state | Threshold reached | pending `>=3` or pressure `>=100` | `FailureReady` | Publish failure cause for Game State Machine |
| `FailureReady` | GameOver entered | None | `Inactive` | Stop ticking until restart |

### Interactions with Other Systems

| System | Direction | Interface Contract |
|--------|-----------|--------------------|
| Game State Machine | Pressure obeys state gates | Ticks only in `Ready` / `Dragging`; failure checks occur after higher-priority placement/clear/timeout. |
| Board Model | Pressure consumes placement availability | Calls `hasAnyLegalPlacement(currentFood)` on stable board snapshots. |
| Food Config | Pressure consumes footprint/profile | Uses current food `w,h` and optional pressure profile labels. |
| RNG / Difficulty Scheduler | Pressure consumes difficulty context | Uses current profile values: miss pressure, no-space rate, decay rate. |
| Clear Resolver | Pressure consumes clear stats | Uses `clearedItems` and `multiClearCount` for relief. |
| Scoring / Result Rules | Downstream consumer | Reads final pressure, pending, and failure cause for result card and management index. |
| Gameplay HUD / Result UI | Downstream consumer | Displays pressure bar, pending slots, warnings, and failure cause. |
| Feedback Layer | Downstream consumer | Plays pressure warning, pending bump, relief, and danger feedback. |
| Smoke Test Harness | Verification consumer | Tests failure thresholds, same-frame priority, and pressure deltas. |

## Formulas

### `pendingAfterTimeout`

The `pendingAfterTimeout` formula is defined as:

`pendingAfterTimeout(pendingCount) = min(3, pendingCount + 1)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Pending count | `pendingCount` | int | `0..3` | Current miss count |
| Pending cap | `3` | int | MVP constant | Failure threshold |

**Output Range:** Integer `0..3`.
**Example:** `pendingAfterTimeout(2) = 3`.

### `pressureProfileValues`

The `pressureProfileValues` formula is defined as:

`pressureProfileValues(profile) = {missPressure, noSpacePressurePerSecond, pressureDecayPerSecond}`

**Variables:**

| Profile | Miss Pressure | No-Space Pressure / s | Pressure Decay / s |
|---------|---------------|-----------------------|--------------------|
| `L1` | 24 | 12 | 4.00 |
| `L2` | 31 | 18 | 3.65 |
| `L3` | 38 | 24 | 3.30 |
| `L4` | 51 | 33 | 2.70 |
| `L5` | 64 | 42 | 2.10 |
| `L6` | 77 | 51 | 1.50 |

**Output Range:** Positive tuning values for the current difficulty profile.
**Example:** `pressureProfileValues(L4)` returns miss pressure `51`, no-space rate `33`, decay `2.70`.

### `pressureAfterTick`

The `pressureAfterTick` formula is defined as:

`pressureAfterTick(pressure, hasAnyLegalPlacement, dt, profile) = clamp(pressure + tickDelta, 0, 100)`

Where:

`tickDelta = -pressureDecayPerSecond(profile) * dt if hasAnyLegalPlacement else noSpacePressurePerSecond(profile) * dt`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Pressure | `pressure` | float | `0..100` | Current overflow pressure |
| Has legal placement | `hasAnyLegalPlacement` | bool | `true/false` | Board Model result for current food |
| Delta time | `dt` | float seconds | `>0` | Frame time while pressure ticking is allowed |
| Profile | `profile` | enum | `L1..L6` | Current difficulty profile |

**Output Range:** Float `0..100`.
**Example:** At `L3`, `pressure=40`, `dt=1`, no legal placement gives `64`.

### `pressureAfterTimeout`

The `pressureAfterTimeout` formula is defined as:

`pressureAfterTimeout(pressure, profile) = clamp(pressure + missPressure(profile), 0, 100)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Pressure | `pressure` | float | `0..100` | Current overflow pressure |
| Miss pressure | `missPressure(profile)` | float | `24..77` | Difficulty-based timeout pressure |

**Output Range:** Float `0..100`.
**Example:** `pressureAfterTimeout(45, L2) = 76`.

### `placementRelief`

The `placementRelief` formula is defined as:

`placementRelief(food) = 4 + food.w * food.h`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Food width | `food.w` | int | `1..3` | Current food footprint width |
| Food height | `food.h` | int | `1..2` | Current food footprint height |

**Output Range:** `5..8` pressure relief for MVP foods.
**Example:** A `2x2` pot gives relief `8`.

### `clearRelief`

The `clearRelief` formula is defined as:

`clearRelief(clearedItems, clearStreak, multiClearCount) = 10 * clearedItems + 5 * max(0, clearStreak - 1) + 6 * max(0, multiClearCount - 1)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Cleared items | `clearedItems` | int | `0..active instances` | Food instances cleared |
| Clear streak | `clearStreak` | int | `0..N` | Consecutive clearing placements after increment |
| Multi clear count | `multiClearCount` | int | `0..N` | Number of clear groups in this resolution |

**Output Range:** Nonnegative pressure relief, clamped by final pressure floor `0`.
**Example:** Clearing 3 items at streak 2 with one group gives `35` relief.

### `failureCause`

The `failureCause` formula is defined as:

`failureCause(pendingCount, pressure) = pending_full if pendingCount >= 3 else pressure_full if pressure >= 100 else none`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Pending count | `pendingCount` | int | `0..3` | Miss counter |
| Pressure | `pressure` | float | `0..100` | Current pressure |

**Output Range:** `none`, `pending_full`, or `pressure_full`.
**Example:** `failureCause(3, 100) = pending_full`.

## Edge Cases

- **If valid placement and timeout occur in the same frame**: Game State Machine resolves placement first; Pressure / Pending System must not increment pending for that food.
- **If invalid release and timeout occur in the same frame**: timeout applies because no valid placement consumed the food.
- **If pointercancel/page hidden/orientation cancel occurs**: do not increment pending or pressure from the cancel event.
- **If current food has no legal placement for several seconds**: apply no-space pressure every allowed tick until pressure reaches cap or state changes.
- **If current food has legal placement again after clears**: pressure decay resumes on later allowed ticks.
- **If pressure would go below `0` after relief or decay**: clamp to `0`.
- **If pressure would exceed `100` after timeout or no-space tick**: clamp to `100` and publish failure condition.
- **If pending reaches `3` and pressure reaches `100` together**: publish `pending_full`.
- **If Board Model query fails**: do not guess; surface runtime/test error and let Game State Machine lock or fail safely.
- **If difficulty profile is unavailable**: use no gameplay tick in development/test; playable builds may fail safe to `L1` only if runtime records a validation error.

## Dependencies

| Dependency | Type | Contract |
|------------|------|----------|
| Game State Machine | Hard | Authorizes ticking and failure timing. |
| Board Model | Hard | Provides `hasAnyLegalPlacement(currentFood)`. |
| Food Config | Hard | Provides current food footprint and type profile. |
| RNG / Difficulty Scheduler | Hard | Provides difficulty profile values. |
| Clear Resolver | Hard for relief | Provides clear stats after placement resolution. |
| Scoring / Result Rules | Downstream | Consumes pending/pressure totals and failure cause. |
| Gameplay HUD / Result UI | Downstream | Displays pressure and pending. |
| Feedback Layer | Downstream | Plays pressure and relief cues. |
| Smoke Test Harness | Downstream | Verifies deltas and thresholds. |

## Tuning Knobs

| Knob | Current Value | Safe Range | Effect |
|------|---------------|------------|--------|
| `pendingLimit` | `3` | MVP locked | Number of misses before pending failure. |
| `pressureLimit` | `100` | MVP locked | Pressure failure threshold. |
| `missPressureByProfile` | table above | `20..85` | Higher makes timeout harsher. |
| `noSpacePressurePerSecondByProfile` | table above | `8..60` | Higher makes impossible boards fail faster. |
| `pressureDecayPerSecondByProfile` | table above | `1..5` | Higher lets calm boards recover faster. |
| `placementReliefBase` | `4` | `0..8` | Higher rewards every placement more. |
| `clearReliefPerItem` | `10` | `6..16` | Higher makes clears feel more life-saving. |
| `streakReliefBonus` | `5` | `0..10` | Higher rewards repeated clears. |
| `multiClearReliefBonus` | `6` | `0..12` | Higher rewards simultaneous groups. |

## Visual/Audio Requirements

Pressure / Pending System emits values and events only. UI and Feedback should show pressure increase, pressure relief, pending slot fill, and imminent danger. Pressure relief from clears should be visibly stronger than placement relief. Pending fill should be noticeable but not longer than the next spawn rhythm.

Asset Spec: Visual/Audio requirements are defined. After the art bible is approved, run `/asset-spec system:Pressure Pending System` for pressure bar and pending-slot feedback specs.

## UI Requirements

- HUD must show pressure as a `0..100` bar or equivalent danger meter.
- HUD must show `pendingCount` as 3 clear slots.
- Pressure danger should become visually urgent at high values before failure.
- Result UI must receive `failureCause` and final `pendingCount` / `pressure`.
- Debug UI may show exact rates and current profile; player UI should not show raw formulas.

UX Flag - Pressure / Pending System: This system has UI requirements. In Phase 4, run `/ux-design` for the gameplay HUD pressure and pending elements.

## Acceptance Criteria

- **GIVEN** `pendingCount=2`, **WHEN** timeout applies, **THEN** pending becomes `3` and failure cause is `pending_full`.
- **GIVEN** current food has no legal placement at `L3` for `1s`, **WHEN** pressure tick applies, **THEN** pressure increases by `24` before clamp.
- **GIVEN** current food has legal placement at `L2` for `1s`, **WHEN** pressure tick applies, **THEN** pressure decreases by `3.65` before clamp.
- **GIVEN** pressure is `45` at `L2`, **WHEN** timeout applies, **THEN** pressure becomes `76`.
- **GIVEN** pressure is `3` and placement relief is `8`, **WHEN** relief applies, **THEN** pressure clamps to `0`.
- **GIVEN** `clearedItems=3`, `clearStreak=2`, `multiClearCount=1`, **WHEN** clear relief applies, **THEN** relief value is `35`.
- **GIVEN** valid placement and timeout occur in one frame, **WHEN** Game State Machine resolves priority, **THEN** pending does not increment.
- **GIVEN** pointercancel occurs while dragging, **WHEN** pressure system receives cancel context, **THEN** pressure and pending remain unchanged.

## Open Questions

| Question | Current Assumption | Owner | Target Resolution |
|----------|--------------------|-------|-------------------|
| Are pressure relief values too generous for late game? | Use current values from prototype feel, tune after implementation playtest. | Game Design | First balance pass. |
| Should no-space pressure use board fullness as multiplier? | No for MVP; readability favors profile-based rates. | Systems Design | Post-MVP. |
| Should pending count reduce after clears? | No for MVP; pending is miss history, not recoverable queue. | Game Design | Only revisit if failure feels too harsh. |
