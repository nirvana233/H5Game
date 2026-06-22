# Game State Machine

> **Status**: Approved
> **Author**: Fox + Codex agents
> **Last Updated**: 2026-06-21
> **Implements Pillar**: 短局高复玩; 消除必须救命; 一眼看懂冰箱要爆

## Overview

Game State Machine 是《冰箱爆仓了》的局内状态与事件优先级契约，负责定义 `Spawning`、`Ready`、`Dragging`、`ResolvingClears`、`AwaitingNext`、`GameOver` 等状态，以及输入、倒计时、清除解析、压力失败和重开之间的合法切换。它不拥有棋盘占格、食物配置、随机抽取、分数或压力公式，而是规定这些系统在什么时候可以读写，防止“拖拽中超时”“清除动画中压力更新”“Game Over 后继续输入”等边界产生歧义。

## Player Fantasy

Game State Machine 的玩家幻想是“游戏永远按玩家能理解的顺序结算”。玩家不会直接看见状态机，但会感受到每一次极限救回都公平：手指刚松开的有效放置一定先成立，三消救出的空间一定立刻生效，失败也一定来自清楚可读的压力或待处理区爆满。这个系统服务的是短局高压下的信任感，让玩家相信“刚才活下来是我操作及时”，而不是系统结算顺序碰巧帮忙或坑了我。

## Detailed Design

### Core Rules

1. Game State Machine owns the authoritative in-run state label. At any moment, the run is in exactly one of these states: `Spawning`, `Ready`, `Dragging`, `ResolvingClears`, `AwaitingNext`, or `GameOver`.
2. Game State Machine owns event priority and state transition legality. It does not own board occupancy, food data, RNG, score values, pressure math, or clear detection.
3. Session Runtime may execute the frame loop, but every input, timer, pressure, board mutation, and game-over check must be gated by the current state.
4. Input is legal only in states that explicitly allow it:
   - `Ready`: the player may start dragging the current food.
   - `Dragging`: only the active pointer may move, release, or cancel the current drag.
   - `GameOver`: only restart/share/result actions are accepted.
   - all other states lock gameplay input.
5. The conveyor countdown and no-space pressure run only while the current food is live in `Ready` or `Dragging`.
6. The conveyor countdown and pressure updates are paused during `Spawning`, `ResolvingClears`, and `AwaitingNext`.
7. `GameOver` stops conveyor countdown, pressure updates, spawn requests, clear resolution, and gameplay input immediately.
8. A valid placement is resolved in this order:
   - active drag ends
   - Board Model atomically places the food footprint
   - Clear Resolver evaluates same-type connected components
   - eligible clear removals become logically effective before the next food can spawn
   - scoring and pressure effects are applied
   - the state advances toward `AwaitingNext` or `GameOver`
9. An invalid release does not place the current food. If the conveyor time remains above `0`, the food returns to `Ready` with its remaining time. If the conveyor time is already `<=0`, the timeout event is applied after the invalid return starts.
10. When conveyor time reaches `0` and no valid placement wins the current frame, the current food is discarded into the pending counter. Pending is a miss counter, not a recoverable queue.
11. Pending reaching `3` causes immediate `GameOver` after the current frame's higher-priority placement/clear events have resolved.
12. Pressure reaching `100` causes immediate `GameOver` after the current frame's higher-priority placement/clear/timeout events have resolved.
13. If pending full and pressure full are both true in the same frame, the recorded failure cause is `pending_full`.
14. Restart from `GameOver` resets board state, current food, active input, pending count, pressure, timers, score/streak state, and state machine state before entering `Spawning`.
15. State transitions must be deterministic for test playback: the same starting state and same ordered event list must produce the same next state and side effects.

Event priority within a single frame is:

1. Valid `pointerup` placement from the active drag.
2. Clear resolution plus score and pressure updates caused by that placement.
3. Conveyor timeout moving the unplaced current food into pending.
4. Failure checks from pending full or pressure full.

### States and Transitions

| State | Input Gate | Timer / Pressure | Entry Condition | Valid Exits |
|-------|------------|------------------|-----------------|-------------|
| `Spawning` | Locked | Paused | New run, restart, or `AwaitingNext` completion | `Ready` when the current food and UI are created |
| `Ready` | Can start drag | Running | Current food is live on the conveyor | `Dragging` on active pointer start; `AwaitingNext` on timeout; `GameOver` on failure |
| `Dragging` | Active pointer only | Running | Player starts dragging the current food from `Ready` | `ResolvingClears` on valid release; `Ready` on invalid release with time remaining; `AwaitingNext` on timeout; `GameOver` on failure |
| `ResolvingClears` | Locked | Paused | Valid placement has been accepted | `AwaitingNext` after placement/clear/score/pressure resolution; `GameOver` if post-resolution failure is true |
| `AwaitingNext` | Locked | Paused | Current food has been consumed by placement or timeout | `Spawning` after the short inter-food delay |
| `GameOver` | Restart/share only | Stopped | Pending reaches `3`, pressure reaches `100`, or a fatal runtime validation fails | `Spawning` only through restart |

Required transition details:

