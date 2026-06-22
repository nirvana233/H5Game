# Input Adapter

> **Status**: Approved
> **Author**: Fox + Codex agents
> **Last Updated**: 2026-06-21
> **Implements Pillar**: 一眼看懂冰箱要爆; 形状制造戏剧; 短局高复玩

## Overview

Input Adapter 是《冰箱爆仓了》的移动端优先输入翻译层，负责把浏览器 Pointer / Touch / Mouse 事件转换成游戏可理解的拖拽意图：开始拖拽、移动预览、释放放置、取消拖拽。它只处理当前食物的单指拖拽、坐标换算、触点偏移、网格落点推导、合法/非法预览请求和输入取消规则；它不直接改 Board Model、不决定状态切换、不处理倒计时、压力、分数或清除。它必须服从 Game State Machine 的输入门控，并通过 Board Model 查询 footprint 是否可放置，让玩家在手机上感觉“手指拖到哪里，食物就稳定、清楚、公平地对齐到那里”。

## Player Fantasy

Input Adapter 的玩家幻想是“我手指怎么摆，游戏就怎么理解我”。玩家不会意识到输入层存在，但会立刻感受到拖拽稳定、吸附清楚、合法/非法预览可信：食物不会在拾取瞬间跳开，不会因为手指遮挡而看不见落点，不会把明明放进格子的极限操作判成失败。它支撑的是一种手机端空间整理的手感信任：玩家在倒计时快归零时松手，如果位置合法，游戏必须承认这次救场；如果放不下，预览也要提前让玩家知道问题出在哪里。

这个系统直接服务三条体验目标。第一，`一眼看懂冰箱要爆`：输入反馈必须让玩家不用读教程也知道当前食物会占哪些格子。第二，`形状制造戏剧`：不同 footprint 的拖拽预览要让 `2x2` 汤锅、`3x1` 冻鱼这种大形状的压力清楚可见。第三，`短局高复玩`：从进入游戏到第一次有效拖拽必须足够快，失败后重开也不能被输入延迟、页面滚动、误触或多指事件打断节奏。

## Detailed Design

### Core Rules

1. Input Adapter owns browser input normalization for the current-food interaction: `pointerdown`, `pointermove`, `pointerup`, `pointercancel`, page visibility interruption, orientation change, and mouse fallback where Pointer Events are available.
2. Mobile Pointer Events are the primary path. Touch fallback is allowed only when Pointer Events are unavailable; fallback behavior must preserve the same single-active-pointer contract.
3. Input Adapter may only start gameplay drag while Game State Machine reports the current food is draggable: `state == Ready`, no active pointer exists, and current food UI is available.
4. Input Adapter sends input intent to Game State Machine; Game State Machine remains authoritative for whether `start_drag`, `drag_move`, `drag_release`, or `drag_cancel` is legal.
5. Input Adapter may track a local browser `activePointerId` for pointer capture and event filtering, but it must mirror Game State Machine's accepted active pointer. If Game State Machine rejects the start, the local pointer capture is released immediately.
6. Only one active pointer is supported in MVP. Non-active fingers, stylus events, or mouse buttons must not move the ghost, update preview, place food, increment pending, alter pressure, or change state.
7. On accepted pickup, Input Adapter records:
   - `activePointerId`
   - current food visual bounds
   - board grid bounds
   - food footprint `w,h`
   - pointer-to-food top-left offset
   - current visual scale / device pixel ratio if needed for coordinate conversion
8. The drag ghost preserves the pickup offset. The food must not jump so that its top-left snaps under the finger at drag start.
9. Drag movement updates a visual ghost position and a candidate board top-left coordinate. The candidate coordinate is derived from the ghost top-left, not from the finger center.
10. Candidate placement uses the nearest grid coordinate to the ghost top-left. The candidate may be negative or outside board bounds; Board Model handles that as an invalid placement query.
11. Input Adapter queries Board Model for `canPlace`, `footprintCells`, and optionally `footprintOccupancy` during drag preview and release validation. These queries must not mutate Board Model.
12. The preview must describe the full footprint of the current food, including multi-cell footprints. A `2x2` pot and `3x1` fish must visibly preview every occupied cell.
13. Input Adapter does not rotate food. It always uses the current food's original MVP footprint.
14. On active `pointermove`, Input Adapter emits a preview update containing candidate top-left coordinate, footprint cells, and legal/illegal state. It does not submit placement.
15. On active `pointerup`, Input Adapter performs one final candidate coordinate and legality evaluation, then submits one `drag_release` intent to Game State Machine with:
   - `pointerId`
   - candidate top-left coordinate
   - `dropLegal`
   - current food id/type
   - footprint `w,h`
