# Session Runtime

> **Status**: Approved
> **Author**: Fox + Codex agents
> **Last Updated**: 2026-06-22
> **Implements Pillar**: 短局高复玩; 消除必须救命; 一眼看懂冰箱要爆

## Overview

Session Runtime 是《冰箱爆仓了》的局内编排层，负责启动一局、重置系统、推进 frame update、请求食物生成、维护当前食物上下文、把输入/计时/放置/清除/压力/得分/反馈按 Game State Machine 的顺序串起来。它不重新定义任何核心规则，而是把 Board Model、Food Config、Game State Machine、RNG / Difficulty Scheduler、Input Adapter、Clear Resolver、Pressure / Pending System、Scoring / Result Rules 和 UI/Feedback 连接成一个可运行、可测试、可重开的完整 session。

## Player Fantasy

玩家幻想是“打开就能玩，失败马上再来一局”。Session Runtime 本身不可见，但它决定短局是否顺滑：第一件食物快速出现，拖拽后结算不卡，清除后马上进入下一件，失败结果明确，重开不残留旧局状态。它必须让整个核心循环像一个紧凑的 H5 小游戏，而不是一堆规则文档拼不起来。

## Detailed Design

### Core Rules

1. Session Runtime owns run-local lifecycle: boot, start run, frame update, restart, end run.
2. Session Runtime owns the current food instance context after RNG selects a type: `foodId`, `foodType`, `w`, `h`, spawn time, conveyor duration, remaining timer.
3. Session Runtime does not own board legality, clear logic, pressure formulas, score formulas, or input gesture math.
4. Session Runtime initializes and resets run-local systems in a deterministic order.
5. New run reset order is: Input Adapter clear, Feedback clear, Board Model reset, Pressure/Pending reset, Scoring reset, RNG history reset, Game State Machine enter `Spawning`.
6. During `Spawning`, runtime requests next spawn from RNG / Difficulty Scheduler and validates the selected Food Config entry.
7. Runtime creates a unique `foodId` for each spawned current food.
8. Runtime provides current food and layout context to Input Adapter and HUD.
9. Runtime advances conveyor timer only when Game State Machine says timer is running.
10. Runtime forwards pointer intents from Input Adapter into Game State Machine, then applies accepted side effects through owner systems.
11. On legal release, runtime requests Board Model placement, then Clear Resolver, then Pressure relief/scoring/feedback according to Game State Machine priority.
12. On timeout, runtime applies pending and miss pressure, consumes current food, and advances toward next spawn or game over.
13. Runtime must apply logical board removals before visual clear animation blocks next spawn timing.
14. Runtime publishes a read-only session snapshot for HUD, Feedback, tests, and result UI.
15. Runtime must not let callbacks from an old run mutate a new run after restart; all delayed callbacks carry `runId`.

### States and Transitions

Session Runtime mirrors Game State Machine but has its own orchestration substates.

| State | Entry Condition | Exit Condition | Behavior |
|-------|-----------------|----------------|----------|
| `Bootstrapping` | Page/app opened | Config and DOM ready | Load config and bind input/UI |
| `RunResetting` | New run or restart | All run-local systems reset | Clear stale state and increment `runId` |
| `SpawningCurrentFood` | GSM enters `Spawning` | Spawn decision consumed | Request RNG spawn and create current food context |
| `LiveFrame` | GSM is `Ready` or `Dragging` | Placement, timeout, or game over | Advance timer, pressure, input, HUD |
| `ResolvingPlacement` | Legal release accepted | Placement/clear/score/pressure done | Apply owner-system side effects in priority order |
| `BetweenFoods` | Current food consumed | Delay elapsed | Prepare next spawn |
| `EndingRun` | Failure cause published | Result snapshot emitted | Lock gameplay and show result |
| `RuntimeError` | Fatal invariant failure | Restart | Stop gameplay side effects |

| From | Trigger | Guard | To | Required Side Effects |
|------|---------|-------|----|-----------------------|
| `Bootstrapping` | Start requested | Config valid | `RunResetting` | Prepare new `runId` |
| `RunResetting` | Reset complete | All systems ready | `SpawningCurrentFood` | Enter GSM `Spawning` |
| `SpawningCurrentFood` | Spawn decision ready | Food Config entry valid | `LiveFrame` | Set current food and timer; enter GSM `Ready` |
| `LiveFrame` | Legal release | Board Model can place | `ResolvingPlacement` | Place food, resolve clears, apply score/pressure |
| `LiveFrame` | Timer expired | No valid placement won frame | `BetweenFoods` or `EndingRun` | Apply pending/miss pressure and consume food |
| `ResolvingPlacement` | Resolution complete | No failure | `BetweenFoods` | Publish feedback and schedule next spawn |
| `ResolvingPlacement` | Failure reached | Failure cause exists | `EndingRun` | Emit result snapshot |
| `BetweenFoods` | Delay elapsed | No failure | `SpawningCurrentFood` | Request next current food |
| `EndingRun` | Restart | Player requests restart | `RunResetting` | Invalidate delayed callbacks from old run |

