# Gameplay HUD / Result UI

> **Status**: Approved
> **Author**: Fox + Codex agents
> **Last Updated**: 2026-06-22
> **Implements Pillar**: 一眼看懂冰箱要爆; 短局高复玩; 失败也好笑

## Overview

Gameplay HUD / Result UI 是《冰箱爆仓了》的局内信息与结算展示系统，负责把 Session Runtime 的状态快照变成玩家能一眼理解的界面：冰箱网格、当前食物、倒计时、压力条、待处理槽、分数、连消、难度提示、输入锁定状态和最终结果卡。它不计算规则、不判定合法放置、不改变压力或分数，只负责让玩家读懂当前危险、当前目标和失败后可分享的结果。

## Player Fantasy

玩家幻想是“我一眼就知道冰箱快爆了，也知道我刚才打得怎么样”。HUD 要克制、清楚、手机上不挡手；结果卡要有梗、有分数、有称号，让失败也值得截图。界面应该服务快速反复开局，而不是像复杂菜单一样打断节奏。

## Detailed Design

### Core Rules

1. HUD consumes Session Runtime snapshots as its source of truth.
2. HUD must show the `6x8` fridge grid and current food interaction area in the first viewport.
3. HUD must show conveyor timer while current food is live.
4. HUD must show pressure as a clear danger meter.
5. HUD must show pending count as 3 slots.
6. HUD must show live score.
7. HUD may show clear streak when streak is greater than `1`.
8. HUD may show display level or active type count in compact text.
9. HUD must visually distinguish input-available and input-locked states.
10. Result UI appears only after Game State Machine enters `GameOver`.
11. Result UI must show final score, management index, tier/title, failure reason, survival time, cleared item count, pending count, and restart/share actions.
12. Result UI must not appear for invalid release, pointer cancel, or temporary lock.
13. Mobile layout must avoid covering the board cells needed for drag preview.
14. Debug overlays are disabled in player builds.

### States and Transitions

| State | Entry Condition | Exit Condition | Behavior |
|-------|-----------------|----------------|----------|
| `BootUI` | Page opened | Runtime snapshot available | Prepare static layout |
| `LiveHUD` | Run active and not GameOver | GameOver or restart | Show gameplay HUD |
| `DraggingHUD` | Snapshot `isDragging == true` | Drag ends/cancels | Emphasize preview/timer without adding clutter |
| `ResolvingHUD` | GSM resolving clears | Resolution complete | Lock input affordance and show clear feedback slots |
| `DangerHUD` | Pressure/timer/pending danger high | Danger lowers or GameOver | Show stronger warning treatment |
| `ResultCard` | GameOver result payload ready | Restart | Show final score and actions |

| From | Trigger | Guard | To | Required Side Effects |
|------|---------|-------|----|-----------------------|
| `BootUI` | First run snapshot | Snapshot valid | `LiveHUD` | Render grid, HUD, current food |
| `LiveHUD` | Drag starts | `isDragging == true` | `DraggingHUD` | Keep timer/pressure visible |
| `DraggingHUD` | Drag ends | Runtime state not dragging | `LiveHUD` or `ResolvingHUD` | Clear drag-only UI state |
| `LiveHUD` | Danger threshold crossed | Pressure/timer/pending urgent | `DangerHUD` | Add warning treatment |
| Any live state | GameOver | Result payload exists | `ResultCard` | Hide gameplay input, show result |
| `ResultCard` | Restart | Runtime starts new run | `LiveHUD` | Clear result card after reset |

### Interactions with Other Systems

| System | Direction | Interface Contract |
|--------|-----------|--------------------|
| Session Runtime | HUD consumes snapshots | Uses state, current food, timer, pressure, pending, score, streak, difficulty, result payload. |
| Input Adapter | HUD reflects input affordance | Shows draggable state and debug overlay if enabled; does not compute input. |
| Pressure / Pending System | HUD displays danger | Shows pressure and pending slots. |
| Scoring / Result Rules | HUD displays score/result | Shows live score, streak, result tier, share copy. |
| Feedback Layer | HUD coordinates visual events | HUD reserves space; Feedback renders transient effects. |
| Storage | UI displays best result | May show best score after Storage loads it. |
| Visual Asset Spec | UI consumes art specs | Uses food icons, pressure meter style, result card assets. |

## Formulas

### `timerProgress`

The `timerProgress` formula is defined as:

`timerProgress(timerRemaining, conveyorDuration) = clamp(timerRemaining / conveyorDuration, 0, 1)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Timer remaining | `timerRemaining` | float seconds | `0..duration` | Current food time left |
| Conveyor duration | `conveyorDuration` | float seconds | `2.7..5.0` in MVP | Spawned duration |

**Output Range:** Float `0..1`.
**Example:** `1.5 / 3.0 = 0.5`.

### `pressureProgress`

The `pressureProgress` formula is defined as:

`pressureProgress(pressure) = clamp(pressure / 100, 0, 1)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Pressure | `pressure` | float | `0..100` | Overflow pressure |

**Output Range:** Float `0..1`.
**Example:** Pressure `75` displays as `0.75`.

### `dangerLevel`

The `dangerLevel` formula is defined as:

`dangerLevel(timerProgress, pressureProgress, pendingCount) = max(timerDanger, pressureDanger, pendingDanger)`

