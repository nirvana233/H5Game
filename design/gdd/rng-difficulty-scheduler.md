# RNG / Difficulty Scheduler

> **Status**: Approved
> **Author**: Fox + Codex agents
> **Last Updated**: 2026-06-21
> **Implements Pillar**: 短局高复玩; 形状制造戏剧; 消除必须救命

## Overview

RNG / Difficulty Scheduler 是《冰箱爆仓了》的出货节奏与难度曲线系统，负责把局内经过时间转换成当前难度档、可生成食物池、食物权重、传送带倒计时和公平性限制。它消费 Food Config 提供的 7 种 MVP 食物、解锁时间和权重查询契约，向 Session Runtime / Game State Machine 提供“下一个食物是什么”和“这个食物有多少秒可处理”。它不检查棋盘是否放得下，也不因为当前棋盘拥挤而偷偷换食物；这种压力必须保留给 Board Model、Pressure / Pending System 和玩家空间规划共同产生。它的核心目标是让后期压力稳定上升，同时避免纯随机连续大件或长时间同类重复造成不可读的失败。

## Player Fantasy

RNG / Difficulty Scheduler 的玩家幻想是“冰箱越来越难收拾，但不是游戏在乱坑我”。玩家不会直接看到随机表或难度档，但会感觉每局有清晰的节奏：开局给足理解空间，中段汤锅和冻鱼逐步制造形状压力，后期传送带变快、大件更常出现，逼玩家提前预留空间和主动制造三消。这个系统要制造“下一件会不会很难放”的紧张感，同时保留公平信任：连续同类和连续大件有上限，失败应来自玩家没有规划好空间或错过时机，而不是无法解释的随机暴击。

## Detailed Design

### Core Rules

1. RNG / Difficulty Scheduler owns the current difficulty profile, food spawn weighting, anti-streak fairness, conveyor duration at spawn time, and deterministic seed behavior.
2. It consumes Food Config only after Food Config is validated. It may read `type`, `unlockAtSeconds`, `w`, `h`, `pressureProfile`, and `configWeight`, but must not mutate food definitions.
3. It does not inspect Board Model occupancy and must not replace a selected food just because the current board has no legal placement for it. No-space pressure is a real gameplay consequence, not a hidden spawn correction.
4. It does not own pressure values, pending count, score, clear rules, input, or state transitions. It only publishes difficulty context and spawn timing inputs that those systems consume.
5. Difficulty is based on run-local elapsed seconds, not score, streak, pending count, or board fullness.
6. MVP difficulty uses six profiles:

| Profile | Time Window | Display Level | Weighted Pool | Conveyor Duration | Design Intent |
|---------|-------------|---------------|---------------|-------------------|---------------|
| `L1` | `0-19s` | `1` | `tea x2`, `leftover x2`, `egg`, `pizza`, `gift` | `5.00s` | Learn dragging, fitting, and same-type adjacency |
| `L2` | `20-39s` | `2` | `tea`, `leftover`, `egg x2`, `pizza`, `gift`, `pot` | `4.54s` | Introduce first large square pressure |
| `L3` | `40-59s` | `3` | `tea`, `leftover`, `egg`, `pizza`, `gift`, `pot`, `fish` | `4.08s` | Introduce horizontal `3x1` pressure |
| `L4` | `60-79s` | `4` | `tea`, `leftover`, `egg`, `pizza`, `gift x2`, `pot x2`, `fish` | `3.47s` | Make late pressure clearly visible |
| `L5` | `80-99s` | `5` | `tea`, `leftover`, `egg`, `pizza`, `gift x2`, `pot x3`, `fish x2` | `2.86s` | Make large food the main threat |
| `L6` | `100s+` | `6` | `tea`, `leftover`, `egg`, `pizza`, `gift x2`, `pot x3`, `fish x3` | `2.70s` | Extreme survival with capped timer speed |

7. A food type is spawn-eligible only if all of the following are true:
   - Food Config contains the `type`.
   - `elapsedSeconds >= food.unlockAtSeconds`.
   - the current difficulty profile gives that `type` a positive weight.
8. Locked food must never spawn even if a difficulty profile accidentally assigns it a positive weight.
9. A profile weight of `0` means the food is absent from that profile; it does not change the Food Config unlock state.
10. Random selection uses the weighted pool after unlock filtering and fairness filtering. The selected output is one food `type`, not a board instance and not a rendered asset.
11. Same-type anti-streak cap: the same `type` may not be emitted more than `3` times in a row during MVP.
12. Large-food anti-streak cap: `pot` and `fish` share a `largePressureFood` group; the group may not be emitted more than `3` times in a row during MVP.
13. Anti-streak caps count generated current-food outputs whether the player placed the food, missed it, or lost shortly after it appeared.
14. Anti-streak history resets on a new run or restart. It must not persist across sessions unless a future Daily Challenge GDD explicitly requires a fixed sequence.
15. Fairness filtering re-normalizes the remaining candidate weights. It must not alter the base profile weights stored in tuning data.
16. If filtering would remove every candidate in a valid MVP profile, the scheduler falls back to the unfiltered unlocked positive-weight pool, emits a QA warning in debug/test builds, and records the event for Smoke Test coverage. This is a config/tuning fault, not normal expected play.
17. Spawn results must be deterministic for the same seed, elapsed-time request sequence, difficulty table, Food Config version, and anti-streak history.
18. Production runtime may choose any deterministic PRNG implementation, but gameplay code must not call ambient nondeterministic randomness directly for food selection.
19. Conveyor duration is sampled from the current difficulty profile at spawn time. Once a current food is emitted, Game State Machine controls when that timer runs, pauses, expires, or is discarded.
20. Difficulty does not decrease during a run. If elapsed time crosses a profile boundary while a food is already live, the current food keeps its originally assigned duration; the next spawn uses the new profile.
21. The scheduler may expose debug information such as current profile, display level, active type count, candidate weights, seed, and recent spawn history. Player-facing HUD should show only simple difficulty cues unless the Gameplay HUD GDD asks for more.
22. Daily Challenge may later consume fixed seeds or fixed schedule tables, but MVP free play only requires deterministic replay for QA and smoke tests.

### States and Transitions

These states are internal scheduler lifecycle states, not Game State Machine states.

| State | Entry Condition | Exit Condition | Behavior |
|-------|-----------------|----------------|----------|
| `Uninitialized` | Page/app has not prepared RNG | New run or restart provides seed and tuning table | No spawn can be emitted |
| `Ready` | Seed, Food Config, and difficulty table are available | Session Runtime requests the next spawn | Holds run-local seed, recent history, and current elapsed time source |
| `EvaluatingProfile` | Spawn request arrives with `elapsedSeconds` | Profile is resolved or validation fails | Maps elapsed time to one of `L1..L6` and checks profile data |
| `BuildingCandidatePool` | Profile is resolved | Candidate pool is non-empty or invalid | Applies Food Config unlock gates and positive profile weights |
| `ApplyingFairnessFilters` | Candidate pool exists | Filtered candidates are ready | Applies same-type and large-food anti-streak caps |
| `SelectingFood` | Filtered candidates are ready | One food type is selected | Performs deterministic weighted random selection |
| `SpawnDecisionReady` | Food type and timer are selected | Session Runtime consumes the decision | Emits `foodType`, `difficultyProfile`, `displayLevel`, `conveyorDuration`, and debug metadata |
| `SchedulerError` | Required config, seed, or profile data is invalid | Run is reset or config is fixed | Emits no valid spawn; development/test builds should fail loudly |