16. If `dropLegal == true`, Input Adapter still does not mutate Board Model directly. Game State Machine / Session Runtime decide whether the release wins the frame and then request the actual placement.
17. If `dropLegal == false`, Input Adapter submits the invalid release intent and clears preview. Game State Machine decides whether the food returns to `Ready` or times out into pending.
18. On `pointercancel`, page hidden, browser blur, orientation change, or layout invalidation while dragging, Input Adapter submits `drag_cancel`, clears preview, releases pointer capture, and returns control to Game State Machine. This cancel path must not increment pending by itself.
19. If Game State Machine enters `Spawning`, `ResolvingClears`, `AwaitingNext`, or `GameOver`, Input Adapter clears active drag visuals and rejects gameplay drag events until input is unlocked again.
20. During active drag only, Input Adapter may suppress page scrolling and browser gesture defaults inside the play area. Outside active drag, it must not globally block page scroll, pull-to-refresh, or browser navigation gestures beyond what the game shell explicitly owns.
21. Drag movement should be visually updated through transform-style movement and frame-coalesced updates. Input Adapter should avoid full board/layout rebuilds during pointer move.
22. Input Adapter emits debug data for QA: raw pointer position, ghost top-left, board-relative coordinate, candidate grid coordinate, active pointer id, and last `dropLegal` result.
23. Input Adapter does not own final animations, haptics, audio, scoring, pressure, pending count, clear detection, board mutation, or result UI.

### States and Transitions

These are Input Adapter internal states, not Game State Machine states.

| State | Entry Condition | Exit Condition | Behavior |
|-------|-----------------|----------------|----------|
| `InputLocked` | Game State Machine is not accepting gameplay drag, or no current food is available | Game State Machine reports `Ready` with current food draggable | Ignore gameplay pointer events; ensure no active preview remains |
| `ReadyForPointer` | Current food is live, draggable, and no active pointer is captured | Accepted pointerdown on current food, or state becomes locked | Wait for a valid pickup gesture |
| `DraggingPreview` | Game State Machine accepts `start_drag` and pointer capture succeeds | Active release, cancel, or external lock | Track ghost, compute candidate cell, query Board Model, emit preview updates |
| `ReleaseSubmitted` | Active pointer releases and one `drag_release` intent is sent | Game State Machine resolves legal placement, invalid return, timeout, or lock | Freeze final release intent; prevent duplicate pointerup from placing twice |
| `CancellingDrag` | Active pointer is cancelled, page is hidden, orientation changes, or layout becomes invalid | `drag_cancel` is submitted and local capture is cleared | Clear preview and return food presentation to the current-food owner |
| `AdapterError` | Required input context is missing or inconsistent | Runtime resets input context | Emit no placement intent; debug/test builds fail loudly |

| From | Trigger | Guard | To | Required Side Effects |
|------|---------|-------|----|-----------------------|
| `InputLocked` | Game State Machine enters `Ready` | Current food visual and board grid rect exist | `ReadyForPointer` | Clear stale pointer id and stale preview |
| `ReadyForPointer` | `pointerdown` on current food | Game State Machine accepts `start_drag`; no active pointer exists | `DraggingPreview` | Capture pointer, record pickup offset, record board rect, begin ghost and preview |
| `ReadyForPointer` | `pointerdown` outside current food | None | `ReadyForPointer` | Ignore gameplay drag start |
| `ReadyForPointer` | Additional pointer event | Another pointer already pending or input not accepted | `ReadyForPointer` | Ignore non-active pointer |
| `DraggingPreview` | Active `pointermove` | Pointer id matches local active pointer and Game State Machine allows drag move | `DraggingPreview` | Update ghost position, candidate top-left, Board Model legality, and preview output |
| `DraggingPreview` | Non-active `pointermove` | Pointer id does not match active pointer | `DraggingPreview` | Ignore event completely |
| `DraggingPreview` | Active `pointerup` | Pointer id matches active pointer | `ReleaseSubmitted` | Compute final candidate, query final legality, send one `drag_release` intent, release pointer capture |
| `DraggingPreview` | Active `pointercancel` | Pointer id matches active pointer | `CancellingDrag` | Send `drag_cancel`, clear preview, release pointer capture |
| `DraggingPreview` | Page hidden / blur / orientation change | Drag is active | `CancellingDrag` | Send `drag_cancel`, clear preview, mark grid rect invalid |
| `ReleaseSubmitted` | Game State Machine accepts legal release | `dropLegal == true` and placement wins the frame | `InputLocked` | Keep input locked while state machine proceeds into placement / resolution |
| `ReleaseSubmitted` | Game State Machine rejects or resolves invalid release with time remaining | `dropLegal == false` and state returns to `Ready` | `ReadyForPointer` | Clear preview and allow the current food owner to animate return |
| `ReleaseSubmitted` | Game State Machine resolves timeout / game over | Timer or failure consumes current food | `InputLocked` | Clear preview and wait for next unlock/restart |
| `CancellingDrag` | Cancel is acknowledged | Game State Machine returns to `Ready` | `ReadyForPointer` | Clear pointer id, offset, and preview |
| Any non-error state | Game State Machine enters locked state | `Spawning`, `ResolvingClears`, `AwaitingNext`, or `GameOver` | `InputLocked` | Release pointer capture and clear active drag visuals |
| Any state | Required context missing | Missing current food, grid rect, pointer id, or footprint | `AdapterError` | Emit no release intent; surface debug/test error |

### Interactions with Other Systems