### Interactions with Other Systems

| System | Direction | Interface Contract |
|--------|-----------|--------------------|
| Board Model | Runtime calls mutations | Reset, place current food, remove cleared instances at GSM-approved moments. |
| Food Config | Runtime validates current food | Resolves selected type into `w,h`, display data, and labels. |
| Game State Machine | Runtime obeys and feeds events | Runtime sends ordered events and uses state gates for timer/input/pressure. |
| RNG / Difficulty Scheduler | Runtime requests spawn decisions | Provides seed, elapsed seconds, and request count; receives food type and duration. |
| Input Adapter | Runtime supplies context | Provides current food, board rect, and accepted state; consumes drag intents. |
| Clear Resolver | Runtime calls after placement | Supplies stable board snapshot and consumes clear result. |
| Pressure / Pending System | Runtime calls ticks and events | Applies pressure tick, timeout, placement relief, clear relief. |
| Scoring / Result Rules | Runtime calls scoring | Applies placement/clear scoring and builds result on game over. |
| Gameplay HUD / Result UI | Runtime publishes snapshots | Sends current food, timer, pressure, pending, score, state, result. |
| Feedback Layer | Runtime emits events | Sends pickup/drop/clear/pressure/game-over events with stable ids. |
| Storage | Runtime saves final results | Writes best score/result after game over, never mid-frame gameplay mutation. |
| Smoke Test Harness | Runtime is primary integration target | Runs deterministic sessions and asserts snapshots. |

## Formulas

### `elapsedSeconds`

The `elapsedSeconds` formula is defined as:

`elapsedSeconds(now, runStartTime, pausedAccumulated) = max(0, now - runStartTime - pausedAccumulated)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Current time | `now` | float seconds | monotonic | Runtime clock |
| Run start time | `runStartTime` | float seconds | monotonic | Time when current run began |
| Paused accumulated | `pausedAccumulated` | float seconds | `>=0` | Time excluded from difficulty progression if runtime pauses globally |

**Output Range:** Seconds `>=0`.
**Example:** `now=80`, `runStartTime=10`, `pausedAccumulated=5` gives `65s`.

### `timerRemainingAfterDelta`

The `timerRemainingAfterDelta` formula is defined as:

`timerRemainingAfterDelta(timerRemaining, dt, isTimerRunning) = max(0, timerRemaining - dt) if isTimerRunning else timerRemaining`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Timer remaining | `timerRemaining` | float seconds | `0..spawnDuration` | Current food remaining time |
| Delta time | `dt` | float seconds | `>=0` | Frame delta |
| Timer running | `isTimerRunning` | bool | `true/false` | Game State Machine timer gate |

**Output Range:** Float seconds `>=0`.
**Example:** `timerRemainingAfterDelta(3.0, 0.5, true) = 2.5`.

### `currentFoodContext`

The `currentFoodContext` formula is defined as:

`currentFoodContext(spawnDecision, foodConfig, nextInstanceNumber) = {foodId, foodType, w, h, duration, profile, displayLevel}`

Where `foodId = "food_" + runId + "_" + nextInstanceNumber`.

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Spawn decision | `spawnDecision` | object | valid scheduler output | Selected food type, duration, profile |
| Food Config | `foodConfig` | object | one MVP food entry | Provides `w,h`, display data |
| Instance number | `nextInstanceNumber` | int | `1..N` | Per-run increasing id source |

**Output Range:** One current food context object.
**Example:** `pot` on run `7`, instance `12` becomes `food_7_12` with `w=2,h=2`.

### `canApplyCallback`

The `canApplyCallback` formula is defined as:

`canApplyCallback(callbackRunId, currentRunId) = callbackRunId == currentRunId`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Callback run id | `callbackRunId` | int/string | prior or current run id | Run id captured when callback was scheduled |
| Current run id | `currentRunId` | int/string | active run id | Runtime's active run |

**Output Range:** Boolean.
**Example:** A clear animation callback from run `4` is ignored after restart creates run `5`.

### `sessionSnapshot`

The `sessionSnapshot` formula is defined as:

`sessionSnapshot = {runId, state, elapsedSeconds, currentFood, timerRemaining, boardSummary, pressure, pendingCount, score, clearStreak, failureCause}`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Run id | `runId` | id | active run | Current run identity |
| State | `state` | enum | GSM states | Authoritative Game State Machine state |
| Current food | `currentFood` | object or `NONE` | active food context | Live conveyor/drag food |
| Board summary | `boardSummary` | object | 6x8 occupancy summary | Read-only board state for UI/tests |

**Output Range:** Immutable read-only snapshot for consumers.
**Example:** HUD reads timer, pressure, pending, and score from one snapshot instead of querying every system separately.

## Edge Cases

- **If Food Config validation fails at boot**: do not start a run; enter `RuntimeError`.
- **If RNG emits a type not in Food Config**: reject the spawn and enter `RuntimeError` or fatal game over in playable builds.
- **If Board Model rejects a placement that Input Adapter marked legal**: trust Board Model, reject placement, log invariant mismatch, and avoid mutation.
- **If timer reaches zero during the same frame as a legal release**: resolve legal release first through Game State Machine priority.
- **If restart occurs while clear feedback callbacks are pending**: increment `runId`; old callbacks must be ignored.
- **If page visibility pauses the app**: freeze runtime frame updates while hidden; pointer cancel handling remains owned by Input Adapter / GSM.
- **If frame delta is very large after tab resume**: clamp gameplay `dt` to a safe max for timer/pressure processing or process fixed steps; do not skip directly through multiple invisible states.
- **If current food context is missing in `Ready`**: enter `RuntimeError`; input and timer cannot proceed.
- **If GameOver is entered**: stop spawn requests, timer updates, pressure ticks, and gameplay input immediately.
- **If Storage write fails after result**: keep gameplay result visible; storage failure must not block restart.

## Dependencies

Session Runtime is the integration owner for all MVP systems.

| Dependency | Type | Contract |
|------------|------|----------|
| Board Model | Hard | Reset, place, remove, query board summaries. |
| Food Config | Hard | Resolve selected type to validated food data. |
| Game State Machine | Hard | Authoritative state and event priority. |
| RNG / Difficulty Scheduler | Hard | Spawn decisions and conveyor duration. |
| Input Adapter | Hard | Gameplay drag intent source. |
| Clear Resolver | Hard | Clear result after placement. |
| Pressure / Pending System | Hard | Pressure/pending updates and failure cause. |
| Scoring / Result Rules | Hard | Score and result snapshot. |
| Gameplay HUD / Result UI | Downstream | Displays session snapshot. |
| Feedback Layer | Downstream | Consumes runtime events. |
| Storage | Downstream | Saves final result/best state. |
| Smoke Test Harness | Downstream | Runs integration tests against runtime. |

## Tuning Knobs

| Knob | Current Value | Safe Range | Effect |
|------|---------------|------------|--------|
| `spawnStateMaxMs` | `100ms` | `50..200ms` | Maximum expected spawning lock before current food appears. |
| `betweenFoodDelayMs` | `150ms` | `80..300ms` | Breathing room after placement/timeout before next food. |
| `maxGameplayDtMs` | `100ms` | `33..250ms` | Prevents huge tab-resume delta from exploding pressure/timer. |
| `runIdCallbackGuard` | `true` | MVP locked | Prevents old callbacks from mutating new runs. |
| `snapshotPublishHz` | `frame` | frame or event-driven | Controls HUD update cadence. |

## Visual/Audio Requirements

Session Runtime owns no art/audio. It must emit ordered events so Feedback Layer can play them once: spawn, pickup accepted, legal placement, invalid release, clear wave, pressure warning, pending increment, game over, restart.

## UI Requirements

Runtime snapshot must provide enough data for HUD and Result UI without those systems directly querying internals:

- `state`
- `currentFood`
- `timerRemaining`
- `conveyorDuration`
- `pressure`
- `pendingCount`
- `score`
- `clearStreak`
- `difficultyProfile`
- `displayLevel`
- `failureCause`
- final result payload after `GameOver`

UX Flag - Session Runtime: This system has UI requirements because it defines the snapshot consumed by HUD and Result UI.

## Acceptance Criteria

- **GIVEN** a new run starts, **WHEN** reset completes, **THEN** board, pressure, scoring, input, RNG history, current food, and GSM state are reset before spawning.
- **GIVEN** RNG selects `pot`, **WHEN** runtime creates current food context, **THEN** the context includes unique `foodId`, `foodType=pot`, `w=2`, `h=2`, duration, profile, and display level.
- **GIVEN** GSM says timer is paused, **WHEN** frame update runs, **THEN** current food timer does not decrease.
- **GIVEN** legal release is accepted, **WHEN** runtime resolves placement, **THEN** Board Model placement occurs before Clear Resolver, pressure relief, scoring, and feedback.
- **GIVEN** timeout occurs without valid placement, **WHEN** runtime resolves frame, **THEN** pending/miss pressure applies and current food is consumed.
- **GIVEN** restart occurs during pending feedback callback, **WHEN** old callback fires, **THEN** `canApplyCallback` is false and no old-run mutation occurs.
- **GIVEN** `GameOver` is entered, **WHEN** subsequent gameplay frame updates arrive, **THEN** no spawn, timer, pressure, board, or score mutation occurs until restart.
- **GIVEN** Storage fails to write final result, **WHEN** result UI appears, **THEN** result remains visible and restart remains available.

## Open Questions

| Question | Current Assumption | Owner | Target Resolution |
|----------|--------------------|-------|-------------------|
| Should runtime use fixed-step simulation or frame-delta updates? | Use frame-delta with max dt clamp for MVP H5 simplicity. | Technical | Implementation setup. |
| Should elapsed time pause on tab hidden? | Pause runtime frame updates while hidden; do not punish invisible play. | Technical / Design | Browser QA pass. |
| Should runtime expose replay logs by default? | Only in debug/test builds for MVP. | QA | Smoke Test Harness design. |