| From | Event | Guard | To | Required Side Effects |
|------|-------|-------|----|-----------------------|
| `Spawning` | Spawn complete | Current food definition is valid and unlocked | `Ready` | Initialize current food, conveyor timer, drag anchor, and HUD live state |
| `Ready` | Pointer down on current food | No active pointer exists | `Dragging` | Capture active pointer id; begin drag preview |
| `Ready` | Conveyor timer expires | No valid placement won this frame | `AwaitingNext` or `GameOver` | Increment pending; apply timeout pressure effect; discard current food |
| `Ready` | Pressure full | Pressure is `>=100` after higher-priority events | `GameOver` | Record failure cause `pressure_full` unless pending is also full |
| `Dragging` | Pointer move | Pointer id matches active pointer | `Dragging` | Update legal/illegal preview only; do not mutate board |
| `Dragging` | Valid pointer up | Drop footprint is legal according to Board Model | `ResolvingClears` | Place current food atomically; release active pointer; mark current food consumed |
| `Dragging` | Invalid pointer up | Conveyor timer remains `>0` | `Ready` | Return current food to conveyor; clear drag preview; keep remaining timer |
| `Dragging` | Invalid pointer up plus expired timer | Conveyor timer is `<=0` and no valid placement occurred | `AwaitingNext` or `GameOver` | Start invalid-return feedback, then apply timeout/pending result |
| `Dragging` | Pointer cancel / page hidden / orientation change | Active pointer is interrupted | `Ready` | Cancel drag, return item, do not increment pending |
| `Dragging` | Conveyor timer expires without valid release | No valid placement won this frame | `AwaitingNext` or `GameOver` | Increment pending; apply timeout pressure effect; discard current food and drag preview |
| `ResolvingClears` | Resolution complete | Pending and pressure are below failure thresholds | `AwaitingNext` | Ensure cleared cells are logically empty; publish score/pressure/streak results |
| `ResolvingClears` | Resolution complete with failure | Pending full or pressure full after updates | `GameOver` | Lock input immediately; record failure cause |
| `AwaitingNext` | Inter-food delay elapsed | No failure condition is active | `Spawning` | Request next spawn cycle |
| `GameOver` | Restart | Player confirms restart | `Spawning` | Reset all run-local systems before spawning a new current food |

### Interactions with Other Systems

| System | Direction | Interface Contract |
|--------|-----------|--------------------|
| Board Model | Game State Machine gates Board Model mutations | Board reset is allowed only on restart/new run; placement is allowed only on valid release; clear removals are allowed only during `ResolvingClears` |
| Food Config | Game State Machine consumes validated food definitions indirectly | Spawned current food must reference a Food Config `type`, `w`, and `h`; Game State Machine never mutates food definitions |
| RNG / Difficulty Scheduler | Game State Machine requests spawn timing inputs | `Spawning` requests the next food and conveyor duration; timer values come from Difficulty Scheduler, not from the state machine |
| Input Adapter | Input Adapter obeys Game State Machine gates | Input Adapter sends pointer start/move/up/cancel events; Game State Machine accepts or rejects them based on state and active pointer id |
| Clear Resolver | Game State Machine schedules clear resolution | Clear Resolver runs after a valid placement; while it resolves, gameplay input, conveyor countdown, and pressure ticking are locked |
| Pressure / Pending System | Game State Machine controls when pressure/pending can update | Pressure may tick in `Ready` and `Dragging`; timeout pending increments after placement/clear priority; failure checks happen after higher-priority events |
| Scoring / Streak System | Game State Machine controls scoring timing | Placement and clear score events are emitted during `ResolvingClears`; no score event may fire after `GameOver` |
| Gameplay HUD / Result UI | UI consumes public state and failure cause | HUD reflects `Ready`, `Dragging`, danger, pending, and locked states; result UI appears only after `GameOver` |
| Feedback Layer | Feedback Layer consumes transitions | Feedback may animate invalid returns, valid drops, clears, warnings, and game-over lock, but animations do not delay logical board clearing beyond the `ResolvingClears` contract |
| Session Runtime | Session Runtime executes the frame loop | Runtime feeds ordered events into the state machine and applies side effects through the owning systems |
| Smoke Test Harness | Tests consume deterministic transitions | Harness scripts state/event sequences and verifies resulting state, side effects, and failure causes |

## Formulas

These formulas define deterministic state-machine decisions. They do not define score values, pressure deltas, spawn weights, clear scoring, or conveyor duration curves; those belong to downstream gameplay systems.

### `eventPriority`

The `eventPriority` formula is defined as:

`eventPriority(event) = priorityMap[event.type]`

Where:

`priorityMap = { valid_placement: 1, clear_resolution: 2, timeout_to_pending: 3, failure_check: 4 }`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Event | `event` | object | one frame event | A state-machine event emitted during the current frame |
| Event type | `event.type` | enum | `valid_placement`, `clear_resolution`, `timeout_to_pending`, `failure_check` | Event category used for same-frame ordering |
| Priority map | `priorityMap` | map | keys listed above | Lower numeric value resolves earlier |