| System | Direction | Interface Contract |
|--------|-----------|--------------------|
| Game State Machine | Input Adapter obeys state gates | Reads or requests legality for `start_drag`, `drag_move`, `drag_release`, and `drag_cancel`. Game State Machine remains authoritative for active pointer acceptance, same-frame release priority, timeout handling, and state transitions. |
| Board Model | Input Adapter consumes read-only placement queries | Calls `canPlace`, `footprintCells`, and optionally `footprintOccupancy` using current food footprint and candidate top-left coordinate. Input Adapter must never call Board Model mutation APIs directly. |
| Session Runtime | Session Runtime supplies current interaction context | Provides current food instance/type, visual current-food availability, board layout measurements, and the path for applying accepted release side effects through Game State Machine. |
| Food Config | Indirect input through current food | Current food footprint `w,h` and type must come from validated food data. Input Adapter does not query or mutate the full Food Config table during drag. |
| Feedback Layer | Feedback Layer consumes preview and input events | Receives legal/illegal preview state, ghost position, invalid-release cue requests, and pickup/release events. Feedback must not change candidate legality. |
| Gameplay HUD / Result UI | UI consumes lock/drag affordance | Uses `canStartDrag`, `isDragging`, and input-locked state from Game State Machine / Input Adapter to show whether current food can be grabbed. |
| Pressure / Pending System | Explicit non-owner relationship | Input Adapter does not increment pending or pressure. It only submits invalid release or cancel intent; Game State Machine and Pressure / Pending System own consequences. |
| Clear Resolver | No direct runtime dependency | Input Adapter does not evaluate clears. Valid placement can later trigger Clear Resolver through Game State Machine / Session Runtime. |
| Smoke Test Harness | Verification consumer | Can replay pointer sequences, board rects, current food footprints, and expected candidate coordinates / legality outputs. |
| Onboarding / Accessibility | Future consumer | May request alternate input affordances, larger hit targets, or assistive drag modes. MVP keeps the single-pointer drag contract but should not block future accessibility design. |

## Formulas

These formulas define how browser input becomes a stable board candidate. They do not define Board Model occupancy, Game State Machine event priority, timer behavior, pressure, score, or clear resolution.

### `pointerClient`

The `pointerClient` formula is defined as:

`pointerClient(event) = (event.clientX, event.clientY)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Browser pointer event | `event` | PointerEvent / MouseEvent / normalized Touch | viewport coordinates | Raw browser input event after pointer/touch normalization |
| Client x | `event.clientX` | float px | viewport px | Horizontal pointer position in CSS pixels |
| Client y | `event.clientY` | float px | viewport px | Vertical pointer position in CSS pixels |

**Output Range:** A viewport-space point in CSS pixels. Values may be outside the visible play area during drag.
**Example:** A pointer at screen coordinate `clientX=180`, `clientY=690` outputs `(180,690)`.

### `pickupOffset`

The `pickupOffset` formula is defined as:

`pickupOffset = pointerClient(pointerdown) - foodRect.topLeft`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Pointer position | `pointerClient(pointerdown)` | point<float,float> | viewport px | Pointer position at accepted pickup |
| Food rect top-left | `foodRect.topLeft` | point<float,float> | viewport px | Current food visual top-left at pickup |
| Food rect | `foodRect` | DOM/client rect | positive width/height | Current food visual bounds |

**Output Range:** A point offset inside or near the food rect. Under normal pickup, `x` is `0..foodRect.width` and `y` is `0..foodRect.height`.
**Example:** If the player touches `(190,720)` and the food rect top-left is `(160,700)`, `pickupOffset = (30,20)`.

### `ghostTopLeft`

The `ghostTopLeft` formula is defined as:

`ghostTopLeft(pointerClient, pickupOffset) = pointerClient - pickupOffset`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Pointer position | `pointerClient` | point<float,float> | viewport px | Current active pointer position |
| Pickup offset | `pickupOffset` | point<float,float> | viewport px delta | Offset captured at pickup |

**Output Range:** A viewport-space top-left point for the drag ghost. It may be outside board bounds.
**Example:** If current pointer is `(250,520)` and `pickupOffset` is `(30,20)`, `ghostTopLeft = (220,500)`.

### `boardLocalTopLeft`

The `boardLocalTopLeft` formula is defined as:

`boardLocalTopLeft = ghostTopLeft - boardRect.topLeft`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Ghost top-left | `ghostTopLeft` | point<float,float> | viewport px | Current drag ghost top-left |
| Board rect top-left | `boardRect.topLeft` | point<float,float> | viewport px | Fridge grid visual top-left |
| Board rect | `boardRect` | DOM/client rect | positive width/height | Current measured board bounds |

**Output Range:** Board-local CSS pixel point. Values can be negative or larger than the board size.
**Example:** If `ghostTopLeft = (220,500)` and `boardRect.topLeft = (40,120)`, `boardLocalTopLeft = (180,380)`.

### `cellSize`

The `cellSize` formula is defined as:

`cellSize = (cellWidth: boardRect.width / 6, cellHeight: boardRect.height / 8)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Board width | `boardRect.width` | float px | `>0` | Rendered fridge grid width |
| Board height | `boardRect.height` | float px | `>0` | Rendered fridge grid height |
| Board columns | `6` | int | fixed MVP | Board Model column count |
| Board rows | `8` | int | fixed MVP | Board Model row count |