| From | Trigger | Guard | To | Required Side Effects |
|------|---------|-------|----|-----------------------|
| `Uninitialized` | New run / restart | Valid seed source and difficulty table exist | `Ready` | Clear recent history; store seed; set request count to `0` |
| `Ready` | Spawn requested | Food Config is validated | `EvaluatingProfile` | Read elapsed seconds from Session Runtime |
| `EvaluatingProfile` | Profile resolved | `elapsedSeconds >= 0` and profile exists | `BuildingCandidatePool` | Publish profile id and display level to local spawn context |
| `BuildingCandidatePool` | Candidate pool built | At least one unlocked positive-weight food exists | `ApplyingFairnessFilters` | Preserve base weights for debug/telemetry |
| `ApplyingFairnessFilters` | Fairness filters applied | Filtered pool is non-empty | `SelectingFood` | Re-normalize remaining candidate weights |
| `ApplyingFairnessFilters` | Fairness filters empty the pool | Unfiltered pool is non-empty | `SelectingFood` | Use fallback pool; emit debug/test warning |
| `SelectingFood` | Weighted choice completes | Selected food references Food Config type | `SpawnDecisionReady` | Append selected type to recent history; increment request count |
| `SpawnDecisionReady` | Decision consumed | Session Runtime accepts spawn result | `Ready` | Clear transient spawn context; keep seed/history |
| Any non-error state | Validation fails | Missing seed, missing profile, locked-only pool, or invalid food type | `SchedulerError` | Emit no gameplay spawn; surface fatal validation to runtime |
| `SchedulerError` | Restart / fixed config | Valid setup is available | `Ready` | Reset seed/history according to new run setup |

### Interactions with Other Systems

| System | Direction | Interface Contract |
|--------|-----------|--------------------|
| Food Config | RNG / Difficulty Scheduler consumes Food Config | Reads the canonical 7 MVP `type` ids, unlock times, and weight lookup contract. Locked foods cannot spawn. Food Config remains read-only. |
| Game State Machine | Game State Machine consumes spawn timing | During `Spawning`, it receives the selected current food and conveyor duration. It decides when the timer runs or pauses; the scheduler only supplies the duration. |
| Session Runtime | Session Runtime calls the scheduler | Provides run seed, elapsed seconds, restart boundaries, and spawn requests. Stores or forwards the emitted spawn decision to Game State Machine. |
| Pressure / Pending System | Pressure consumes difficulty context | Reads current difficulty profile/display level to choose its own pressure deltas. Pressure values and failure thresholds are not owned by the scheduler. |
| Board Model | Explicit non-dependency during selection | Scheduler must not inspect board occupancy, legal placements, or no-space state when choosing food. Board-driven pressure belongs downstream. |
| Clear Resolver | Indirect consumer through selected `type` | The selected `type` must match Food Config so later clear grouping can use stable identity. Scheduler does not evaluate clears. |
| Gameplay HUD / Result UI | Optional debug/display consumer | May show display level, active type count, or difficulty label. It should not show raw weights in player-facing UI. |
| Smoke Test Harness | Verification consumer | Provides fixed seeds and elapsed-time request sequences, then verifies exact profile, selected type, timer, and anti-streak behavior. |
| Daily Challenge | Future deterministic-seed consumer | May request fixed seed/profile tables for shared daily runs. MVP only needs the hook, not full daily challenge behavior. |
| Storage | Future persistence consumer | May store best runs with seed/profile metadata for replay/debug. MVP free play does not require persistence. |

## Formulas

These formulas define scheduler-owned spawn and difficulty decisions. They do not define miss pressure, no-space pressure, pressure decay, score, or clear values; those belong to Pressure / Pending System and Scoring / Result Rules.

### `profileIndex`

The `profileIndex` formula is defined as:

`profileIndex(elapsedSeconds) = min(5, floor(max(0, elapsedSeconds) / 20))`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Elapsed seconds | `elapsedSeconds` | float seconds | `>= 0` after runtime clamp | Run-local time supplied by Session Runtime |
| Profile length | `20` | int seconds | Fixed MVP value | Duration of each early/mid difficulty profile |
| Max index | `5` | int | Fixed MVP value | Caps the profile at `L6` after `100s` |

**Output Range:** Integer `0..5`; `0` maps to `L1`, `5` maps to `L6`.
**Example:** `profileIndex(45) = min(5, floor(45 / 20)) = 2`.

### `difficultyProfile`

The `difficultyProfile` formula is defined as:

`difficultyProfile(elapsedSeconds) = profileIds[profileIndex(elapsedSeconds)]`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Profile id list | `profileIds` | ordered list | `[L1,L2,L3,L4,L5,L6]` | Stable MVP profile order |
| Profile index | `profileIndex` | int | `0..5` | Output of `profileIndex(elapsedSeconds)` |

**Output Range:** One of `L1`, `L2`, `L3`, `L4`, `L5`, `L6`.
**Example:** `difficultyProfile(85) = profileIds[4] = L5`.

### `displayLevel`

The `displayLevel` formula is defined as:

`displayLevel(elapsedSeconds) = profileIndex(elapsedSeconds) + 1`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Profile index | `profileIndex` | int | `0..5` | Zero-based difficulty index |

**Output Range:** Integer `1..6`.
**Example:** `displayLevel(100) = 5 + 1 = 6`.

### `latePressureTier`

The `latePressureTier` formula is defined as:

`latePressureTier(elapsedSeconds) = max(0, profileIndex(elapsedSeconds) - 2)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Profile index | `profileIndex` | int | `0..5` | Zero-based difficulty index |
| Late-game offset | `2` | int | Fixed MVP value | Profiles `L1..L3` are not considered late pressure |

**Output Range:** Integer `0..3`. This is exposed for downstream pressure tuning; the scheduler does not apply pressure deltas.
**Example:** `latePressureTier(80) = max(0, 4 - 2) = 2`.

### `profileWeight`

The `profileWeight` formula is defined as:

`profileWeight(foodType, profile) = weightTable[profile][foodType] if present else 0`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Food type | `foodType` | enum | `tea,leftover,egg,pizza,gift,pot,fish` | Stable type id from Food Config |
| Difficulty profile | `profile` | enum | `L1..L6` | Output of `difficultyProfile` |
| Weight table | `weightTable` | map | nonnegative ints | Scheduler-owned spawn weights derived from the approved prototype table |

**MVP Weight Table:**

| Food Type | `L1` | `L2` | `L3` | `L4` | `L5` | `L6` |
|-----------|------|------|------|------|------|------|
| `tea` | 2 | 1 | 1 | 1 | 1 | 1 |
| `leftover` | 2 | 1 | 1 | 1 | 1 | 1 |
| `egg` | 1 | 2 | 1 | 1 | 1 | 1 |
| `pizza` | 1 | 1 | 1 | 1 | 1 | 1 |
| `gift` | 1 | 1 | 1 | 2 | 2 | 2 |
| `pot` | 0 | 1 | 1 | 2 | 3 | 3 |
| `fish` | 0 | 0 | 1 | 1 | 2 | 3 |

**Output Range:** Integer `0..3` for MVP profiles.
**Example:** `profileWeight(pot, L1) = 0`; `profileWeight(pot, L5) = 3`.

### `eligibleWeight`

The `eligibleWeight` formula is defined as:

`eligibleWeight(food, profile, elapsedSeconds) = profileWeight(food.type, profile) if elapsedSeconds >= food.unlockAtSeconds else 0`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Food config | `food` | object | One of 7 MVP foods | Food Config entry |
| Food type | `food.type` | enum | `tea,leftover,egg,pizza,gift,pot,fish` | Stable type id |
| Unlock time | `food.unlockAtSeconds` | int seconds | `{0,20,40}` | Food Config unlock gate |
| Difficulty profile | `profile` | enum | `L1..L6` | Current scheduler profile |
| Elapsed seconds | `elapsedSeconds` | float seconds | `>= 0` | Run-local time |

**Output Range:** Integer `0..3` for MVP. `0` means the food cannot spawn from this profile at this time.
**Example:** At `25s`, `eligibleWeight(fish, L2, 25) = 0` because fish unlocks at `40s`.

### `activeTypeCount`

The `activeTypeCount` formula is defined as:

`activeTypeCount(profile, elapsedSeconds) = count(food in allFoods where eligibleWeight(food, profile, elapsedSeconds) > 0)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| All foods | `allFoods` | set | 7 MVP foods | Canonical Food Config list |
| Eligible weight | `eligibleWeight` | int | `0..3` | Spawn eligibility after unlock and profile gates |

**Output Range:** Integer `5..7` for valid MVP tables.
**Example:** At `0s` in `L1`, active type count is `5`; at `40s` in `L3`, active type count is `7`.

### `fairnessAllowed`

The `fairnessAllowed` formula is defined as:

`fairnessAllowed(foodType, recentHistory) = recentSameTypeCount(foodType, recentHistory) < sameTypeCap AND (isLargePressureFood(foodType) == false OR recentLargePressureCount(recentHistory) < largeFoodCap)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Food type | `foodType` | enum | `tea,leftover,egg,pizza,gift,pot,fish` | Candidate type being tested |
| Recent history | `recentHistory` | ordered list | Last emitted food types in current run | Spawn outputs before the current request |
| Same-type count | `recentSameTypeCount` | int | `0..3+` | Count of immediately consecutive prior outputs matching `foodType` |
| Same-type cap | `sameTypeCap` | int | `3` in MVP | Maximum allowed same-type streak |
| Large pressure predicate | `isLargePressureFood` | bool | `true` for `pot` and `fish` | Shared large-food group |
| Large pressure count | `recentLargePressureCount` | int | `0..3+` | Count of immediately consecutive prior outputs where type is `pot` or `fish` |
| Large food cap | `largeFoodCap` | int | `3` in MVP | Maximum allowed large-food streak |

**Output Range:** Boolean.
**Example:** If the last three outputs are `pot,pot,pot`, then `fairnessAllowed(fish, history) = false` because the large-food streak is already `3`.

### `effectiveWeight`

The `effectiveWeight` formula is defined as:

`effectiveWeight(food, profile, elapsedSeconds, recentHistory) = eligibleWeight(food, profile, elapsedSeconds) if fairnessAllowed(food.type, recentHistory) else 0`

If every candidate would become `0`, the scheduler uses the unfiltered `eligibleWeight` pool for that spawn and emits a debug/test warning.

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Eligible weight | `eligibleWeight` | int | `0..3` | Weight after unlock/profile gates |
| Fairness allowed | `fairnessAllowed` | bool | `true/false` | Whether anti-streak caps allow this food |

**Output Range:** Integer `0..3` for MVP.
**Example:** At `L6`, if the last three outputs are `fish,pot,fish`, `effectiveWeight(pot) = 0` and `effectiveWeight(fish) = 0`; non-large candidates keep their eligible weights.

### `spawnChance`

The `spawnChance` formula is defined as:

`spawnChance(food, candidatePool) = effectiveWeight(food) / sum(effectiveWeight(eachFood) for eachFood in candidatePool)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Candidate pool | `candidatePool` | set | `1..7` foods | Foods with positive effective or fallback weight |
| Food effective weight | `effectiveWeight(food)` | int | `1..3` in candidate pool | Weight after all scheduler gates |
| Total effective weight | `totalWeight` | int | `>0` | Sum of candidate weights |

**Output Range:** Float `>0..1`, and all candidate chances sum to `1`.
**Example:** In `L1` with no fairness filtering, `spawnChance(tea) = 2 / 7`.

### `weightedRoll`

The `weightedRoll` formula is defined as:

`weightedRoll(seed, requestIndex, totalWeight) = floor(random01(seed, requestIndex) * totalWeight)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Seed | `seed` | int/string | Runtime-provided stable seed | Determines deterministic sequence |
| Request index | `requestIndex` | int | `0..runSpawnCount-1` | Spawn request number within the run |
| Random unit value | `random01` | float | `[0,1)` | Deterministic PRNG output for the seed/request pair |
| Total weight | `totalWeight` | int | `>0` | Sum of candidate weights |

**Output Range:** Integer `0..totalWeight-1`.
**Example:** If `totalWeight = 7` and `random01 = 0.20`, `weightedRoll = floor(1.4) = 1`.

### `selectedFoodType`

The `selectedFoodType` formula is defined as:

`selectedFoodType = first foodType in canonicalFoodOrder where cumulativeWeightStart(foodType) <= weightedRoll < cumulativeWeightEnd(foodType)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Canonical food order | `canonicalFoodOrder` | ordered list | `tea,leftover,egg,pizza,gift,pot,fish` | Stable order from Food Config |
| Weighted roll | `weightedRoll` | int | `0..totalWeight-1` | Output of `weightedRoll` |
| Cumulative range | `cumulativeWeightStart/End` | int pair | `0..totalWeight` | Half-open cumulative interval for each positive-weight food |

**Output Range:** One Food Config `type`.
**Example:** In `L1`, cumulative ranges are `tea:0..2`, `leftover:2..4`, `egg:4..5`, `pizza:5..6`, `gift:6..7`; roll `1` selects `tea`.

### `conveyorDuration`

The `conveyorDuration` formula is defined as:

`conveyorDuration(profile) = durationTable[profile]`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Difficulty profile | `profile` | enum | `L1..L6` | Profile at spawn time |
| Duration table | `durationTable` | map | seconds | Scheduler-owned conveyor duration table |

**Duration Table:**

| Profile | Duration |
|---------|----------|
| `L1` | `5.00s` |
| `L2` | `4.54s` |
| `L3` | `4.08s` |
| `L4` | `3.47s` |
| `L5` | `2.86s` |
| `L6` | `2.70s` |

**Output Range:** Float seconds `2.70..5.00`.
**Example:** `conveyorDuration(L4) = 3.47s`.

### `spawnDecision`

The `spawnDecision` formula is defined as:

`spawnDecision = { foodType: selectedFoodType, profile: difficultyProfile(elapsedSeconds), displayLevel: displayLevel(elapsedSeconds), latePressureTier: latePressureTier(elapsedSeconds), conveyorDuration: conveyorDuration(profile), requestIndex: requestIndex }`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Selected food type | `selectedFoodType` | enum | Food Config type | Output of deterministic weighted selection |
| Difficulty profile | `profile` | enum | `L1..L6` | Profile resolved for this spawn request |
| Display level | `displayLevel` | int | `1..6` | Player/debug readable level |
| Late pressure tier | `latePressureTier` | int | `0..3` | Downstream pressure context |
| Conveyor duration | `conveyorDuration` | float seconds | `2.70..5.00` | Timer duration assigned at spawn time |
| Request index | `requestIndex` | int | `>=0` | Spawn request number in the current run |

**Output Range:** One spawn decision object per spawn request.
**Example:** At `45s`, with selected type `fish`, the decision is `{foodType: fish, profile: L3, displayLevel: 3, latePressureTier: 0, conveyorDuration: 4.08s}`.

## Edge Cases

- **If `elapsedSeconds` is exactly `20`, `40`, `60`, `80`, or `100`**: use the new profile starting at that boundary. For example, `20.00s` maps to `L2`, not `L1`.
- **If `elapsedSeconds` is negative**: clamp it to `0` for scheduler profile calculation and emit a debug/test warning. Session Runtime should normally clamp run time before calling the scheduler.
- **If `elapsedSeconds` is `NaN`, infinite, or otherwise non-numeric**: enter `SchedulerError` and emit no spawn decision. A non-finite time source would make deterministic replay invalid.
- **If elapsed time jumps across multiple profile windows between two spawn requests**: use the profile for the current spawn request's elapsed time only. Do not emit skipped profiles or catch-up spawns.
- **If elapsed time crosses a profile boundary while a current food is already live**: do not change that food's conveyor duration or type. The next spawn request uses the new profile.
- **If Food Config is not validated when a spawn is requested**: enter `SchedulerError` and emit no food. RNG must not guess food definitions.
- **If the scheduler weight table references a food type not present in Food Config**: table validation fails in development/test builds. Player builds must not spawn the unknown type.
- **If a Food Config type is missing from a profile weight table**: treat the missing weight as `0` for that profile, matching the Food Config `configWeight` contract.
- **If a profile assigns a positive weight to a locked food**: the unlock gate wins and the effective eligible weight is `0` until `elapsedSeconds >= food.unlockAtSeconds`.
- **If every food has `eligibleWeight == 0` after unlock and profile gates**: enter `SchedulerError` and emit no spawn decision. This is an invalid tuning table, not a playable difficulty spike.
- **If anti-streak filtering removes every otherwise eligible candidate**: fall back to the unfiltered eligible pool for that one spawn, emit a debug/test warning, and record the fallback for Smoke Test coverage.
- **If only one food type is eligible and that type has already reached the same-type cap**: use the fallback rule and spawn it anyway rather than deadlocking the run. This should not happen with valid MVP profiles.
- **If the last three emitted foods are the same type**: block that same type from the filtered candidate pool when alternatives exist, regardless of whether those foods were placed, missed, or followed by GameOver.
- **If the last three emitted foods are any mix of `pot` and `fish`**: block both `pot` and `fish` from the filtered candidate pool when alternatives exist, because they share the large-pressure streak cap.
- **If a selected food has no legal board placement**: keep the selected food. The scheduler must not inspect Board Model or replace it with a smaller food; Pressure / Pending System owns the resulting no-space pressure.
- **If the same spawn request is retried before the decision is consumed**: return the same pending spawn decision and do not increment `requestIndex` or append history twice.
- **If a duplicate spawn request arrives after the decision was consumed but before Game State Machine returns to `Spawning`**: reject the duplicate as an invalid runtime call. One current-food cycle can consume only one scheduler decision.
- **If the seed is missing at new-run initialization**: enter `SchedulerError` in development/test builds. Player builds may ask Session Runtime for a generated run seed, but that generated seed must be stored before the first spawn for replay/debug.
- **If the seed changes mid-run without a restart**: reject the change and keep the original seed. Seed changes are only legal at new run, restart, or future Daily Challenge setup.
- **If `requestIndex` is reset without a restart**: reject the reset. Reusing request indices with the same seed would duplicate earlier random rolls and break replay.
- **If deterministic PRNG output is outside `[0,1)`**: treat it as an implementation error in development/test builds and emit no spawn decision. Do not silently modulo a broken random value.
- **If cumulative weights contain a gap or overlap because of implementation error**: fail the selection in development/test builds. The half-open cumulative ranges must cover exactly `0..totalWeight`.
- **If conveyor duration for a profile is missing, non-numeric, `<=0`, or outside the MVP safe table**: enter `SchedulerError` and emit no spawn decision. Game State Machine must never receive an invalid timer duration.
- **If a profile's active type count falls below `5` in MVP**: emit a tuning validation error. The opening learning pool and later variety rely on at least five active types.
- **If pause/page-hidden behavior changes elapsed time**: accept only the elapsed time supplied by Session Runtime. The scheduler does not run its own clock and does not decide whether pause time counts.
- **If restart occurs**: clear recent history, clear pending spawn context, reset request index, and initialize from the new run seed before the next spawn.
- **If Daily Challenge later supplies a fixed seed or fixed schedule**: apply that future mode only through an explicit Daily Challenge contract. MVP free play must continue to use normal scheduler profiles and anti-streak rules.

## Dependencies

### Dependency Position

RNG / Difficulty Scheduler is an MVP Core-layer gameplay system. Its only formal upstream dependency in the systems index is Food Config, because the scheduler must know which food types exist, when they unlock, and which ids are legal before it can emit spawn decisions.

At runtime, it also relies on Session Runtime for seed, elapsed time, restart boundaries, and spawn request timing. Those are execution inputs rather than design ownership of food rules.

### Hard Dependencies

| System | Dependency Type | Contract | Status |
|--------|-----------------|----------|--------|
| Food Config | Upstream data source | Provides canonical MVP food ids, unlock times, and read-only food entries. Scheduler must not invent, mutate, rotate, or repair food definitions. | Approved |
| Session Runtime | Runtime caller / time source | Provides run seed, run-local elapsed seconds, restart boundaries, and exactly one spawn request per current-food cycle. Scheduler does not run its own clock. | Approved |

### Runtime Consumers

| System | Relationship | Contract | Status |
|--------|--------------|----------|--------|
| Game State Machine | Consumes spawn timing output | Receives selected `foodType` and `conveyorDuration` during `Spawning`; owns timer run/pause/expiry behavior after the decision is emitted. | Approved |
| Pressure / Pending System | Consumes difficulty context | Reads `profile`, `displayLevel`, and `latePressureTier` to choose pressure deltas. It owns pressure values, pending count, and failure thresholds. | Approved |
| Session Runtime | Consumes decision object | Stores or forwards `spawnDecision`, prevents duplicate consumption, and applies restart/reset boundaries to scheduler state. | Approved |
| Gameplay HUD / Result UI | Optional display consumer | May display player-readable level, active type count, or simple difficulty label. It must not expose raw seed, roll, or weight tables in normal player UI. | Approved |
| Smoke Test Harness | Verification consumer | Supplies fixed seeds and elapsed-time request sequences, then validates exact profiles, selected types, durations, anti-streak behavior, and fallback warnings. | Approved |
| Daily Challenge | Future fixed-seed consumer | May later request fixed seeds or fixed schedule tables. This is a post-MVP dependency hook, not required for MVP free play. | Not Started |
| Storage | Future metadata consumer | May store seed/profile metadata for replay, debugging, or daily challenge results. MVP free play does not require persistence. | Approved |