**Output Range:** Integer `1..4` under normal play. Unknown event types are invalid and must be rejected in development/test builds.
**Example:** If a valid placement and timeout occur in the same frame, `eventPriority(valid_placement)=1` and `eventPriority(timeout_to_pending)=3`, so the valid placement resolves first.

### `isInputAllowed`

The `isInputAllowed` formula is defined as:

`isInputAllowed(state, inputKind, pointerId, activePointerId) = (state == Ready AND inputKind == start_drag AND activePointerId == NONE) OR (state == Dragging AND inputKind in {drag_move, drag_release, drag_cancel} AND pointerId == activePointerId) OR (state == GameOver AND inputKind in {restart, share})`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Current state | `state` | enum | `Spawning`, `Ready`, `Dragging`, `ResolvingClears`, `AwaitingNext`, `GameOver` | Authoritative state-machine state |
| Input kind | `inputKind` | enum | `start_drag`, `drag_move`, `drag_release`, `drag_cancel`, `restart`, `share` | Input action requested by Input Adapter or UI |
| Pointer id | `pointerId` | pointer id or `NONE` | platform pointer id | Pointer associated with the input event |
| Active pointer id | `activePointerId` | pointer id or `NONE` | platform pointer id | Pointer captured when entering `Dragging` |

**Output Range:** Boolean.
**Example:** In `Dragging`, a second finger with a different `pointerId` returns `false`; the active pointer's `drag_release` returns `true`.

### `isTimerRunning`

The `isTimerRunning` formula is defined as:

`isTimerRunning(state, hasCurrentFood) = hasCurrentFood AND state in {Ready, Dragging}`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Current state | `state` | enum | `Spawning`, `Ready`, `Dragging`, `ResolvingClears`, `AwaitingNext`, `GameOver` | Authoritative state-machine state |
| Has current food | `hasCurrentFood` | bool | `true` or `false` | Whether a live current food exists on the conveyor or under drag |

**Output Range:** Boolean.
**Example:** `isTimerRunning(Dragging, true) = true`; `isTimerRunning(ResolvingClears, true) = false`.

### `isPressureTickAllowed`

The `isPressureTickAllowed` formula is defined as:

`isPressureTickAllowed(state, hasCurrentFood) = hasCurrentFood AND state in {Ready, Dragging}`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Current state | `state` | enum | `Spawning`, `Ready`, `Dragging`, `ResolvingClears`, `AwaitingNext`, `GameOver` | Authoritative state-machine state |
| Has current food | `hasCurrentFood` | bool | `true` or `false` | Whether the Pressure / Pending System can evaluate the live current food |

**Output Range:** Boolean.
**Example:** Pressure may tick while the player is dragging a food, but not while clear animation is resolving.

### `validPlacementWinsThisFrame`

The `validPlacementWinsThisFrame` formula is defined as:

`validPlacementWinsThisFrame(pointerUp, dropLegal, timerExpired) = pointerUp AND dropLegal`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Pointer released | `pointerUp` | bool | `true` or `false` | Whether the active pointer released this frame |
| Drop legal | `dropLegal` | bool | `true` or `false` | Result of Board Model footprint legality check |
| Timer expired | `timerExpired` | bool | `true` or `false` | Whether conveyor time is `<=0` in the same frame |

**Output Range:** Boolean. If the output is `true`, placement resolves before timeout even when `timerExpired == true`.
**Example:** `validPlacementWinsThisFrame(true, true, true) = true`, so the food is placed and does not enter pending.

### `failureCause`

The `failureCause` formula is defined as:

`failureCause(pendingCount, pressureValue) = pending_full if pendingCount >= 3 else pressure_full if pressureValue >= 100 else none`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Pending count | `pendingCount` | int | `0..3` in MVP | Number of missed foods in the pending counter |
| Pressure value | `pressureValue` | float | `0..100` in MVP | Current overflow pressure after all higher-priority events resolve |
| Pending limit | `3` | int | constant | Failure threshold owned by Pressure / Pending System and referenced by this state machine |
| Pressure limit | `100` | float | constant | Failure threshold owned by Pressure / Pending System and referenced by this state machine |

**Output Range:** `none`, `pending_full`, or `pressure_full`. If both thresholds are reached in the same frame, `pending_full` wins.
**Example:** `failureCause(3, 100) = pending_full`; `failureCause(2, 100) = pressure_full`.

### `shouldAdvanceToGameOver`

The `shouldAdvanceToGameOver` formula is defined as:

`shouldAdvanceToGameOver(state, failureCause) = state != GameOver AND failureCause != none`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Current state | `state` | enum | `Spawning`, `Ready`, `Dragging`, `ResolvingClears`, `AwaitingNext`, `GameOver` | Authoritative state-machine state |
| Failure cause | `failureCause` | enum | `none`, `pending_full`, `pressure_full` | Result from the `failureCause` formula |

**Output Range:** Boolean.
**Example:** After clear resolution, if pressure remains `100`, `shouldAdvanceToGameOver(ResolvingClears, pressure_full) = true`.

## Edge Cases