**Output Range:** Positive CSS pixel dimensions for one grid cell.
**Example:** On a `300x400px` board, `cellSize = (50,50)`.

### `candidateTopLeftCell`

The `candidateTopLeftCell` formula is defined as:

`candidateTopLeftCell = (round(boardLocalTopLeft.x / cellWidth), round(boardLocalTopLeft.y / cellHeight))`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Board-local top-left | `boardLocalTopLeft` | point<float,float> | any CSS px | Ghost top-left relative to board |
| Cell width | `cellWidth` | float px | `>0` | Output of `cellSize` |
| Cell height | `cellHeight` | float px | `>0` | Output of `cellSize` |
| Round | `round` | function | nearest int, halves away from zero or implementation-stable equivalent | Converts continuous position to nearest grid coordinate |

**Output Range:** Integer `(x,y)` candidate coordinate. Values may be outside `x=0..5`, `y=0..7`; Board Model treats out-of-bounds placement as illegal.
**Example:** If `boardLocalTopLeft = (123,176)` and `cellSize = (50,50)`, `candidateTopLeftCell = (2,4)`.

### `candidateFootprintCells`

The `candidateFootprintCells` formula is defined as:

`candidateFootprintCells = BoardModel.footprintCells(candidateX, candidateY, food.w, food.h)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Candidate x | `candidateX` | int | any int | Candidate top-left column |
| Candidate y | `candidateY` | int | any int | Candidate top-left row |
| Food width | `food.w` | int | MVP footprint width | Current food footprint width |
| Food height | `food.h` | int | MVP footprint height | Current food footprint height |

**Output Range:** A set of `food.w * food.h` coordinates before legality filtering.
**Example:** A `2x2` pot at candidate `(4,6)` previews `{(4,6),(5,6),(4,7),(5,7)}`.

### `previewLegal`

The `previewLegal` formula is defined as:

`previewLegal = BoardModel.canPlace(food, candidateX, candidateY)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Food | `food` | object | current Food Config item | Provides `w`, `h`, and type identity |
| Candidate x | `candidateX` | int | any int | Candidate top-left column |
| Candidate y | `candidateY` | int | any int | Candidate top-left row |
| Board legality | `BoardModel.canPlace` | function | boolean output | Read-only Board Model placement query |

**Output Range:** Boolean. `true` means the preview target is legal on the current stable board snapshot; `false` means out of bounds or occupied.
**Example:** If a `3x1` fish candidate overlaps an occupied cell, `previewLegal = false`.

### `isActivePointerEvent`

The `isActivePointerEvent` formula is defined as:

`isActivePointerEvent(event, activePointerId) = event.pointerId == activePointerId`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Browser event pointer id | `event.pointerId` | int/string | browser pointer id | Pointer id on the incoming event |
| Active pointer id | `activePointerId` | int/string or `NONE` | accepted pointer id | Pointer id captured when drag started |

**Output Range:** Boolean.
**Example:** If active pointer is `17`, a move event from pointer `22` returns `false` and must not update preview.

### `dragReleaseIntent`

The `dragReleaseIntent` formula is defined as:

`dragReleaseIntent = { inputKind: drag_release, pointerId, candidateX, candidateY, dropLegal: previewLegal, foodId, foodType, w: food.w, h: food.h }`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Input kind | `drag_release` | enum | fixed | Game State Machine input kind |
| Pointer id | `pointerId` | int/string | active pointer id | Pointer that released |
| Candidate x/y | `candidateX,candidateY` | int | any int | Final candidate top-left coordinate |
| Drop legal | `previewLegal` | bool | `true/false` | Final Board Model legality result |
| Food id | `foodId` | id | current food instance id | Current food being released |
| Food type | `foodType` | enum | MVP food type | Current Food Config type |
| Footprint | `food.w, food.h` | int | MVP footprint | Current food dimensions |

**Output Range:** One immutable release intent object per accepted active `pointerup`.
**Example:** Releasing a legal `2x2` pot at `(4,6)` emits `{inputKind: drag_release, pointerId: 17, candidateX: 4, candidateY: 6, dropLegal: true, foodType: pot, w: 2, h: 2}`.

### `shouldSuppressPageGesture`

The `shouldSuppressPageGesture` formula is defined as:

`shouldSuppressPageGesture(adapterState, eventTargetInPlayArea) = adapterState == DraggingPreview AND eventTargetInPlayArea == true`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Adapter state | `adapterState` | enum | Input Adapter states | Current internal Input Adapter state |
| Event target in play area | `eventTargetInPlayArea` | bool | `true/false` | Whether the browser event belongs to the gameplay drag surface |

**Output Range:** Boolean.
**Example:** During `DraggingPreview` inside the play area, return `true` so the game may suppress page scroll for that drag. In `ReadyForPointer`, return `false`.