### Explicit Non-Dependencies

| System | Boundary |
|--------|----------|
| Board Model | Scheduler must not inspect occupancy, legal placements, holes, or no-space state when selecting food. Board pressure remains an authored gameplay consequence. |
| Clear Resolver | Scheduler does not evaluate match groups, clear opportunity, combo potential, or whether the next spawn can create a clear. |
| Scoring / Result Rules | Scheduler does not scale score, streak rewards, or result rank. It may expose profile metadata that scoring can record later. |
| Feedback Layer | Scheduler does not trigger player feedback directly. Feedback should listen to downstream state, pressure, or HUD events. |

### Provisional Assumptions

- Session Runtime will own a stable run seed before the first spawn request.
- Session Runtime will pass elapsed time already adjusted for pause/page-hidden policy.
- Session Runtime will not issue another spawn request until the previous `spawnDecision` has been consumed or the run restarts.
- Pressure / Pending System will decide whether and how `latePressureTier` maps to miss pressure, no-space pressure, and pressure decay.
- Smoke Test Harness will define the exact deterministic PRNG implementation or golden output list during implementation planning.
- Daily Challenge may override seed policy later, but it must not silently change MVP free-play randomness.

### Cross-System Consistency Notes

- Food Config's unlock gates remain authoritative. Positive scheduler weights never override `unlockAtSeconds`.
- Game State Machine owns same-frame event priority. Scheduler only assigns a food and duration before the current-food cycle starts.
- The current `5.00s` start and `2.70s` minimum conveyor durations are owned here and consumed by Game State Machine.
- The current weighted pool table is owned here and must stay equivalent to the prototype table unless tuning changes are made explicitly.
- Difficulty tuning must not be performed by changing Board Model dimensions, Food Config footprints, or Game State Machine lock windows.

## Tuning Knobs

RNG / Difficulty Scheduler tuning controls spawn pacing, food mix, and fairness filtering. It must not tune board size, food footprints, clear rules, pressure deltas, score values, or state-machine lock windows.

### Owned Knobs

| Knob | Default / MVP Target | Safe Range | Too Low | Too High |
|------|----------------------|------------|---------|----------|
| `profileLengthSeconds` | `20s` | `15..30s` | Difficulty changes too quickly and players may not understand new shapes before pressure increases | Opening and midgame feel flat; late pressure arrives too slowly |
| `maxProfileIndex` | `5` (`L6`) | `5` for MVP | Fewer profiles reduce late-game texture and weaken replay variety | More profiles require new pressure, QA, and HUD expectations |
| `durationTable` | `5.00, 4.54, 4.08, 3.47, 2.86, 2.70s` | `2.70..5.50s`, monotonic non-increasing | Timer becomes physically hard on mobile and can feel unfair | The conveyor loses urgency and the core pressure fades |
| `weightTable` | MVP table from `profileWeight` | per-food weight `0..5`; total profile weight `5..14` | Too many zeros reduce variety and can deadlock fairness filters | Overweighted large foods create random-feeling failures |
| `sameTypeCap` | `3` | `2..4` | Breaks useful streak setup and can make same-type clearing feel rare | Allows repetitive output that looks broken or boring |
| `largeFoodCap` | `3` | `2..4` | Over-sanitizes the exact large-shape pressure the game needs | Allows too many `pot` / `fish` outputs in a row and feels like RNG punishment |
| `minActiveTypeCount` | `5` | `5..7` | Opening pool becomes too narrow and repetitive | Too many early types increase recognition load before players learn the loop |
| `canonicalFoodOrder` | `tea,leftover,egg,pizza,gift,pot,fish` | Locked after smoke tests exist | Changing order can change deterministic roll outputs and invalidate QA seeds | Same as too low; this is an order contract, not a balance lever |
| `seedMode` | Free play generated seed; QA fixed seed allowed | `freeplay`, `fixed-test`, future `daily` | Missing seeds break replay/debug | Overexposed fixed seeds can make free play feel patterned |
| `fairnessFallbackMode` | Use unfiltered eligible pool + debug/test warning | Locked for MVP | Scheduler can deadlock when filters remove all candidates | Silent fallback hides bad tuning from QA |
| `debugSpawnInfoVisible` | `false` in player builds, `true` in QA/debug | `true/false` | QA loses visibility into profile, weights, seed, and history | Player-facing builds expose raw internals and feel unfinished |

### Profile Table Tuning Rules

- Duration table must be monotonic non-increasing from `L1` to `L6`.
- Weight changes must preserve Food Config unlock gates.
- `L1` must keep exactly the five opening food types active: `tea`, `leftover`, `egg`, `pizza`, and `gift`.
- `pot` must not appear before Food Config unlocks it at `20s`.
- `fish` must not appear before Food Config unlocks it at `40s`.
- Large-food pressure should increase mainly through weights after `60s`, not by reducing the timer below `2.70s`.
- Any change to `weightTable`, `durationTable`, `sameTypeCap`, or `largeFoodCap` requires updating Smoke Test Harness expected outputs.

### Referenced But Not Owned

| Value | Owning System | Scheduler Usage |
|-------|---------------|-----------------|
| Food `type`, `w,h`, display name, unlock time | Food Config | Reads ids and unlock gates; does not mutate definitions |
| Board columns, rows, occupancy, and legal placement | Board Model | Explicitly not read by scheduler |
| Timer run/pause/expiry and same-frame timeout priority | Game State Machine | Scheduler only emits duration at spawn time |
| Miss pressure, no-space pressure, decay, pressure cap | Pressure / Pending System | Scheduler exposes profile context only |
| Score, combo, result rank, death copy | Scoring / Result Rules / UI | Scheduler may expose profile metadata but does not score |
| Daily fixed seed and shared challenge rules | Daily Challenge | Future consumer; MVP free play seed policy remains scheduler/runtime-owned |

### Tuning Workflow

1. Tune `weightTable` first if the user says "后期种类/大件压力不够".
2. Tune `durationTable` only after food mix feels right; lowering duration too early can hide whether shape pressure is working.
3. Tune `sameTypeCap` and `largeFoodCap` only if playtests report visible unfair repetition.
4. Never compensate for weak late-game pressure by shrinking the board or changing food footprints in this GDD.

## Visual/Audio Requirements

RNG / Difficulty Scheduler does not own final visuals, animation, sound, or haptics. It must expose clean event/context data so HUD, Feedback Layer, and Audio / Haptics can communicate pacing changes without showing raw randomness.