Where:

- `timerDanger = 2 if timerProgress <= 0.2 else 1 if timerProgress <= 0.4 else 0`
- `pressureDanger = 2 if pressureProgress >= 0.85 else 1 if pressureProgress >= 0.65 else 0`
- `pendingDanger = 2 if pendingCount >= 2 else 1 if pendingCount == 1 else 0`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Timer progress | `timerProgress` | float | `0..1` | Timer ratio |
| Pressure progress | `pressureProgress` | float | `0..1` | Pressure ratio |
| Pending count | `pendingCount` | int | `0..3` | Miss counter |

**Output Range:** `0` calm, `1` warning, `2` critical.
**Example:** `pendingCount=2` yields danger `2`.

### `pendingSlots`

The `pendingSlots` formula is defined as:

`pendingSlots(pendingCount) = [filled for i < pendingCount else empty for i in 0..2]`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Pending count | `pendingCount` | int | `0..3` | Miss counter |

**Output Range:** Three slot states.
**Example:** Pending `2` displays `[filled, filled, empty]`.

## Edge Cases

- **If current food is missing while state is live**: show locked/skeleton state and report runtime invariant in debug.
- **If timer duration is zero or missing**: hide timer fill and show debug validation error.
- **If result payload is missing at GameOver**: show fallback Game Over card with restart, and log error.
- **If pressure and pending are both critical**: show one combined danger treatment, not competing flashing elements.
- **If mobile viewport is narrow**: prioritize grid, current food, timer, pressure, and pending; collapse secondary labels.
- **If reduced motion is active**: use static warning changes instead of pulsing animations.
- **If share API is unavailable**: show copy/download fallback where supported.
- **If best score has not loaded**: do not block result; fill it when Storage returns.

## Dependencies

| Dependency | Type | Contract |
|------------|------|----------|
| Session Runtime | Hard | Source of live and result snapshots. |
| Pressure / Pending System | Hard display | Source of pressure/pending values. |
| Scoring / Result Rules | Hard display | Source of score, streak, result payload. |
| Input Adapter | Hard affordance | Source of drag affordance and debug input data. |
| Feedback Layer | Peer | Coordinates transient effects without conflicting layout. |
| Storage | Soft | Provides best score/result. |
| Visual Asset Spec | Downstream/peer | Supplies art assets and style specs. |

## Tuning Knobs

| Knob | Current Value | Safe Range | Effect |
|------|---------------|------------|--------|
| `warningPressureThreshold` | `65` | `55..75` | Earlier/later pressure warning. |
| `criticalPressureThreshold` | `85` | `80..95` | Earlier/later critical pressure. |
| `warningTimerThreshold` | `0.4` | `0.3..0.5` | Timer warning timing. |
| `criticalTimerThreshold` | `0.2` | `0.1..0.3` | Last-second tension. |
| `showStreakAt` | `2` | `2..4` | Avoids noisy streak label at 1. |
| `resultRevealMs` | `500ms` | `250..900ms` | Result card reveal pacing. |

## Visual/Audio Requirements

HUD must be dense and readable, not a marketing page. The first viewport must show the board and current food clearly. Danger colors must be paired with shape, icon, fill, pattern, or text. Result card needs a clear shareable visual hierarchy: title, index/tier, score, death reason, restart/share actions.

Asset Spec: Visual/Audio requirements are defined. After the art bible is approved, run `/asset-spec system:Gameplay HUD Result UI`.

## UI Requirements

Required live HUD elements:

- `6x8` fridge board
- current food / conveyor area
- timer
- pressure bar
- pending slots
- score
- streak label when active
- difficulty/display level cue
- input-locked state

Required result card elements:

- management index and tier
- final score
- survival time
- total cleared
- failure cause
- title/share text
- restart button
- share/copy action where available

UX Flag - Gameplay HUD / Result UI: This is a primary UI system. In Phase 4, run `/ux-design` before implementation stories.

## Acceptance Criteria

- **GIVEN** live run snapshot, **WHEN** HUD renders, **THEN** board, current food, timer, pressure, pending, and score are visible without scrolling on `390x844`.
- **GIVEN** `pressure=75`, **WHEN** pressure bar renders, **THEN** fill ratio is `0.75`.
- **GIVEN** `pendingCount=2`, **WHEN** pending UI renders, **THEN** two slots are filled and one is empty.
- **GIVEN** timer progress is `0.15`, **WHEN** danger level is computed, **THEN** timer danger contributes critical level.
- **GIVEN** invalid release occurs, **WHEN** UI updates, **THEN** result card does not appear.
- **GIVEN** GameOver result payload exists, **WHEN** UI transitions, **THEN** gameplay input is hidden/locked and result card appears.
- **GIVEN** reduced motion is active, **WHEN** danger increases, **THEN** warning remains readable without pulsing animation.

## Open Questions

| Question | Current Assumption | Owner | Target Resolution |
|----------|--------------------|-------|-------------------|
| Should difficulty display be numeric or text? | Compact numeric level plus active type count in debug/prototype style. | UX | HUD UX spec. |
| Should result card support image export in MVP? | Share/copy first; image export if time permits. | UI / Product | Pre-production scope. |
| Where should best score appear? | Result card secondary row, not live HUD. | UX | Result UI design. |