## Edge Cases

- **If Pointer Events are unavailable**: use the Touch fallback path and normalize touch data into the same `pointerClient`, `pointerId`, and active-pointer contract. If the browser cannot provide a stable touch identity for the drag duration, enter `AdapterError` and do not start gameplay drag.
- **If a desktop mouse event has no browser `pointerId`**: synthesize one stable mouse id for the current drag. The synthesized id is cleared on release or cancel.
- **If the player presses a right or middle mouse button**: ignore the event for gameplay drag. MVP only accepts primary-button mouse drag and single-finger touch drag.
- **If `pointerdown` happens while Game State Machine is not `Ready`**: reject the start, capture no pointer, show no preview, and emit no Board Model placement query.
- **If `pointerdown` happens while there is no current food**: reject the start and enter `InputLocked` or `AdapterError` depending on whether the missing food is expected by state.
- **If `pointerdown` happens outside the current food hit area**: ignore it and remain `ReadyForPointer`.
- **If a second finger, stylus, or mouse pointer starts during `DraggingPreview`**: ignore the non-active pointer until the accepted active pointer releases or cancels.
- **If a non-active pointer sends `pointermove`, `pointerup`, or `pointercancel`**: ignore the event completely. It must not move the ghost, update preview, submit release, cancel the active drag, or affect pressure.
- **If the active pointer leaves the board, play area, or viewport**: continue tracking if the browser still sends active-pointer events. Candidate coordinates may be negative or out of bounds and must resolve as illegal through Board Model.
- **If the active pointer capture is lost unexpectedly**: submit one `drag_cancel`, clear preview, release any remaining local capture state, and do not increment pending.
- **If duplicate `pointerup` arrives after `ReleaseSubmitted`**: ignore it and do not emit a second `drag_release`.
- **If `pointerup` happens outside the grid**: compute the final candidate coordinate, query Board Model, submit `drag_release` with `dropLegal == false`, and clear preview. Outside-grid release is an invalid release, not a cancel.
- **If timer expiry and legal release happen in the same frame**: Input Adapter emits the legal release intent with `dropLegal == true`; Game State Machine owns priority and resolves valid placement before timeout.
- **If timer expiry and invalid release happen in the same frame**: Input Adapter emits the invalid release intent with `dropLegal == false`; Game State Machine owns whether timeout/pending applies after the invalid-return path starts.
- **If timer expires while the player is still dragging**: keep filtering active-pointer events until Game State Machine sends a lock/timeout transition. Input Adapter does not pause, extend, or consume the timer.
- **If `boardRect` or `foodRect` changes during drag due to resize, orientation change, safe-area shift, or layout invalidation**: cancel the drag, clear preview, and require a fresh pickup. Do not silently remap coordinates mid-drag.
- **If the page becomes hidden, browser window blurs, or orientation changes during drag**: submit `drag_cancel`, clear preview, release capture, and do not increment pending from the adapter.
- **If current food is consumed, replaced, or hidden while dragging because Game State Machine entered a locked state**: clear active drag state and preview immediately.
- **If `boardRect.width <= 0`, `boardRect.height <= 0`, or computed `cellSize` is invalid**: enter `AdapterError` and emit no release intent.
- **If current food footprint `w,h` is missing, zero, negative, or not an integer**: enter `AdapterError` and emit no release intent.
- **If candidate x/y is negative or outside `x=0..5`, `y=0..7`**: still derive candidate footprint cells for preview where possible, but Board Model legality must be `false`.
- **If Board Model query throws or reports an invariant failure**: enter `AdapterError`, clear preview, and emit no placement intent. Test/debug builds should surface the error loudly.
- **If browser page scroll would begin during active drag inside the play area**: suppress that gesture for the active drag only.
- **If the player scrolls, pinches, or uses browser gestures outside active drag**: do not globally block the gesture unless the game shell explicitly owns that behavior.
- **If device pixel ratio or visual scale changes during active drag**: cancel the drag rather than reinterpreting old coordinates under a new scale.
- **If safe-area or viewport chrome obstructs the current food**: Input Adapter does not move layout, but it must only accept pickups from the actual current-food hit area supplied by UI.
- **If reduced-motion or accessibility mode is active**: input semantics stay identical; Feedback Layer may change animation strength.

## Dependencies

### Hard Dependencies

| Dependency | Why Required | Interface |
|------------|--------------|-----------|
| Game State Machine | Owns whether gameplay input is currently legal and resolves same-frame priority between release, timeout, lock, and game over. | Input Adapter sends `start_drag`, `drag_move`, `drag_release`, and `drag_cancel` intents; Game State Machine accepts/rejects and broadcasts lock/unlock state. |
| Board Model | Owns placement legality for board coordinates and food footprints. | Input Adapter calls read-only `canPlace`, `footprintCells`, and optionally `footprintOccupancy` with candidate top-left coordinate and current footprint. |

### Runtime Dependencies and Consumers