| Scheduler Event / Output | Visual Requirement | Audio / Haptic Requirement | Owning Consumer |
|--------------------------|--------------------|----------------------------|-----------------|
| New `spawnDecision` emitted | Current food appears through the normal conveyor/current-food presentation. The scheduler must not trigger a separate visual effect by itself. | Optional arrival cue belongs to Feedback Layer / Audio, not scheduler. | Session Runtime / Game State Machine / Feedback Layer |
| `displayLevel` changes | HUD may show a subtle level or danger-step update. It should not interrupt play with a modal or long banner. | Optional short intensity cue can be added later, but it must not mask placement/clear feedback. | Gameplay HUD / Feedback Layer / Audio |
| New food type becomes eligible (`pot` at `20s`, `fish` at `40s`) | HUD or Feedback Layer may briefly emphasize the first appearance of the newly unlocked type. This is a player-facing learning cue, not a scheduler-owned tutorial. | Optional first-appearance sting is allowed if it stays shorter than placement/clear feedback. | Gameplay HUD / Feedback Layer / Audio |
| Conveyor duration decreases by profile | Timer bar and conveyor pacing should visually communicate urgency through existing timer UI. No separate "RNG got harder" text is required. | Optional tension layer may rise with profile, but audio must follow HUD/Feedback events rather than reading scheduler internals directly. | Gameplay HUD / Audio |
| `activeTypeCount` changes | Debug/tuning UI may display active type count. Player HUD may show a simplified "当前种类" indicator only if Gameplay HUD GDD approves it. | No direct audio requirement. | Gameplay HUD / Debug UI |
| Anti-streak filter applies | No player-facing feedback. The game should feel fair without revealing the filter. | No audio or haptic feedback. | Smoke Test Harness / Debug UI |
| Fairness fallback occurs | QA/debug overlay should show fallback warning, seed, profile, recent history, and candidate pool. Player builds must hide this. | No player-facing audio; debug logging only. | Debug UI / Smoke Test Harness |
| Scheduler error | Player build should route through a generic restart-safe failure flow if needed. Debug/test builds should fail loudly with profile/seed/table details. | Error audio is not required; avoid alarming player-facing cues for internal validation failures. | Session Runtime / Debug UI |

### Readability Rules

- Difficulty feedback should feel like rising conveyor pressure, not like hidden manipulation.
- Player-facing UI must not show raw weights, PRNG roll values, seed strings, cumulative ranges, or anti-streak decisions.
- Debug builds must be able to reveal profile, display level, active type count, seed, request index, recent spawn history, candidate pool, and fallback warnings.
- First appearance of `pot` and `fish` may receive a stronger visual cue than ordinary level changes because those foods change the player's spatial planning problem.
- Timer urgency must remain visually synchronized with Game State Machine pause/resume rules; timer visuals must not keep draining during `ResolvingClears`, `AwaitingNext`, or `GameOver`.
- Scheduler feedback must not obscure the fridge board, current food footprint, legal/illegal placement preview, pressure HUD, or clear feedback.

### Asset / Audio Boundaries

- This GDD does not specify final icons, color palettes, particles, music layers, or haptic patterns.
- Food visuals belong to Food Config / Visual Asset Spec.
- Timer, difficulty, and active-type HUD treatment belong to Gameplay HUD / Result UI.
- Level-up and first-appearance animation belongs to Feedback Layer.
- Music intensity, stingers, and haptics belong to Audio / Haptics.

## UI Requirements

RNG / Difficulty Scheduler does not own a HUD, menu, result screen, or debug panel. It provides UI-safe difficulty context to downstream presentation systems, and it provides richer diagnostic context only to debug / QA surfaces.

### Player-Facing UI Outputs

| Output | Range / Values | Intended UI Use | Visibility Rule |
|--------|----------------|-----------------|-----------------|
| `displayLevel` | `1` through `6` | Optional small level chip, danger step, or pacing label in Gameplay HUD. | May be shown if HUD design approves it; never expose raw `L1` / `L2` profile names. |
| `conveyorDuration` | `5.00s`, `4.54s`, `4.08s`, `3.47s`, `2.86s`, `2.70s` | Drives the visible conveyor / timer bar duration through Game State Machine and Gameplay HUD. | Must be visualized as remaining time pressure, not as a scheduler debug number. |
| `activeTypeCount` | `5` to `7` | Optional compact "当前种类" indicator or tuning readout. | Hide in player HUD if it competes with board readability, pressure, or current food preview. |
| `newlyEligibleFoodType` | `pot` at `20s`, `fish` at `40s` | Optional first-appearance cue so the player understands a new spatial problem entered the run. | Cue must be brief and non-modal; it cannot pause or cover the board. |
| `difficultyProfile` / `latePressureTier` | Internal profile ids and late pressure tier | May inform friendly HUD intensity states such as calm / busy / danger. | Raw enum strings must remain hidden from player builds. |

### Debug / QA UI Outputs

Debug and QA surfaces must be able to show:

- Active seed and `requestIndex`.
- Current elapsed time, `profileIndex`, `difficultyProfile`, and `displayLevel`.
- Selected `foodType`, candidate pool, base weights, filtered weights, and final spawn chances.
- Recent spawn history used by `sameTypeCap` and `largeFoodCap`.
- Fairness-blocked types, fallback use, and fallback reason.
- PRNG roll value and cumulative weighted ranges for deterministic replay debugging.
- `durationTable` and `weightTable` version or hash if tuning data is externalized later.

### UI Rules

- Player-facing UI must not reveal raw seed values, PRNG rolls, cumulative ranges, candidate weights, anti-streak decisions, fallback reasons, or internal profile ids.
- UI can read the latest `spawnDecision` and difficulty context, but it cannot mutate scheduler state, force a reroll, reset history, or change the seed mid-run.
- Timer UI must obey Game State Machine pause and resolution states. It must not drain while the active state is `ResolvingClears`, `AwaitingNext`, or `GameOver`.
- Difficulty changes should use text, icon, shape, or motion in addition to color. Color-only "danger" escalation is not acceptable.
- First-appearance cues for `pot` and `fish` should stay under `1s`, must not use a modal, and must not block input once the next food is playable.
- Debug warnings for duplicate spawn requests, empty candidate pools, fallback selection, or scheduler validation failure must be hidden from player builds.
- Result UI may record final `displayLevel`, elapsed time, and late-pressure context for summary or telemetry, but player-facing failure copy must attribute loss to overflow / pressure, not to "bad RNG".
- Reduced-motion settings must allow level-change and first-appearance cues to degrade to static text/icon treatment.

## Acceptance Criteria

### Core Behavior