- **If a valid release and conveyor timeout occur in the same frame**: resolve the valid placement first, consume the current food through placement, and do not increment pending for that food. This preserves the intended just-in-time rescue moment.
- **If an invalid release and conveyor timeout occur in the same frame**: start invalid-return feedback, then apply timeout-to-pending because no valid placement consumed the food. The board must not mutate.
- **If the active pointer is cancelled while dragging**: cancel the drag, clear the preview, return the current food to `Ready`, and do not increment pending from the cancel event.
- **If the page becomes hidden while dragging**: cancel the drag, clear the preview, return the current food, suppress timeout-to-pending for that frame, and resume normal state evaluation only when the page is active again.
- **If orientation changes while dragging**: cancel the drag and return the food without placing or incrementing pending. Layout recalculation must happen before the player can start a new drag.
- **If the food ghost is dragged outside the viewport**: clamp the ghost visually inside the viewport for readability, but do not treat out-of-viewport position as a legal board coordinate.
- **If the player releases outside the grid**: treat the release as invalid. If time remains, return to `Ready`; if time is already `<=0`, apply timeout-to-pending after the invalid-return feedback starts.
- **If multiple touches occur during `Ready`**: the first accepted pointer becomes `activePointerId`; all other pointers are ignored until the active pointer releases or cancels.
- **If multiple touches occur during `Dragging`**: only events from `activePointerId` can move, release, or cancel the drag. Other pointer events must not update preview, placement, timer, pressure, or pending.
- **If a duplicate `pointerup` arrives after the active release has already been consumed**: ignore it. A single current food can be placed, returned, or timed out only once.
- **If a clear animation is still playing after logical clear resolution completes**: keep visual animation as feedback only; cleared cells are already logically empty before the next `Spawning` state.
- **If a clear or placement callback arrives after `GameOver`**: ignore the callback. `GameOver` is terminal for all gameplay-side effects until restart.
- **If pending reaches `3` and pressure reaches `100` in the same frame**: enter `GameOver` with failure cause `pending_full`.
- **If pressure reaches `100` during `Dragging` before the player releases**: defer the failure check until higher-priority valid placement and clear events for that frame have resolved. If no valid placement wins, enter `GameOver`.
- **If pressure reaches `100` during `ResolvingClears` but clear resolution would reduce it below `100`**: apply the clear result before failure check. Only enter `GameOver` if pressure remains `>=100` after resolution.
- **If the current food has no legal placement because of its own footprint**: allow Pressure / Pending System to treat this as no-space pressure even if smaller foods would fit; the state machine does not substitute a different food.
- **If `Spawning` receives an invalid food definition**: reject the spawn in development/test builds and enter `GameOver` with a fatal runtime validation cause in playable builds. Do not enter `Ready` with invalid food.
- **If an illegal state transition is requested**: reject the transition and keep the previous state. In development/test builds, surface the invalid transition as a test failure.
- **If an unknown event type is submitted**: reject the event and do not mutate board, timer, pressure, pending, score, or current food.
- **If restart is requested while not in `GameOver`**: ignore it for MVP. Mid-run restart confirmation is a future UI flow, not part of this state machine contract.
- **If restart is requested in `GameOver` while result animations are still playing**: restart wins; clear result UI state and reset all run-local systems before entering `Spawning`.

## Dependencies

### Dependency Position

In the systems index, Game State Machine is a Foundation-layer MVP system with no formal upstream dependency. It is designed early because other runtime systems need a shared state and event-priority contract before implementation.

This does not mean it runs alone. During gameplay, Game State Machine coordinates with multiple systems through narrow contracts and must not duplicate their ownership.

### Hard Runtime Dependencies

| System | Dependency Type | Contract | Status |
|--------|-----------------|----------|--------|
| Session Runtime | Execution owner | Feeds ordered frame events into Game State Machine, applies accepted side effects through owning systems, and owns the main run loop | Approved |
| Board Model | Mutation target gated by state | Provides footprint legality, placement, reset, and whole-instance removal; Game State Machine decides when those calls are legal | Approved |
| Food Config | Spawn validation input | Provides validated `type`, `w`, `h`, and unlock identity for the current food; invalid definitions must not enter `Ready` | Approved |
| Input Adapter | Input event source | Sends pointer start/move/up/cancel with pointer ids; Game State Machine accepts only legal input for current state | Approved |
| RNG / Difficulty Scheduler | Spawn and timer provider | Provides next food selection and conveyor duration; Game State Machine only consumes duration/current food, not spawn weights | Approved |
| Clear Resolver | Post-placement resolver | Runs only after valid placement; reports whether clears happened and when logical clear resolution is complete | Approved |
| Pressure / Pending System | Failure and pressure owner | Owns pressure values, pending count, pressure deltas, no-space evaluation, and failure thresholds; Game State Machine gates when updates and failure checks occur | Approved |

### Soft / Downstream Dependencies