| System | Relationship | Contract |
|--------|--------------|----------|
| Session Runtime | Supplies current session context | Provides current food id/type/footprint, board layout rect, current-food rect, and the path for applying accepted release side effects. |
| Food Config | Indirect source of footprint data | Current food `w,h` and type must come from validated Food Config data. Input Adapter does not own food definitions. |
| Feedback Layer | Consumes input feedback outputs | Renders drag ghost, legal/illegal preview, invalid-return cue, and pickup/release/cancel feedback. It must not override legality. |
| Gameplay HUD / Result UI | Consumes lock and affordance state | Shows whether current food can be dragged and hides gameplay drag affordance during locked or result states. |
| Smoke Test Harness | Verifies deterministic input behavior | Replays pointer sequences and checks candidate coordinates, active-pointer filtering, preview legality, release/cancel intents, and scroll suppression rules. |
| Browser Platform | Provides input event surface | Pointer Events are preferred; Touch and Mouse fallbacks normalize into the same adapter contract. |
| Onboarding / Accessibility | Future consumer | May request alternate affordance layers, larger hit areas, or tap-to-place support after MVP. MVP remains single-pointer drag. |

### Explicit Non-Dependencies

- Input Adapter does not own Board Model mutation.
- Input Adapter does not own Clear Resolver calls.
- Input Adapter does not own Pressure / Pending increments.
- Input Adapter does not own scoring, combo, result state, storage, RNG, or difficulty scheduling.
- Input Adapter does not directly own audio or haptic playback; it only exposes events that Feedback / Audio systems may consume.

### Provisional Assumptions

- Session Runtime owns the current food instance and can provide stable `foodId`, `foodType`, `w`, and `h` before pickup.
- The UI layout owner can provide stable `boardRect` and `foodRect` at pickup and can notify Input Adapter when layout is invalidated.
- Game State Machine exposes enough state for `Ready`, `Dragging`, locked states, and release/cancel acknowledgement.
- Feedback Layer owns all visual polish for previews and ghost movement; Input Adapter owns only data and event timing.

## Tuning Knobs

| Knob | Default | Safe Range | Owner | Effect |
|------|---------|------------|-------|--------|
| `dragStartHitSlopPx` | `8px` | `0..16px` | Input Adapter / UI | Expands current-food pickup tolerance. Too low feels unforgiving; too high risks accidental pickup. |
| `candidateRoundingMode` | `nearestTopLeftGrid` | MVP locked | Input Adapter | Converts ghost top-left to board cell. Changing this affects muscle memory and must be reviewed with Board Model tests. |
| `previewUpdateMode` | `requestAnimationFrame` coalesced | MVP locked | Input Adapter | Limits preview updates to visual frames instead of every raw pointer event. |
| `maxPreviewUpdatesPerFrame` | `1` | `1..2` | Input Adapter | Prevents repeated layout/preview churn on high-frequency touch hardware. |
| `activePointerPolicy` | `single` | MVP locked | Input Adapter | Only one accepted gameplay pointer exists at a time. Multi-touch placement is out of scope. |
| `scrollSuppressionScope` | `activeDragInsidePlayArea` | MVP locked | Input Adapter / Game Shell | Allows preventing page scroll only during active gameplay drag inside the play area. |
| `touchFallbackEnabled` | `true` when Pointer Events unavailable | `true/false` | Platform Adapter | Preserves browser reach. Turning it off may break older mobile browsers. |
| `mouseFallbackEnabled` | `true` | `true/false` | Platform Adapter | Enables desktop QA and browser testing. |
| `dragGhostClampToViewport` | `true` visual only | `true/false` | Feedback Layer | Keeps the ghost visible while candidate legality can still be out of bounds. Must not alter board legality. |
| `layoutInvalidationPolicy` | `cancelDrag` | MVP locked | Input Adapter | Cancels active drag on resize/orientation/layout shift to avoid coordinate drift. |
| `debugInputOverlayVisible` | `false` in player builds | `false/true` | QA / Debug | Shows raw pointer, ghost, candidate, and legality data for testing. Must never ship on by default. |

Referenced but not owned by Input Adapter:

- `invalidReturnMaxMs` / invalid-return animation duration belongs to Game State Machine and Feedback Layer.
- Legal/illegal preview color, pattern, shake amplitude, haptic strength, and audio cue cooldown belong to Feedback Layer / Audio systems.
- Timer duration, timeout grace, pending penalties, and pressure changes belong to RNG / Difficulty Scheduler, Game State Machine, and Pressure / Pending System.

## Visual/Audio Requirements

Input Adapter does not own final art, animation, audio, or haptics. It must expose reliable events and data so the Feedback Layer can render them without reinterpreting input.