- **GIVEN** a new run with validated Food Config, a valid seed, and the MVP difficulty table, **WHEN** Session Runtime initializes RNG / Difficulty Scheduler, **THEN** the scheduler enters `Ready`, clears recent history, stores the seed, and sets `requestIndex` to `0`.
- **GIVEN** Food Config has not reached a validated read-only state, **WHEN** Session Runtime requests a spawn, **THEN** the scheduler enters `SchedulerError` and emits no `spawnDecision`.
- **GIVEN** a valid Food Config entry contains `type`, `unlockAtSeconds`, `w`, `h`, `pressureProfile`, and `configWeight`, **WHEN** the scheduler builds a candidate pool, **THEN** it reads those values without mutating any Food Config entry.
- **GIVEN** the selected `foodType` has no legal placement on the current board, **WHEN** the scheduler emits the spawn, **THEN** it keeps the selected `foodType` and performs no Board Model occupancy, hole, or placement query.
- **GIVEN** board fullness, score, streak, pending count, and pressure differ between two test runs, **WHEN** seed, elapsed-time request sequence, Food Config version, difficulty table, and recent history are identical, **THEN** the scheduler emits the same sequence of profiles, food types, request indices, and conveyor durations.
- **GIVEN** elapsed time is `0s`, `20s`, `40s`, `60s`, `80s`, and `100s`, **WHEN** a spawn request is evaluated at each boundary, **THEN** the resolved profiles are `L1`, `L2`, `L3`, `L4`, `L5`, and `L6` respectively.
- **GIVEN** elapsed time is `0s` in `L1`, **WHEN** the scheduler builds its weighted pool, **THEN** only `tea`, `leftover`, `egg`, `pizza`, and `gift` have positive eligible weight.
- **GIVEN** elapsed time is `20s` in `L2`, **WHEN** the scheduler builds its weighted pool, **THEN** `pot` may become eligible and `fish` remains ineligible.
- **GIVEN** elapsed time is `40s` in `L3`, **WHEN** the scheduler builds its weighted pool, **THEN** all seven MVP food types may have positive eligible weight if their profile weights are positive.
- **GIVEN** a profile assigns weight `0` to a food type, **WHEN** the scheduler builds the candidate pool, **THEN** that food type is absent from the positive-weight candidate pool even if Food Config says it is unlocked.
- **GIVEN** a profile accidentally assigns a positive weight to a locked food, **WHEN** `elapsedSeconds < food.unlockAtSeconds`, **THEN** the food's `eligibleWeight` is `0` and it cannot spawn.
- **GIVEN** the last three emitted foods are the same `type` and at least one alternative candidate exists, **WHEN** the scheduler applies fairness filters, **THEN** that same `type` is removed from the filtered candidate pool for the current request.
- **GIVEN** the last three emitted foods are any mix of `pot` and `fish` and at least one non-large alternative exists, **WHEN** the scheduler applies fairness filters, **THEN** both `pot` and `fish` are removed from the filtered candidate pool for the current request.
- **GIVEN** the last three emitted foods reached an anti-streak cap because of placed, missed, or pre-GameOver outputs, **WHEN** the next spawn is requested, **THEN** those outputs all count toward recent history.
- **GIVEN** a new run or restart begins, **WHEN** the scheduler initializes from the new run seed, **THEN** recent history, pending spawn context, and `requestIndex` are reset before the first spawn.
- **GIVEN** fairness filtering removes one or more candidates but leaves at least one candidate, **WHEN** spawn chances are calculated, **THEN** chances are re-normalized from the filtered weights and the base tuning table remains unchanged.
- **GIVEN** fairness filtering removes every otherwise eligible candidate, **WHEN** a spawn is requested, **THEN** the scheduler uses the unfiltered eligible pool for that one spawn, emits a debug/test fallback warning, and records the fallback for Smoke Test coverage.
- **GIVEN** the same seed, elapsed-time request sequence, difficulty table, Food Config version, and anti-streak history, **WHEN** the sequence is replayed in QA, **THEN** every `spawnDecision` is byte-for-byte equivalent for `foodType`, `profile`, `displayLevel`, `latePressureTier`, `conveyorDuration`, and `requestIndex`.
- **GIVEN** gameplay code requests food selection, **WHEN** the implementation is inspected or instrumented, **THEN** food selection uses the scheduler's deterministic PRNG path and does not call ambient nondeterministic randomness directly.
- **GIVEN** a current food was emitted at `19.90s` with `L1` duration, **WHEN** elapsed time crosses `20.00s` while that food is still live, **THEN** the current food keeps its `5.00s` assigned duration and only the next spawn uses `L2`.
- **GIVEN** a run has progressed to a later profile, **WHEN** score, board state, or pressure improves, **THEN** the scheduler does not move back to an earlier difficulty profile during that run.
- **GIVEN** debug spawn info is enabled, **WHEN** a spawn decision is emitted, **THEN** debug UI or logs can show profile, display level, active type count, seed, request index, recent spawn history, candidate pool, filtered weights, and fallback status.
- **GIVEN** Daily Challenge is not active in MVP free play, **WHEN** a normal run starts, **THEN** scheduler profiles, seed policy, and anti-streak behavior follow the MVP free-play contract and no fixed daily schedule is applied.

### Formula Coverage

- **GIVEN** `elapsedSeconds = 45`, **WHEN** `profileIndex` is evaluated, **THEN** the output is `2`.
- **GIVEN** `elapsedSeconds = -3`, **WHEN** `profileIndex` is evaluated for scheduler profile calculation, **THEN** elapsed time is clamped to `0`, output is `0`, and a debug/test warning is emitted.
- **GIVEN** `elapsedSeconds = 85`, **WHEN** `difficultyProfile` is evaluated, **THEN** the output is `L5`.
- **GIVEN** `elapsedSeconds = 100`, **WHEN** `displayLevel` is evaluated, **THEN** the output is `6`.
- **GIVEN** `elapsedSeconds = 80`, **WHEN** `latePressureTier` is evaluated, **THEN** the output is `2`.
- **GIVEN** `foodType = pot` and `profile = L1`, **WHEN** `profileWeight` is evaluated, **THEN** the output is `0`.
- **GIVEN** `foodType = pot` and `profile = L5`, **WHEN** `profileWeight` is evaluated, **THEN** the output is `3`.
- **GIVEN** `fish.unlockAtSeconds = 40` and `elapsedSeconds = 25`, **WHEN** `eligibleWeight(fish, L2, 25)` is evaluated, **THEN** the output is `0`.
- **GIVEN** valid MVP tables, **WHEN** `activeTypeCount` is evaluated at `0s`, `20s`, and `40s`, **THEN** the outputs are `5`, `6`, and `7` respectively.
- **GIVEN** recent history is `pot,pot,pot`, **WHEN** `fairnessAllowed(fish, recentHistory)` is evaluated, **THEN** the output is `false` because `pot` and `fish` share the large-pressure cap.
- **GIVEN** `fairnessAllowed(food.type, recentHistory)` is `false`, **WHEN** `effectiveWeight` is evaluated for that food, **THEN** the output is `0`.
- **GIVEN** the `L1` pool has weights `tea=2`, `leftover=2`, `egg=1`, `pizza=1`, and `gift=1`, **WHEN** `spawnChance(tea)` is evaluated with no fairness filtering, **THEN** the output is `2/7`.
- **GIVEN** `totalWeight = 7` and deterministic `random01 = 0.20`, **WHEN** `weightedRoll` is evaluated, **THEN** the output is `1`.
- **GIVEN** the `L1` cumulative ranges are `tea:0..2`, `leftover:2..4`, `egg:4..5`, `pizza:5..6`, and `gift:6..7`, **WHEN** `weightedRoll = 1`, **THEN** `selectedFoodType` is `tea`.
- **GIVEN** `profile = L4`, **WHEN** `conveyorDuration` is evaluated, **THEN** the output is `3.47s`.
- **GIVEN** `elapsedSeconds = 45`, selected type `fish`, and request index `12`, **WHEN** `spawnDecision` is emitted, **THEN** it includes `{foodType: fish, profile: L3, displayLevel: 3, latePressureTier: 0, conveyorDuration: 4.08s, requestIndex: 12}`.

### Edge Cases and Integration