| System | Relationship | Contract | Status |
|--------|--------------|----------|--------|
| Scoring / Result Rules | Downstream side-effect consumer | Receives placement/clear timing from `ResolvingClears`; must not emit score changes after `GameOver` | Approved |
| Gameplay HUD / Result UI | Downstream display consumer | Reads state, input lock, pending/pressure danger, and failure cause to present live HUD and result card | Approved |
| Feedback Layer | Downstream transition consumer | Animates valid drops, invalid returns, clear resolution, pressure warnings, and game-over lock without changing logical order | Approved |
| Smoke Test Harness | Verification consumer | Scripts state/event sequences and verifies deterministic transitions, side effects, and failure causes | Approved |
| Audio / Haptics | Future polish consumer | May trigger cues from state transitions, warning thresholds, and game-over cause after Feedback Layer defines event names | Not Started |

### Provisional Assumptions

- Session Runtime will be the only system that sequences live Board Model mutations during a run.
- Input Adapter will expose stable pointer ids and will not mutate board, timer, pressure, or pending directly.
- RNG / Difficulty Scheduler will own conveyor duration values, including the already prototyped `5.00s` start and `2.70s` minimum.
- Clear Resolver will make cleared cells logically empty before Game State Machine allows the next `Spawning` cycle.
- Pressure / Pending System will keep `pendingCount` in `0..3`, pressure in `0..100`, and failure causes compatible with `pending_full` and `pressure_full`.
- Feedback Layer animations are visual only unless a future GDD explicitly promotes an animation event into a gameplay gate.

### Cross-System Consistency Notes

- Board Model remains pure logic. Game State Machine may gate when Board Model is called, but it must not own occupancy data or footprint math.
- Food Config remains read-only during runtime. Game State Machine may reject invalid current food, but it must not repair, rotate, or mutate food definitions.
- Difficulty should not be tuned through Game State Machine timing gates. Spawn pools, food weights, timer curves, and pressure deltas belong to RNG / Difficulty Scheduler and Pressure / Pending System.
- Failure ordering is shared between this GDD and Pressure / Pending: if pending and pressure fail in the same frame, `pending_full` is the recorded result.

## Tuning Knobs

Game State Machine tuning is limited to state lock windows, transition delays, and debug visibility. It must not tune difficulty pacing, spawn weights, pressure deltas, clear scoring, or result scoring.

### Owned Knobs

| Knob | Default / MVP Target | Safe Range | Too Low | Too High |
|------|----------------------|------------|---------|----------|
| `spawningLockMaxMs` | `<=100ms` | `0..100ms` | Spawn/UI setup may race with input if the state enters `Ready` before current food is fully available | The game feels unresponsive between foods |
| `clearResolutionLockMs` | `420ms` prototype target | `300..500ms` | Clears feel abrupt and may be hard to read | Rescue moment feels sluggish and pressure disappears for too long |
| `awaitingNextDelayMs` | `80ms` provisional target | `0..180ms` | Next food appears instantly, reducing readability after placement/timeout | Loop feels padded and less arcade-like |
| `invalidReturnLockMs` | `120ms` provisional target | `0..220ms` | Invalid releases may feel visually skipped | Player may feel punished by a long non-interactive return |
| `gameOverInputLockMs` | `300ms` provisional target | `0..600ms` | Accidental taps can immediately restart/share before the result is readable | Result screen feels delayed after failure |
| `debugStateVisible` | `false` in player builds | `true/false` | QA loses quick state visibility if disabled in test builds | Player-facing builds look unfinished if enabled |
| `strictInvalidTransitionMode` | `true` in tests, `false` in player builds | `true/false` | Invalid transitions may be harder to catch in automated tests | Player builds may hard-fail instead of recovering gracefully |

### Referenced But Not Owned

| Value | Owning System | State Machine Usage |
|-------|---------------|---------------------|
| Conveyor duration curve, including `5.00s` start and `2.70s` minimum | RNG / Difficulty Scheduler | Consumes the current duration and gates whether the timer runs |
| Pending limit `3` | Pressure / Pending System | Reads the failure condition and records `pending_full` priority |
| Pressure range `0..100` and failure threshold `100` | Pressure / Pending System | Reads the failure condition and records `pressure_full` when pending is not full |
| Pressure increase/decrease deltas | Pressure / Pending System | Allows or pauses pressure ticking by state |
| Clear score, placement score, combo/streak values | Scoring / Result Rules | Emits legal timing windows for scoring events |
| Clear component detection | Clear Resolver | Allows resolver to run only after valid placement |

### Locked Rules

- Event priority is not a tuning knob. Valid placement must resolve before clear effects, timeout, and failure checks.
- Failure cause priority is not a tuning knob. `pending_full` wins over `pressure_full` when both occur in the same frame.
- `GameOver` input lock is a state rule, not a balance value. Gameplay input must remain locked until restart.
- Board mutation timing is not a presentation tuning knob. Board placement/removal must be logically complete before the next `Spawning` cycle.

## Visual/Audio Requirements

Game State Machine does not own final visuals, animation assets, sound files, or haptic implementation. It must expose clear state and transition events so Feedback Layer, Gameplay HUD / Result UI, and Audio / Haptics can present the correct feedback without changing gameplay order.

### Required Feedback Events