| Event / State | Required Visual Result | Audio / Haptic Boundary |
|---------------|------------------------|--------------------------|
| Pickup accepted | Current food lifts into a drag ghost that preserves the pickup offset. | Optional grab cue is owned by Feedback / Audio, not Input Adapter. |
| Dragging over legal cells | Full footprint preview appears on all target cells with a clearly legal treatment. | No repeated continuous sound per pointermove. |
| Dragging over illegal cells | Full footprint preview remains visible with illegal treatment, including out-of-bounds or occupied cells where representable. | Optional invalid pulse must be throttled by Feedback / Audio. |
| Candidate cell changes | Preview updates to the new candidate footprint no more than once per visual frame. | No audio requirement. |
| Non-active pointer events | No ghost movement and no preview change. | No feedback required. |
| Legal release intent | Feedback Layer may snap/place the food; Input Adapter only emits the release intent. | Landing cue belongs to Feedback / Audio. |
| Invalid release intent | Preview clears and Feedback Layer may return the food quickly. | Heavy fail cue should be avoided; timeout/failure cue belongs to Game State Machine / Result flow. |
| Cancel from page hidden, blur, orientation, or pointercancel | Preview clears and current food presentation returns to owner state. | No pending/failure cue should be implied by the adapter cancel. |
| Input locked | Drag affordance is removed or disabled by UI. | No input sound. |
| Adapter error | Player build should recover generically; debug build should show diagnostic information. | No player-facing error sound required. |

Visual readability rules:

- Preview must show the full footprint, not only the top-left cell.
- Legal and illegal states must not rely on color alone; outline, stripe, opacity, or pattern must distinguish them.
- Drag ghost may sit above the board visually, but target cells must remain readable under the finger.
- Drag feedback must not imply that the timer is paused; the conveyor/timer pressure remains active while dragging.
- Pointer movement must not trigger repeated audio or haptic spam.

Asset Spec: Visual/Audio requirements are defined. After the art bible is approved, run `/asset-spec system:Input Adapter` to produce per-asset visual descriptions, dimensions, and generation prompts from this section.

## UI Requirements

Input Adapter does not own the whole gameplay screen, but it defines the UI data needed for drag affordance, preview, and QA diagnostics.

### Player-Facing UI Signals

| UI Signal | Meaning | Required Behavior |
|-----------|---------|-------------------|
| `canStartDrag` | Current food can be picked up now | Current food should look draggable only while Game State Machine allows pickup. |
| `isDragging` | Accepted active pointer is dragging current food | Show drag ghost and suppress play-area scroll for that active drag. |
| `ghostTopLeft` | Viewport-space ghost top-left | Render ghost without pickup jump. |
| `candidateTopLeftCell` | Board candidate coordinate | Used to align preview and final release intent. |
| `candidateFootprintCells` | Full cells the food would occupy | Preview all occupied cells, including multi-cell foods. |
| `previewLegal` | Board Model says candidate can be placed | Switch legal/illegal preview treatment. |
| `inputLockedReason` | Debug reason gameplay drag is locked | Hidden from player builds; available to QA. |

### UX Rules

- The first valid drag on a `390x844` mobile viewport should be possible within 5 seconds of session start when a current food is visible.
- Current-food pickup must preserve the touch offset so the food does not jump under the finger.
- Preview must stay visible during active drag and update when candidate cell changes.
- Illegal release must not show a result card by itself; it returns or times out according to Game State Machine.
- Multiple fingers must not create multiple ghosts, flickering previews, duplicate placements, or accidental cancel.
- Debug pointer/candidate overlays must be hidden in player builds.
- Touch targets and hit slop should support one-handed mobile play without making accidental pickup common.
- Reduced-motion mode must not change input semantics; it only changes Feedback Layer animation intensity.
- UI copy is not required for normal drag operation. The interaction should be learnable through affordance and preview.

UX Flag - Input Adapter: This system has UI requirements. In Phase 4 (Pre-Production), run `/ux-design` for the gameplay drag surface / HUD interaction before writing UI stories that depend on this GDD.

## Acceptance Criteria

