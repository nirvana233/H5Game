# Scoring / Result Rules

> **Status**: Approved
> **Author**: Fox + Codex agents
> **Last Updated**: 2026-06-22
> **Implements Pillar**: 失败也好笑; 消除必须救命; 短局高复玩

## Overview

Scoring / Result Rules 是《冰箱爆仓了》的得分、连消、结算评级和失败文案系统，负责把有效放置、清除数量、连续清除 streak、多组同时清除、存活时间、浪费次数和最终失败原因转换为分数与可分享的结果卡。它不决定棋盘占格、食物生成、清除资格或压力变化，只消费 Session Runtime、Clear Resolver、Pressure / Pending System 和 Food Config 的结果，输出玩家能理解、能比较、愿意截图的成绩。

## Player Fantasy

玩家幻想是“我这局整理得有多强，死因有多好笑”。分数要奖励真正救命的清除，而不是机械放置；称号要让玩家看懂自己是空间规划大师、连消高手，还是被汤锅/冻鱼搞爆了冰箱。失败结果不应该只是冷冰冰的 Game Over，而是一个能转发的生活梗。

## Detailed Design

### Core Rules

1. Scoring / Result Rules owns score, clear streak, run aggregate stats, result rating, title, and death reason text selection.
2. Valid placement gives small base score.
3. Clear score is the main score source.
4. Clear streak counts consecutive placements that trigger at least one clear.
5. A placement with no clear resets clear streak after placement scoring.
6. Timeout, pending increment, pressure failure, or restart resets clear streak for the next run.
7. Multi-clear bonus applies when one placement clears more than one component.
8. Score values are calculated after Clear Resolver output and before result snapshot.
9. Result rating uses final score, survival time, total cleared items, pending count, pressure, and failure cause.
10. Result text can reference Food Config `displayName` for dominant failure contributors if Session Runtime provides last missed or blocking foods.
11. Result generation must be deterministic for the same final stats.
12. Scoring does not reduce pressure, mutate board, spawn food, or control Game State Machine.

### States and Transitions

| State | Entry Condition | Exit Condition | Behavior |
|-------|-----------------|----------------|----------|
| `ScoreReset` | New run/restart | First scoring event | Score and aggregates are zero |
| `TrackingRun` | Run active | Placement, clear, timeout, or game over | Accumulates score and stats |
| `ApplyingPlacementScore` | Valid placement accepted | Score applied | Adds small placement score |
| `ApplyingClearScore` | Clear result has cleared items | Score/streak applied | Adds clear, streak, and multi-clear score |
| `BuildingResult` | GameOver entered | Result payload ready | Computes rating, title, share text, and death reason |
| `ResultReady` | Result computed | Restart | Exposes immutable final result |

| From | Trigger | Guard | To | Required Side Effects |
|------|---------|-------|----|-----------------------|
| `ScoreReset` | Run starts | Runtime reset complete | `TrackingRun` | Clear score, streak, and aggregate counters |
| `TrackingRun` | Valid placement | Food placed | `ApplyingPlacementScore` | Add placement score and placed count |
| `ApplyingPlacementScore` | Clear result received | `clearedItems > 0` | `ApplyingClearScore` | Increment clear streak before clear score |
| `ApplyingPlacementScore` | Clear result empty | `clearedItems == 0` | `TrackingRun` | Reset clear streak after scoring placement |
| `ApplyingClearScore` | Score applied | None | `TrackingRun` | Update best clear, total cleared, multi-clear stats |
| `TrackingRun` | GameOver | Failure cause exists | `BuildingResult` | Freeze final stats |
| `BuildingResult` | Result computed | None | `ResultReady` | Publish result card payload |

### Interactions with Other Systems