| State / Transition Event | Visual Requirement | Audio / Haptic Direction | Owner |
|--------------------------|--------------------|--------------------------|-------|
| `Spawning -> Ready` | Current food appears on the conveyor in a stable readable position before drag is accepted | Optional light arrival cue | Feedback Layer / Audio |
| `Ready -> Dragging` | Current food lifts above board/HUD layers; legal preview can begin | Optional soft grab cue or light haptic | Input Adapter / Feedback Layer |
| `Dragging` legal preview | Target cells show clearly valid placement state | No required audio; avoid noisy continuous sound | Input Adapter / Feedback Layer |
| `Dragging` illegal preview | Target cells show clearly invalid state without hiding board occupancy | Optional low invalid hover pulse only if not spammy | Input Adapter / Feedback Layer |
| `Dragging -> ResolvingClears` valid release | Food snaps/lands into board; input locks immediately after release | Satisfying placement thud; light haptic | Feedback Layer / Audio |
| Invalid release return | Food returns to conveyor/current slot and preview clears | Short rejected placement cue; no heavy fail sound | Feedback Layer / Audio |
| `ResolvingClears` with clears | Cleared cells/items flash or pop for `300..500ms`, while logical cells are already empty | Clear chime or pop scaled by clear count; optional haptic tick | Clear Resolver / Feedback Layer / Audio |
| `ResolvingClears` with no clears | Placement feedback completes without clear flash | Placement-only cue; no clear cue | Feedback Layer / Audio |
| `AwaitingNext` | Gameplay input remains visibly locked only if delay is noticeable; avoid confusing idle state | No required cue | Session Runtime / Feedback Layer |
| Pressure danger while in `Ready` / `Dragging` | HUD/fridge pressure warning remains visible while state still allows play | Optional rising tension loop belongs to Audio / Haptics | Pressure / Pending System / HUD |
| Pending warning while in `Ready` / `Dragging` | Pending indicators clearly show `2/3` warning before failure | Optional warning tick | Pressure / Pending System / HUD / Audio |
| `Any -> GameOver` | Gameplay area locks, result card appears, and failure cause is readable | Failure sting matched to cause; optional medium haptic | Gameplay HUD / Result UI / Audio |
| `GameOver -> Spawning` restart | Result UI clears before new current food accepts input | Optional restart whoosh/click | Gameplay HUD / Result UI / Feedback Layer |

### Readability Rules

- Visual feedback must never imply a different event order than the state machine. For example, clear animation may continue visually, but the board is logically clear before the next `Spawning` state.
- Invalid release feedback must not look like a timeout failure unless the food actually enters pending.
- `GameOver` feedback must lock gameplay input immediately, even if the result card animates in after a short presentation delay.
- Legal and illegal drag previews must remain distinguishable on mobile and must not depend on color alone.
- Audio and haptics must be event-driven, not frame-driven. Continuous pointer movement should not emit repeated sound unless a future Audio / Haptics GDD explicitly approves it.
- Debug builds may display the raw state name (`Ready`, `Dragging`, etc.); player builds should communicate state through normal HUD and feedback, not raw enum labels.

## UI Requirements

Game State Machine has no standalone player-facing screen. It supplies state, lock, and failure-cause information that Gameplay HUD / Result UI, Feedback Layer, and debug tooling must consume consistently.

### UI State Outputs

| UI Output | Source State / Formula | Consumer | Player-Facing Requirement |
|-----------|------------------------|----------|---------------------------|
| `canStartDrag` | `state == Ready` and no active pointer | Current food / conveyor UI | Current food looks draggable only when the player can actually start dragging |
| `isDragging` | `state == Dragging` | Drag preview / food ghost | Current food appears lifted/active and follows the active pointer only |
| `gameplayInputLocked` | `state in {Spawning, ResolvingClears, AwaitingNext, GameOver}` | Board, conveyor, current food | Gameplay controls visually stop accepting actions when locked |
| `timerVisibleRunning` | `isTimerRunning(state, hasCurrentFood)` | Timer bar | Timer appears active only in `Ready` and `Dragging`; it must pause/freeze during clear resolution and inter-food waits |
| `pressureTickVisible` | `isPressureTickAllowed(state, hasCurrentFood)` | Pressure HUD | Pressure warnings may remain visible while locked, but pressure should not visually tick during paused states |
| `currentFailureCause` | `failureCause(...)` | Result card | Result UI displays a readable reason for failure without exposing raw enum names |
| `restartEnabled` | `state == GameOver` | Result card buttons | Restart/share actions are enabled only after `GameOver` |
| `debugStateLabel` | raw `state` | Debug overlay / QA | Raw enum labels may be shown in debug builds only |

### Result Cause Copy Requirements

| Failure Cause | Player-Facing Meaning | Copy Guidance |
|---------------|----------------------|---------------|
| `pending_full` | Too many foods were missed from the conveyor | Explain that the pending area filled up; avoid implying the board alone caused failure |
| `pressure_full` | The fridge overflow pressure reached the limit | Explain that the fridge pressure exploded / door could not close |
| fatal runtime validation | An invalid runtime condition occurred | Do not show technical details in player builds; show generic restart-safe failure copy |

### UI Constraints