- **GIVEN** `elapsedSeconds` is `NaN`, infinite, or otherwise non-numeric, **WHEN** a spawn request is evaluated, **THEN** the scheduler enters `SchedulerError` and emits no valid spawn.
- **GIVEN** every food has `eligibleWeight == 0` after unlock and profile gates, **WHEN** a spawn request is evaluated, **THEN** the scheduler enters `SchedulerError` and emits no valid spawn.
- **GIVEN** the difficulty table references a food type missing from Food Config, **WHEN** table validation runs, **THEN** validation fails in development/test builds and player builds never spawn that unknown type.
- **GIVEN** the same spawn request is retried before the prior decision is consumed, **WHEN** Session Runtime asks again with the same pending request, **THEN** the scheduler returns the same pending `spawnDecision` and does not increment `requestIndex` or append history twice.
- **GIVEN** a duplicate spawn request arrives after the prior decision was consumed but before Game State Machine returns to `Spawning`, **WHEN** the scheduler receives the request, **THEN** it rejects the duplicate as an invalid runtime call.
- **GIVEN** the seed changes mid-run without restart or Daily Challenge setup, **WHEN** the scheduler receives the new seed, **THEN** it rejects the change and continues using the original run seed.
- **GIVEN** `requestIndex` is reset without restart, **WHEN** the scheduler detects the reset, **THEN** it rejects the reset and preserves deterministic replay integrity.
- **GIVEN** deterministic PRNG output is outside `[0,1)`, **WHEN** weighted selection starts, **THEN** development/test builds fail that selection and no gameplay spawn is emitted.
- **GIVEN** cumulative weight ranges contain a gap or overlap, **WHEN** selection is validated, **THEN** development/test builds fail the selection because ranges must cover exactly `0..totalWeight`.
- **GIVEN** a profile duration is missing, non-numeric, `<=0`, or outside the MVP safe table, **WHEN** `conveyorDuration` is evaluated, **THEN** the scheduler enters `SchedulerError` and Game State Machine receives no invalid timer duration.
- **GIVEN** Game State Machine is in `ResolvingClears`, `AwaitingNext`, or `GameOver`, **WHEN** timer UI updates, **THEN** the UI does not continue draining based on scheduler duration.
- **GIVEN** Pressure / Pending System consumes scheduler context, **WHEN** a spawn decision is emitted, **THEN** it may read `profile`, `displayLevel`, and `latePressureTier`, but the scheduler does not calculate miss pressure, no-space pressure, pressure decay, or failure thresholds.
- **GIVEN** Smoke Test Harness supplies a fixed seed and scripted elapsed-time request sequence, **WHEN** the harness runs the scheduler, **THEN** it can verify exact profile selection, food selection, duration, anti-streak filtering, fallback warnings, and debug metadata.
- **GIVEN** 10,000 scheduler requests are evaluated with the 7-food MVP table in a local JS benchmark, **WHEN** no debug overlay rendering is included, **THEN** the scheduler completes without DOM/canvas access and with no board-state allocation or mutation.

### UI and Debug Visibility

- **GIVEN** player-facing UI consumes scheduler output, **WHEN** the game is played normally, **THEN** it may show friendly level, timer, active type count, or first-appearance cues, but it hides seed values, PRNG rolls, cumulative ranges, raw weights, anti-streak decisions, fallback reasons, and internal profile ids.
- **GIVEN** `pot` first becomes eligible at `20s` or `fish` first becomes eligible at `40s`, **WHEN** the HUD or Feedback Layer chooses to show a first-appearance cue, **THEN** the cue is non-modal, lasts under `1s`, and does not pause or cover the board.
- **GIVEN** reduced-motion settings are enabled, **WHEN** level-change or first-appearance feedback is shown, **THEN** the feedback can be represented through static text/icon treatment without relying on motion.
- **GIVEN** result UI records scheduler metadata, **WHEN** a run ends from overflow or pressure, **THEN** final `displayLevel`, elapsed time, and late-pressure context may be stored, but player-facing loss copy does not blame "bad RNG".
- **GIVEN** a debug/test build encounters fallback selection or scheduler validation failure, **WHEN** diagnostic UI/logs are visible, **THEN** they include seed, request index, profile, recent history, candidate pool, filtered weights, fallback reason, and table version/hash if available.

## Open Questions

| Question | Owner | Target Resolution | Current Assumption |
|----------|-------|-------------------|--------------------|
| Which deterministic PRNG implementation and seed serialization format will production use? | Technical Director + QA Lead | Before Smoke Test Harness implementation | Any stable implementation is acceptable if fixed seed + request index produces replayable golden outputs. |
| Should the MVP expose scheduler diagnostics through an in-game debug overlay, console logs, or smoke-test-only snapshots? | QA Lead + Tools Programmer | Before first automated RNG test pass | Debug/test builds must expose the data; player builds must hide it. The exact surface can be chosen during tooling. |
| How exactly does `latePressureTier` map to miss pressure, no-space pressure, pressure decay, and pressure cap? | Pressure / Pending System owner | During Pressure / Pending System GDD | Scheduler only emits `latePressureTier`; all pressure math remains downstream. |
| Does Session Runtime count pause/page-hidden time as elapsed run time? | Session Runtime owner + Producer | During Session Runtime GDD | Scheduler accepts adjusted elapsed time from Session Runtime and does not run its own clock. |
| Should `displayLevel` and `activeTypeCount` be shown to players, or remain debug/tuning-only? | UX Designer + Gameplay HUD / Result UI owner | During Gameplay HUD / Result UI UX spec | Player HUD may show simplified difficulty cues only if they do not crowd the board or current food preview. |
| Should first appearances of `pot` and `fish` get a HUD label, animation-only cue, or no special player-facing callout? | UX Designer + Feedback Layer owner | During Feedback Layer / HUD design | A brief non-modal cue is allowed, but it must stay under `1s` and never pause play. |
| Should scheduler tuning tables live in code constants, JSON/data files, or a future balance sheet export? | Technical Director + Systems Designer | Before architecture/control manifest | The GDD owns the values; implementation may choose storage as long as tests can version/hash the table. |
| What exact golden seed sequence should QA use for smoke tests? | QA Lead | Before Smoke Test Harness GDD acceptance criteria are finalized | At least one opening, unlock-boundary, late-game, fairness-cap, and fallback-warning sequence should be covered. |
| Are `sameTypeCap = 3` and `largeFoodCap = 3` still correct after the first longer mobile playtest? | Systems Designer + Producer | After first 10-minute focused difficulty playtest | Keep both caps at `3` unless players report visible repetition or over-sanitized large-food pressure. |
| Should Daily Challenge override only the seed, or also override the profile/weight table? | Daily Challenge owner | Full Vision Daily Challenge GDD | MVP free play does not support daily overrides; future Daily Challenge must define its contract explicitly. |
| What player-facing failure copy should appear if a fatal scheduler validation error occurs in a release build? | Gameplay HUD / Result UI owner + QA Lead | Before release hardening | Player builds should route to a generic restart-safe failure flow; debug/test builds should fail loudly. |
| What is the exact performance budget for bulk scheduler simulation in CI? | Lead Programmer + QA Lead | Before Smoke Test Harness implementation | The scheduler should remain pure logic, avoid DOM/canvas access, and handle 10,000 requests in a lightweight JS benchmark. |