- **GIVEN** Game State Machine is `Ready` and current food is visible, **WHEN** the player starts a primary pointer on the current food, **THEN** Input Adapter sends one `start_drag` intent, captures that pointer, records pickup offset, and enters `DraggingPreview`.
- **GIVEN** Game State Machine is not `Ready`, **WHEN** the player starts a pointer on the current food, **THEN** Input Adapter captures no pointer, shows no preview, emits no release intent, and leaves Board Model unchanged.
- **GIVEN** current food is visible, **WHEN** the player starts a pointer outside the current food hit area, **THEN** Input Adapter ignores the event and remains `ReadyForPointer`.
- **GIVEN** one pointer is active, **WHEN** a second pointer starts or moves, **THEN** the second pointer does not move the ghost, update preview, cancel drag, or emit release.
- **GIVEN** `pointerdown` is at `(190,720)` and `foodRect.topLeft` is `(160,700)`, **WHEN** pickup is accepted, **THEN** `pickupOffset` equals `(30,20)`.
- **GIVEN** current pointer is `(250,520)` and `pickupOffset` is `(30,20)`, **WHEN** ghost position is calculated, **THEN** `ghostTopLeft` equals `(220,500)`.
- **GIVEN** `ghostTopLeft` is `(220,500)` and `boardRect.topLeft` is `(40,120)`, **WHEN** board-local position is calculated, **THEN** `boardLocalTopLeft` equals `(180,380)`.
- **GIVEN** board rect is `300x400px`, **WHEN** cell size is calculated, **THEN** `cellSize` equals `(50,50)` for a `6x8` board.
- **GIVEN** `boardLocalTopLeft` is `(123,176)` and `cellSize` is `(50,50)`, **WHEN** candidate coordinate is calculated, **THEN** `candidateTopLeftCell` equals `(2,4)` using nearest-grid rounding.
- **GIVEN** a `2x2` food has candidate top-left `(4,6)`, **WHEN** footprint cells are requested, **THEN** Input Adapter previews `(4,6)`, `(5,6)`, `(4,7)`, and `(5,7)`.
- **GIVEN** an active pointer moves over the board, **WHEN** candidate cell changes, **THEN** Input Adapter calls read-only Board Model legality APIs and emits one coalesced preview update for that visual frame.
- **GIVEN** Board Model returns `canPlace == true`, **WHEN** preview is emitted, **THEN** `previewLegal` is `true` and no Board Model mutation occurs.
- **GIVEN** Board Model returns `canPlace == false`, **WHEN** preview is emitted, **THEN** `previewLegal` is `false` and no Board Model mutation occurs.
- **GIVEN** active pointer releases on a legal candidate, **WHEN** final legality is evaluated, **THEN** Input Adapter emits exactly one `drag_release` intent with `dropLegal == true`, candidate x/y, pointer id, food id/type, and footprint.
- **GIVEN** active pointer releases outside the grid, **WHEN** final legality is evaluated, **THEN** Input Adapter emits exactly one `drag_release` intent with `dropLegal == false` instead of cancelling.
- **GIVEN** active pointer has already submitted release, **WHEN** a duplicate `pointerup` arrives, **THEN** Input Adapter ignores it and emits no second release.
- **GIVEN** active drag is in progress, **WHEN** `pointercancel`, page hidden, browser blur, orientation change, or layout invalidation occurs, **THEN** Input Adapter emits one `drag_cancel`, clears preview, releases capture, and does not increment pending.
- **GIVEN** board rect width or height is zero, **WHEN** a drag attempts to compute cell size, **THEN** Input Adapter enters `AdapterError` and emits no release intent.
- **GIVEN** current food footprint is missing or invalid, **WHEN** pickup is attempted, **THEN** Input Adapter rejects gameplay drag and emits no Board Model placement query.
- **GIVEN** Game State Machine enters `Spawning`, `ResolvingClears`, `AwaitingNext`, or `GameOver`, **WHEN** Input Adapter has active or pending drag state, **THEN** active drag visuals clear and new gameplay pointer events are rejected.
- **GIVEN** active drag is inside the play area, **WHEN** the browser would scroll from the drag gesture, **THEN** `shouldSuppressPageGesture` returns `true`.
- **GIVEN** there is no active drag, **WHEN** the player scrolls or performs a browser gesture, **THEN** `shouldSuppressPageGesture` returns `false` unless the game shell owns that gesture.
- **GIVEN** Pointer Events are unavailable but Touch events provide a stable touch id, **WHEN** the player drags current food, **THEN** Touch fallback produces the same candidate, preview, release, and cancel semantics as Pointer Events.
- **GIVEN** debug overlay is disabled for player builds, **WHEN** the player drags food, **THEN** raw pointer id, raw coordinates, and internal legality diagnostics are not shown.
- **GIVEN** the Smoke Test Harness replays the same board rect, food rect, footprint, and pointer sequence twice, **WHEN** Input Adapter calculates candidates, **THEN** both runs produce identical candidate coordinates, legality values, and release/cancel intents.

## Open Questions

| Question | Current Assumption | Owner | Target Resolution |
|----------|--------------------|-------|-------------------|
| Should candidate snapping stay nearest-grid `round`, or switch to a threshold/floor feel after playtest? | Use nearest-grid `round` for MVP because it matches the current prototype feel. | UX / Gameplay | Before vertical slice tuning. |
| What exact hit slop feels best on common mobile screens? | Start at `8px`, safe range `0..16px`. | UX | During first mobile usability pass. |
| Which older mobile browsers must the Touch fallback support? | Support Touch fallback when Pointer Events are unavailable; define exact browser matrix later. | Technical / QA | Before public demo QA. |
| Should drag ghost be visually clamped to viewport or allowed to leave the screen? | Clamp ghost visually while keeping candidate legality based on true ghost top-left. | UX / Feedback | During Feedback Layer design. |
| Where should the debug input overlay live? | Hidden QA overlay, not part of player HUD. | QA / UI | Before Smoke Test Harness implementation. |
| Is an accessibility alternate input needed for MVP, such as tap-to-select then tap-to-place? | Not required for MVP, but Input Adapter should not block adding it later. | Accessibility / UX | Before vertical slice. |
| Should layout changes during drag ever remap coordinates instead of cancelling? | Cancel drag for MVP to avoid unfair coordinate drift. | Technical / UX | Revisit only if rotation/responsive issues appear in QA. |
| What haptic/audio cooldown should illegal preview use? | Input Adapter emits data only; cooldown belongs to Feedback / Audio. | Audio / Feedback | During Feedback Layer and Audio / Haptics design. |