- Player-facing UI must not display raw enum names such as `ResolvingClears` or `pending_full`; those are for debug/telemetry only.
- The timer bar must not continue draining visually during `ResolvingClears`, `AwaitingNext`, or `GameOver`.
- The pressure bar may remain visible during locked states, but it must not animate as if pressure is actively ticking while the state machine has paused pressure updates.
- Drag affordance must be removed immediately after a valid release, timeout discard, cancel, or `GameOver`.
- Result UI must appear only after `GameOver`; warning states such as pressure danger or pending `2/3` must not use result-card presentation.
- Restart/share buttons must not accept input before `GameOver`.
- Debug overlays may show current state, active pointer id, event queue, and last failure cause, but they must be hidden in player builds by default.
- UI systems may listen to state transitions, but they must not initiate board, pressure, pending, score, or spawn side effects directly.

## Acceptance Criteria

- **GIVEN** a new run starts, **WHEN** Game State Machine initializes, **THEN** the first gameplay state is `Spawning` and gameplay input, timer, and pressure ticking are locked until spawn completion.
- **GIVEN** `Spawning` is active, **WHEN** a valid current food and UI are created, **THEN** the state transitions to `Ready` and `canStartDrag` becomes true.
- **GIVEN** any runtime moment, **WHEN** the state is inspected, **THEN** exactly one of `Spawning`, `Ready`, `Dragging`, `ResolvingClears`, `AwaitingNext`, or `GameOver` is active.
- **GIVEN** the state is `Ready`, **WHEN** the player starts dragging the current food with no active pointer, **THEN** the state transitions to `Dragging` and captures that pointer as `activePointerId`.
- **GIVEN** the state is `Ready`, **WHEN** a non-drag gameplay input is submitted, **THEN** the input is rejected and no board, timer, pressure, pending, or score mutation occurs.
- **GIVEN** the state is `Dragging`, **WHEN** the active pointer moves, **THEN** preview updates are allowed and Board Model occupancy is not mutated.
- **GIVEN** the state is `Dragging`, **WHEN** a non-active pointer moves, releases, or cancels, **THEN** that event is ignored and the active drag remains controlled by `activePointerId`.
- **GIVEN** the state is `Dragging`, **WHEN** the active pointer releases over a legal Board Model footprint, **THEN** valid placement resolves before timeout or failure checks in that frame.
- **GIVEN** a valid placement is accepted, **WHEN** the state transitions into `ResolvingClears`, **THEN** gameplay input, conveyor countdown, and pressure ticking are paused until resolution completes.
- **GIVEN** a valid placement triggers clear resolution, **WHEN** Clear Resolver removes matching components, **THEN** cells are logically empty before Game State Machine allows the next `Spawning` cycle.
- **GIVEN** a valid placement does not trigger any clear, **WHEN** placement resolution completes, **THEN** state transitions to `AwaitingNext` without emitting a clear feedback event.
- **GIVEN** the state is `Dragging`, **WHEN** the active pointer releases over an illegal location while timer remains above `0`, **THEN** the current food returns to `Ready`, pending does not increment, and Board Model is unchanged.
- **GIVEN** the state is `Dragging`, **WHEN** the active pointer releases illegally while timer is already `<=0`, **THEN** invalid-return feedback starts, then timeout-to-pending resolves without placing the food.
- **GIVEN** the state is `Ready` or `Dragging`, **WHEN** conveyor time reaches `0` and no valid placement wins the frame, **THEN** the current food is discarded, pending increments once, and the state advances to `AwaitingNext` or `GameOver`.
- **GIVEN** the active pointer is cancelled, the page is hidden, or orientation changes during `Dragging`, **WHEN** the cancellation is processed, **THEN** the food returns without placement and without pending increment for that cancel event.
- **GIVEN** the state is `GameOver`, **WHEN** gameplay pointer or drag input is submitted, **THEN** the input is rejected and no gameplay-side effects occur.
- **GIVEN** the state is `GameOver`, **WHEN** restart is accepted, **THEN** board state, current food, active pointer, timer, pending, pressure, score/streak state, result UI state, and state machine state are reset before entering `Spawning`.
- **GIVEN** `eventPriority(valid_placement)` and `eventPriority(timeout_to_pending)` are evaluated, **WHEN** both events exist in the same frame, **THEN** valid placement priority is lower numeric value and resolves first.
- **GIVEN** an unknown event type is submitted, **WHEN** `eventPriority` is evaluated, **THEN** the event is rejected in development/test builds and does not mutate gameplay state.
- **GIVEN** `isInputAllowed(Ready, start_drag, pointerId, NONE)`, **WHEN** it is evaluated, **THEN** the result is `true`.
- **GIVEN** `isInputAllowed(Dragging, drag_release, secondPointerId, activePointerId)` where ids differ, **WHEN** it is evaluated, **THEN** the result is `false`.
- **GIVEN** `isInputAllowed(GameOver, restart, NONE, NONE)`, **WHEN** it is evaluated, **THEN** the result is `true`.
- **GIVEN** `isTimerRunning(Ready, true)` or `isTimerRunning(Dragging, true)`, **WHEN** it is evaluated, **THEN** the result is `true`.
- **GIVEN** `isTimerRunning(ResolvingClears, true)`, `isTimerRunning(AwaitingNext, true)`, or `isTimerRunning(GameOver, true)`, **WHEN** it is evaluated, **THEN** the result is `false`.
- **GIVEN** `isPressureTickAllowed(Ready, true)` or `isPressureTickAllowed(Dragging, true)`, **WHEN** it is evaluated, **THEN** the result is `true`.
- **GIVEN** `isPressureTickAllowed(ResolvingClears, true)` or `isPressureTickAllowed(GameOver, true)`, **WHEN** it is evaluated, **THEN** the result is `false`.
- **GIVEN** `validPlacementWinsThisFrame(true, true, true)`, **WHEN** it is evaluated, **THEN** the result is `true` and the food does not enter pending.
- **GIVEN** `validPlacementWinsThisFrame(true, false, true)`, **WHEN** it is evaluated, **THEN** the result is `false` and timeout-to-pending may resolve after invalid-return feedback starts.
- **GIVEN** `failureCause(3, 100)`, **WHEN** it is evaluated, **THEN** the result is `pending_full`.
- **GIVEN** `failureCause(2, 100)`, **WHEN** it is evaluated, **THEN** the result is `pressure_full`.
- **GIVEN** `failureCause(2, 99.99)`, **WHEN** it is evaluated, **THEN** the result is `none`.
- **GIVEN** `shouldAdvanceToGameOver(ResolvingClears, pressure_full)`, **WHEN** it is evaluated, **THEN** the result is `true`.
- **GIVEN** `shouldAdvanceToGameOver(GameOver, pending_full)`, **WHEN** it is evaluated, **THEN** the result is `false` because the run is already in `GameOver`.
- **GIVEN** clear animation is still visible after logical clear resolution, **WHEN** the next spawn check occurs, **THEN** Game State Machine treats the cleared cells as empty and does not wait for the visual animation to finish.
- **GIVEN** pressure reaches `100` during `ResolvingClears`, **WHEN** the clear result reduces pressure below `100`, **THEN** Game State Machine does not enter `GameOver` from that transient pre-resolution value.
- **GIVEN** pending reaches `3` and pressure reaches `100` in the same frame, **WHEN** failure is recorded, **THEN** the failure cause is `pending_full`.
- **GIVEN** `gameplayInputLocked` is true, **WHEN** HUD or Input Adapter receives a drag attempt, **THEN** UI does not show an active draggable state and Input Adapter does not submit a board mutation request.
- **GIVEN** the state is `ResolvingClears`, `AwaitingNext`, or `GameOver`, **WHEN** the timer UI updates, **THEN** the timer display does not continue draining.
- **GIVEN** the result UI appears, **WHEN** it displays failure information, **THEN** it uses player-facing copy and does not expose raw enum names such as `pending_full` or `pressure_full`.
- **GIVEN** debug state display is disabled for player builds, **WHEN** the game is played normally, **THEN** raw state labels such as `ResolvingClears` are hidden from players.
- **GIVEN** a scripted Smoke Test Harness sequence starts from the same state and ordered event list twice, **WHEN** the sequence is replayed, **THEN** the resulting state, failure cause, and allowed side effects are identical both times.
- **GIVEN** UI or Feedback Layer listens to state transitions, **WHEN** it receives a state event, **THEN** it may animate or display feedback but must not mutate board, pressure, pending, score, or spawn state directly.