| System | Direction | Interface Contract |
|--------|-----------|--------------------|
| Session Runtime | Calls scoring at legal moments | Supplies placement events, clear results, elapsed time, final pressure/pending, and failure cause. |
| Clear Resolver | Scoring consumes clear stats | Uses `clearedItems`, `multiClearCount`, clear group types, and cleared cells. |
| Pressure / Pending System | Scoring consumes final risk stats | Uses final pressure, pending, and failure cause for result rating. |
| Food Config | Scoring consumes display data | Uses `displayName`, role, and type ids for result text. |
| Game State Machine | Timing contract | No score event may apply after `GameOver`; scoring occurs during placement/clear resolution. |
| Gameplay HUD / Result UI | UI consumes score/result | Displays live score, streak, final title, management index, and share text. |
| Storage | Storage consumes result | Saves best score and share-worthy stats. |
| Smoke Test Harness | Verifies deterministic scoring | Replays event sequences and expects exact score/result. |

## Formulas

### `placementScore`

The `placementScore` formula is defined as:

`placementScore(food) = 10 * food.w * food.h`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Food width | `food.w` | int | `1..3` | Current food footprint width |
| Food height | `food.h` | int | `1..2` | Current food footprint height |

**Output Range:** `10..40` for MVP foods.
**Example:** A `2x2` pot gives `40` placement score.

### `clearStreakAfterPlacement`

The `clearStreakAfterPlacement` formula is defined as:

`clearStreakAfterPlacement(previousStreak, clearedItems) = previousStreak + 1 if clearedItems > 0 else 0`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Previous streak | `previousStreak` | int | `0..N` | Consecutive clearing placements before this placement |
| Cleared items | `clearedItems` | int | `0..N` | Food instances cleared by this placement |

**Output Range:** Integer `0..N`.
**Example:** Previous streak `2` and a clear result gives streak `3`; no clear gives `0`.

### `clearStreakMultiplier`

The `clearStreakMultiplier` formula is defined as:

`clearStreakMultiplier(clearStreak) = min(2.0, 1.0 + 0.25 * max(0, clearStreak - 1))`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Clear streak | `clearStreak` | int | `0..N` | Consecutive clear placements after this placement |

**Output Range:** Float `1.0..2.0`.
**Example:** Streak `3` gives multiplier `1.5`.

### `clearScore`

The `clearScore` formula is defined as:

`clearScore(clearedItems, clearStreak, multiClearCount) = round((100 * clearedItems) * clearStreakMultiplier(clearStreak) + 150 * max(0, multiClearCount - 1))`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Cleared items | `clearedItems` | int | `0..N` | Whole food instances cleared |
| Clear streak | `clearStreak` | int | `0..N` | Streak after increment |
| Multi clear count | `multiClearCount` | int | `0..N` | Number of clear groups in this placement |

**Output Range:** Nonnegative integer.
**Example:** Clearing 3 items at streak 2 with one group gives `round(300 * 1.25) = 375`.

### `managementIndex`

The `managementIndex` formula is defined as:

`managementIndex = clamp(round(score / 80 + survivalSeconds * 0.5 + totalClearedItems * 2 - pendingCount * 12 - finalPressure * 0.25), 0, 100)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Score | `score` | int | `>=0` | Final score |
| Survival seconds | `survivalSeconds` | float | `>=0` | Run duration |
| Total cleared items | `totalClearedItems` | int | `>=0` | Aggregate clear count |
| Pending count | `pendingCount` | int | `0..3` | Final miss counter |
| Final pressure | `finalPressure` | float | `0..100` | Final pressure |

**Output Range:** Integer `0..100`.
**Example:** `score=2400`, `survival=100`, `cleared=18`, `pending=1`, `pressure=80` gives index `84`.

### `resultTier`

The `resultTier` formula is defined as:

`resultTier(index) = S if index >= 90 else A if index >= 75 else B if index >= 55 else C if index >= 35 else D`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Management index | `index` | int | `0..100` | Output of `managementIndex` |

**Output Range:** `S`, `A`, `B`, `C`, or `D`.
**Example:** Index `84` gives tier `A`.

## Edge Cases

- **If a placement clears nothing**: add placement score, then reset clear streak to `0`.
- **If a placement clears multiple components**: apply one placement score, one clear score calculation, and multi-clear bonus.
- **If clear result reports `clearedItems=0` but `multiClearCount>0`**: treat as invalid input and fail test validation.
- **If score calculation would produce a fractional value**: round to nearest integer at formula output.
- **If result is built with missing failure cause**: use `unknown` in debug/test and generic result text in player builds.
- **If Food Config display name is missing for result text**: fall back to `type` id in debug and a generic food label in player builds.
- **If Storage has an older best score**: Scoring does not write it directly; Storage decides whether to update.
- **If player restarts during result animation**: result payload remains immutable for the old run and is discarded by Session Runtime runId guard.

## Dependencies

| Dependency | Type | Contract |
|------------|------|----------|
| Session Runtime | Hard | Calls scoring and builds result at legal times. |
| Clear Resolver | Hard | Supplies clear stats. |
| Pressure / Pending System | Hard | Supplies final pressure, pending, and failure cause. |
| Food Config | Hard | Supplies names and type labels. |
| Game State Machine | Hard timing | Prevents score after GameOver. |
| Gameplay HUD / Result UI | Downstream | Displays live and final score. |
| Storage | Downstream | Saves best result. |
| Smoke Test Harness | Downstream | Verifies formulas. |

## Tuning Knobs

| Knob | Current Value | Safe Range | Effect |
|------|---------------|------------|--------|
| `placementScorePerCell` | `10` | `5..20` | Raises small reward for every successful placement. |
| `clearScorePerItem` | `100` | `70..150` | Raises main clearing reward. |
| `streakMultiplierStep` | `0.25` | `0.1..0.4` | Makes consecutive clears more valuable. |
| `streakMultiplierCap` | `2.0` | `1.5..3.0` | Caps runaway scoring. |
| `multiClearBonus` | `150` | `80..250` | Rewards simultaneous groups. |
| `managementScoreDivisor` | `80` | `60..120` | Controls score contribution to result index. |
| `pendingPenalty` | `12` | `8..20` | Penalizes missed foods in final rating. |
| `pressurePenalty` | `0.25` | `0.1..0.5` | Penalizes near-fail pressure. |

## Visual/Audio Requirements

Scoring emits events for HUD and result feedback: score pop, streak label, multi-clear label, new best, result tier reveal, and share text. It owns no animation timing. Result copy should be concise and shareable.

Asset Spec: Visual/Audio requirements are defined. After the art bible is approved, run `/asset-spec system:Scoring Result Rules` for score pop and result card treatment.

## UI Requirements

- HUD must display live score and optionally current clear streak.
- Result UI must display management index, tier, score, survival time, cleared item count, pending count, failure cause, title, and share text.
- Result title should be short enough for a mobile card.
- Debug result may show raw formula inputs; player result should not.

UX Flag - Scoring / Result Rules: This system has UI requirements for live score and result card.

## Acceptance Criteria

- **GIVEN** a `3x1` fish is placed, **WHEN** placement score applies, **THEN** it awards `30`.
- **GIVEN** previous streak is `2` and the placement clears items, **WHEN** streak updates, **THEN** new streak is `3`.
- **GIVEN** previous streak is `2` and the placement clears nothing, **WHEN** streak updates, **THEN** new streak is `0`.
- **GIVEN** `clearedItems=3`, `clearStreak=2`, `multiClearCount=1`, **WHEN** clear score applies, **THEN** score added is `375`.
- **GIVEN** a final management index of `84`, **WHEN** result tier is calculated, **THEN** tier is `A`.
- **GIVEN** failure cause is `pending_full`, **WHEN** result payload is built, **THEN** failure text references too many missed foods or pending overflow.
- **GIVEN** identical final stats, **WHEN** result generation runs twice, **THEN** title, tier, and share text are identical.

## Open Questions

| Question | Current Assumption | Owner | Target Resolution |
|----------|--------------------|-------|-------------------|
| Should score favor survival time more than clear count? | Clear count should dominate because clears are the core rescue action. | Game Design | Balance pass. |
| How many result titles are needed for MVP? | At least 8 reusable titles covering strong/weak runs and major failure causes. | Writer / UI | Before result UI implementation. |
| Should share text include specific food names? | Yes when last missed/blocking food data is available. | UI / Writing | Result UI design. |