## Open Questions

| Question | Owner | Deadline | Resolution |
|----------|-------|----------|------------|
| Should `awaitingNextDelayMs`, `invalidReturnLockMs`, and `gameOverInputLockMs` stay at provisional targets after first production-feel prototype? | Gameplay Programmer + UX Designer | Before vertical slice tuning | Current values are provisional GDD targets; verify through mobile playtest and adjust in tuning data, not code constants. |
| Should page-hidden behavior pause the conveyor globally or only suppress timeout-to-pending for the cancel frame? | Technical Director | Before Session Runtime GDD implementation | Current state-machine rule cancels drag and suppresses timeout-to-pending for that frame; final lifecycle handling belongs to Session Runtime. |
| Should fatal runtime validation produce a generic GameOver screen or a developer-only error overlay? | Technical Director + QA Lead | Before Smoke Test Harness implementation | Player builds should show generic restart-safe failure; debug/test builds should fail loudly. |
| Should state transition events be emitted as a typed event stream or derived by observers from state snapshots? | Technical Director | Architecture / ADR phase | GDD only requires deterministic state outputs; implementation pattern should be decided in ADR. |
| Which UI copy should represent `pending_full` and `pressure_full` in the final result card? | UX Designer + Writer | Before Gameplay HUD / Result UI GDD completion | This GDD defines meaning only; player-facing copy belongs to HUD/Result UI. |
| How many smoke tests are required for same-frame priority ordering before MVP handoff? | QA Lead | Before Smoke Test Harness GDD completion | Acceptance criteria require deterministic coverage; exact test list belongs to Smoke Test Harness. |
| Should `debugStateVisible` be exposed through a URL flag, build flag, or debug overlay toggle? | Gameplay Programmer + QA Lead | Before implementation | GDD requires debug visibility in test builds and hidden player builds; access method is implementation detail. |
