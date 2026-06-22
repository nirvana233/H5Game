# Board Model

> **Status**: Approved
> **Author**: Fox + Codex agents
> **Last Updated**: 2026-06-21
> **Implements Pillar**: 形状制造戏剧; 消除必须救命

## Overview

Board Model 是《冰箱爆仓了》的纯逻辑网格系统，负责定义 `6x8` 冰箱坐标、格子占用、食物矩形 footprint、合法放置查询和占格更新。它不处理渲染、输入手势、动画或分数，只回答“这个食物能不能放在这里”和“当前棋盘哪些格子被哪些食物占用”。没有这个系统，后续的拖拽预览、三消连通判定、压力上涨和自动化测试都无法得到一致结果。

## Player Fantasy

Board Model 的玩家幻想是间接的：玩家不会意识到它存在，但会相信冰箱空间是公平、稳定、可预测的。每次食物刚好塞进去、每次因为一格之差放不下、每次三消后真实腾出关键空间，都应该让玩家觉得“这是我规划得好或没规划好”，而不是系统在乱判。它服务于两个核心支柱：形状制造戏剧，以及消除必须救命。

## Detailed Design

### Core Rules

1. Board Model owns a fixed rectangular grid of `6` columns by `8` rows.
2. Coordinates are zero-based: `x=0..5`, `y=0..7`.
3. `(0,0)` is the top-left cell of the fridge grid; `x` increases rightward and `y` increases downward.
4. Each cell is either empty or occupied by exactly one food instance id.
5. A food instance occupies a rectangular footprint defined by `width` and `height`.
6. A placement request uses the top-left coordinate of the footprint.
7. A placement is legal only if every footprint cell is inside board bounds and empty.
8. Board Model does not rotate food. Rotation is not part of MVP.
9. Board Model does not apply gravity, refill, score, pressure, animation, or input behavior.
10. Placing food writes the same food instance id into every occupied cell.
11. Removing food clears every cell owned by that food instance id.
12. Clearing a cell directly without removing the owning food instance is invalid.
13. Board Model must expose occupancy queries for:
    - single cell lookup
    - full footprint lookup
    - all cells occupied by a food instance
    - whether any legal placement exists for a given footprint
14. Board Model must keep food-instance records consistent with cell occupancy.

### States and Transitions

| State | Entry Condition | Exit Condition | Behavior |
|-------|-----------------|----------------|----------|
| Empty Board | New game or restart | First successful placement | All cells empty; no food instances registered |
| Stable Board | No mutation in progress | Placement, removal, or reset starts | Queries are valid and deterministic |
| Applying Placement | Valid placement request accepted | Occupancy write completes | Writes food instance id to every footprint cell atomically |
| Applying Removal | Clear/removal request accepted | Occupancy clear completes | Clears all cells belonging to the removed food instance atomically |
| Resetting | Restart or test setup starts | Board fully reset | Clears all cells and food instance records |

Board Model mutations are atomic from the perspective of other systems. Other systems may observe the board before or after a placement/removal, but never a partially written footprint.

### Interactions with Other Systems

| System | Direction | Interface |
|--------|-----------|-----------|
| Food Config | Input to Board Model | Provides `type`, `width`, `height`, and shape identity for placement validation |
| Input Adapter | Consumes Board Model | Calls footprint legality checks for drag preview and release validation |
| Clear Resolver | Consumes and mutates Board Model | Reads food instance positions, then requests whole-instance removal after clear resolution |
| Pressure / Pending System | Consumes Board Model | Queries whether the current food has any legal placement |
| Session Runtime | Owns mutation timing | Calls reset, place, remove, and query operations at legal game-state moments |
| Smoke Test Harness | Consumes and seeds Board Model | Creates scripted board states and verifies deterministic occupancy results |
| Gameplay HUD / Feedback Layer | Indirect consumer | Uses outputs from Input Adapter and Clear Resolver, not direct board mutation |

MVP Board Model supports only rectangular footprints because all approved MVP food shapes are `1x1`, `2x1`, `1x2`, `2x2`, or `3x1`. If post-MVP food adds L-shaped or T-shaped items, this system must be revised from rectangle dimensions to an explicit cell-mask footprint model.

## Formulas

All Board Model formulas operate on a stable board snapshot. They use the current food's original MVP footprint and do not consider rotation.

Board constants:

- `cols = 6`
- `rows = 8`
- `validFootprints = {(1,1), (2,1), (1,2), (2,2), (3,1)}`
- Every coordinate range in this section is an integer closed interval.
- Every cell state is either `EMPTY` or one active `foodInstanceId`.

### `footprintCells`

The `footprintCells` formula is defined as:

`footprintCells(x, y, w, h) = {(x + dx, y + dy) | dx in [0, w - 1], dy in [0, h - 1]}`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Top-left x | `x` | int | Any int | Requested footprint top-left column |
| Top-left y | `y` | int | Any int | Requested footprint top-left row |
| Width | `w` | int | `1..6`; MVP values `1,2,3` | Food footprint width in cells |
| Height | `h` | int | `1..8`; MVP values `1,2` | Food footprint height in cells |
| Delta x | `dx` | int | `[0, w - 1]` | Column offset inside the footprint |
| Delta y | `dy` | int | `[0, h - 1]` | Row offset inside the footprint |

**Output Range:** A set of `w * h` coordinates before bounds filtering.
**Example:** `footprintCells(2, 3, 2, 1) = {(2,3), (3,3)}`.

### `isInBounds`

The `isInBounds` formula is defined as:

`isInBounds(x, y, w, h) = x >= 0 AND y >= 0 AND x + w <= cols AND y + h <= rows`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Top-left x | `x` | int | Any int | Requested footprint top-left column |
| Top-left y | `y` | int | Any int | Requested footprint top-left row |
| Width | `w` | int | `1..6` | Food footprint width |
| Height | `h` | int | `1..8` | Food footprint height |
| Board columns | `cols` | int | `6` in MVP | Board width |
| Board rows | `rows` | int | `8` in MVP | Board height |

**Output Range:** Boolean.
**Example:** `isInBounds(4, 0, 2, 1) = true`; `isInBounds(5, 0, 2, 1) = false`.

### `cellAt`

The `cellAt` formula is defined as:

`cellAt(x, y) = board[y][x] if x in [0, cols - 1] AND y in [0, rows - 1], otherwise OUT_OF_BOUNDS`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Cell x | `x` | int | Any int | Queried column |
| Cell y | `y` | int | Any int | Queried row |
| Board | `board` | 2D cell array | `rows x cols` | Current stable board snapshot |

**Output Range:** `EMPTY`, `foodInstanceId`, or `OUT_OF_BOUNDS`.
**Example:** On an empty board, `cellAt(0, 0) = EMPTY`; `cellAt(6, 0) = OUT_OF_BOUNDS`.

### `footprintOccupancy`

The `footprintOccupancy` formula is defined as:

`footprintOccupancy(x, y, w, h) = {cellAt(cx, cy) | (cx, cy) in footprintCells(x, y, w, h)}`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Top-left x | `x` | int | Any int | Requested footprint top-left column |
| Top-left y | `y` | int | Any int | Requested footprint top-left row |
| Width | `w` | int | `1..6` | Food footprint width |
| Height | `h` | int | `1..8` | Food footprint height |
| Coordinate | `(cx, cy)` | tuple<int,int> | Any coordinate generated by `footprintCells` | Cell being queried |

**Output Range:** A set/list of cell states with size `w * h`; may include `OUT_OF_BOUNDS`.
**Example:** If `(2,3)` is occupied by `food_12` and `(3,3)` is empty, `footprintOccupancy(2, 3, 2, 1) = {food_12, EMPTY}`.

### `canPlace`

The `canPlace` formula is defined as:

`canPlace(food, x, y) = isInBounds(x, y, food.w, food.h) AND every cell in footprintOccupancy(x, y, food.w, food.h) is EMPTY`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Food | `food` | object | Approved Food Config item | Provides `w` and `h` |
| Top-left x | `x` | int | Any int | Requested footprint top-left column |
| Top-left y | `y` | int | Any int | Requested footprint top-left row |
| Cell occupancy | `cell` | enum/id | `EMPTY`, `OUT_OF_BOUNDS`, or `foodInstanceId` | Current board occupancy result |

**Output Range:** Boolean.
**Example:** A `2x2` pot at `(4,6)` is legal only if `(4,6)`, `(5,6)`, `(4,7)`, and `(5,7)` are all `EMPTY`.

### `occupiedCellsOfInstance`

The `occupiedCellsOfInstance` formula is defined as:

`occupiedCellsOfInstance(foodInstanceId) = {(x, y) | x in [0, cols - 1], y in [0, rows - 1], cellAt(x, y) = foodInstanceId}`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Food instance id | `foodInstanceId` | string/int id | Active food instance ids | The whole food instance being queried |
| Cell x | `x` | int | `[0, cols - 1]` | Board column |
| Cell y | `y` | int | `[0, rows - 1]` | Board row |

**Output Range:** Empty set if the id is absent; otherwise a set whose size equals that instance footprint area.
**Example:** A `3x1` fish placed at `(1,4)` returns `{(1,4), (2,4), (3,4)}`.

### `hasAnyLegalPlacement`

The `hasAnyLegalPlacement` formula is defined as:

`hasAnyLegalPlacement(food) = false if food.w > cols OR food.h > rows; otherwise exists x in [0, cols - food.w], y in [0, rows - food.h] where canPlace(food, x, y)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Food | `food` | object | Approved Food Config item | Provides original, unrotated `w` and `h` |
| Board columns | `cols` | int | `6` in MVP | Board width |
| Board rows | `rows` | int | `8` in MVP | Board height |
| Candidate x | `x` | int | `[0, cols - food.w]` if food fits board dimensions | Candidate top-left column |
| Candidate y | `y` | int | `[0, rows - food.h]` if food fits board dimensions | Candidate top-left row |

**Output Range:** Boolean.
**Example:** If a `3x1` fish has no three horizontally adjacent empty cells anywhere on the current stable board snapshot, `hasAnyLegalPlacement(fish) = false`.

Board Model only queries and removes whole food instances by `foodInstanceId`. It does not decide which types match or whether a group should clear; that responsibility belongs to Clear Resolver.

## Edge Cases

- **If a placement coordinate is negative**: `canPlace` returns `false`; no board mutation occurs.
- **If a placement footprint extends past the right or bottom board edge**: `canPlace` returns `false`; no board mutation occurs.
- **If `food.w` or `food.h` is zero, negative, non-integer, or not in the MVP footprint set**: the placement request is invalid; no board mutation occurs.
- **If `food.w > cols` or `food.h > rows`**: `canPlace` returns `false` for every coordinate and `hasAnyLegalPlacement` returns `false`.
- **If any target footprint cell is already occupied**: `canPlace` returns `false`; Board Model does not partially place the food.
- **If a placement uses a `foodInstanceId` already present on the board**: reject the placement; each active instance id must be unique.
- **If removal is requested for an unknown `foodInstanceId`**: return a not-found result and leave the board unchanged.
- **If removal is requested for a known multi-cell food instance**: remove all cells owned by that instance atomically.
- **If another system attempts to clear a single cell directly**: reject the request; Board Model only removes whole food instances.
- **If the board is full**: single-cell lookup still works, but `hasAnyLegalPlacement` returns `false` for every food unless a valid footprint is available after a later removal.
- **If reset occurs**: clear all cells and food instance records atomically, regardless of previous board contents.
- **If board cell occupancy and food-instance records disagree**: treat this as an invariant violation; smoke tests must fail, and production code must not silently repair partial state.
- **If a query is made while a placement/removal/reset mutation is in progress**: no partial state may be observable; callers see either the previous stable board or the next stable board after the mutation completes.

## Dependencies

Board Model has no hard upstream GDD dependency. It is the foundation system for board occupancy and can be tested with inline footprint definitions. Runtime food dimensions come from Food Config, but Board Model must not directly depend on Food Config storage or rendering data.

| System | Direction | Nature of Dependency |
|--------|-----------|----------------------|
| Food Config | Soft input provider | Owns approved `type`, `w`, `h`, and footprint identity. Board Model accepts these values as input but does not own food balance or visuals. |
| Input Adapter | Downstream consumer | Uses `canPlace`, `footprintCells`, and occupancy queries to show legal/illegal drag preview and validate releases. |
| Clear Resolver | Downstream consumer and mutation requester | Reads occupied cells and food instance locations; requests whole-instance removal after it decides which groups clear. |
| Pressure / Pending System | Downstream consumer | Calls `hasAnyLegalPlacement(food)` on the current stable board snapshot to decide whether no-space pressure should rise. |
| Session Runtime | Mutation orchestrator | Owns when reset, placement, and removal requests are allowed according to game state. |
| Smoke Test Harness | Test consumer | Seeds board layouts and verifies deterministic occupancy, placement, removal, and no-legal-placement results. |
| Gameplay HUD / Result UI | Indirect consumer | Does not mutate Board Model; receives board-derived state through Input Adapter, Clear Resolver, Pressure, or Session Runtime. |
| Feedback Layer | Indirect consumer | Does not mutate Board Model; visualizes placement and clear outcomes produced by other systems. |

Hard dependency rule: only Session Runtime may sequence Board Model mutations during live play. Other systems may request or consume Board Model results through their owned phase, but they must not create partial board state or bypass whole-instance placement/removal.

## Tuning Knobs

Board Model has very few tuning knobs by design. Core board dimensions and approved MVP footprint shapes are design constants, not casual balance values. If they change, downstream systems and tests must be reviewed.

| Parameter | Current Value | Safe Range | Effect of Increase | Effect of Decrease |
|-----------|---------------|------------|--------------------|--------------------|
| `cols` | `6` | `6` for MVP | Wider board lowers space pressure and may weaken the core tension | Narrower board raises pressure sharply and may make `3x1` fish unfair |
| `rows` | `8` | `8` for MVP | Taller board extends survival time and reduces early failure | Shorter board increases failure frequency and reduces planning room |
| `validFootprints` | `{(1,1), (2,1), (1,2), (2,2), (3,1)}` | MVP set only | Adding larger or non-rectangular shapes increases drama but requires new tests and possibly a mask model | Removing shapes reduces variety and weakens late-game pressure |
| `allowRotation` | `false` | `false` for MVP | If enabled later, player agency rises but Input, Clear, Pressure, and tutorial rules must be redesigned | No effect below current value |
| `allowPartialRemoval` | `false` | `false` | If enabled, multi-cell food behavior becomes ambiguous and Clear Resolver must be redesigned | No effect below current value |
| `mutationAtomicity` | `true` | `true` | Required invariant; cannot be loosened safely | Partial states would create invalid clears, pressure checks, and previews |

Difficulty tuning must not be performed by changing Board Model constants. Use `RNG / Difficulty Scheduler` and `Pressure / Pending System` for pacing and difficulty adjustments.

## Visual/Audio Requirements

Board Model has no direct visual or audio output. It must not trigger animations, sounds, particles, screen shake, or UI state by itself.

| Event | Visual Feedback | Audio Feedback | Priority |
|-------|-----------------|----------------|----------|
| Valid footprint query | None directly; Input Adapter may visualize legal cells | None | Data only |
| Invalid footprint query | None directly; Input Adapter may visualize illegal cells | None | Data only |
| Successful placement mutation | None directly; Feedback Layer may animate placement based on the committed board result | None | Data only |
| Whole-instance removal | None directly; Clear Resolver and Feedback Layer own clear animation and sound triggers | None | Data only |
| Reset | None directly; Session Runtime owns restart presentation | None | Data only |

Constraint: Board Model must expose deterministic results early enough for Input Adapter and Feedback Layer to render previews and transitions, but it must not own presentation timing.

## UI Requirements

Board Model has no direct UI surface. It must not create DOM nodes, canvas drawing commands, HUD labels, warning text, or result-card content.

| Information | Display Location | Update Frequency | Condition |
|-------------|------------------|------------------|-----------|
| Cell occupancy | Not displayed directly | On board mutation or query | Input Adapter, Feedback Layer, or debug tooling may translate it into visuals |
| Footprint legality | Drag preview / debug overlay via Input Adapter | During drag preview and release validation | Board Model only returns boolean/query data |
| Legal placement availability | Pressure/HUD logic via Pressure / Pending System | When current food or board snapshot changes | Board Model only answers `hasAnyLegalPlacement(food)` |
| Food instance occupied cells | Clear preview / debug tooling via Clear Resolver | During clear resolution or tests | Board Model returns coordinates; Clear Resolver owns match meaning |
| Board reset state | Session/UI layer | On restart | Board Model only returns empty occupancy after reset |

Debug allowance: development builds may expose a board inspection overlay, but it must be read-only and must not become required for normal play.

## Acceptance Criteria

- **GIVEN** a new board, **WHEN** the board is initialized, **THEN** it contains exactly `48` cells, all cells are `EMPTY`, and there are no active food instance records.
- **GIVEN** an empty board, **WHEN** `cellAt(0,0)`, `cellAt(5,7)`, `cellAt(6,0)`, and `cellAt(-1,0)` are queried, **THEN** the first two return `EMPTY` and the last two return `OUT_OF_BOUNDS`.
- **GIVEN** any valid integer `x`, `y`, `w`, and `h`, **WHEN** `footprintCells(x,y,w,h)` is called, **THEN** it returns exactly `w * h` coordinates with `(x,y)` as the top-left coordinate and does not swap `x` and `y`.
- **GIVEN** a footprint that is partly outside the board, **WHEN** `footprintOccupancy` is queried, **THEN** it returns exactly `w * h` results, includes `OUT_OF_BOUNDS` for outside cells, throws no error, and leaves the board unchanged.
- **GIVEN** each MVP footprint `(1,1)`, `(2,1)`, `(1,2)`, `(2,2)`, and `(3,1)` over an empty in-bounds target area, **WHEN** `canPlace` is called, **THEN** it returns `true`.
- **GIVEN** a non-MVP footprint, zero dimension, negative dimension, or non-integer dimension, **WHEN** placement is attempted, **THEN** the request is rejected and both board occupancy and instance records remain unchanged.
- **GIVEN** a target footprint where any cell is already occupied, **WHEN** `canPlace` is called and placement is attempted, **THEN** `canPlace` returns `false` and no target cell is written.
- **GIVEN** an empty `2x2` target area, **WHEN** a `2x2` food is placed successfully, **THEN** all four footprint cells contain the same `foodInstanceId` and the instance record matches those four coordinates.
- **GIVEN** an active `foodInstanceId=A`, **WHEN** another placement attempts to reuse `A`, **THEN** the placement is rejected and the original instance and board occupancy remain unchanged.
- **GIVEN** a placed multi-cell instance, **WHEN** `occupiedCellsOfInstance(id)` is queried, **THEN** it returns the complete footprint coordinates for that instance.
- **GIVEN** no active instance with id `unknown`, **WHEN** `occupiedCellsOfInstance(unknown)` is queried, **THEN** it returns an empty set and leaves the board unchanged.
- **GIVEN** a placed `3x1` instance, **WHEN** that `foodInstanceId` is removed, **THEN** all three occupied cells become `EMPTY` and all unrelated instances remain in their original coordinates.
- **GIVEN** an unknown `foodInstanceId`, **WHEN** removal is requested, **THEN** the operation returns a not-found or failure result and leaves the board unchanged.
- **GIVEN** another system attempts to clear a single cell directly, **WHEN** the request reaches Board Model, **THEN** the request is rejected and no partial instance removal occurs.
- **GIVEN** a placement, removal, or reset mutation is executing, **WHEN** any external system queries the board, **THEN** it can observe only the previous stable board or the next stable board, never a partially written board.
- **GIVEN** a food instance has another instance below it, **WHEN** the upper instance is removed, **THEN** the lower instance remains at the same coordinates, proving Board Model applies no gravity.
- **GIVEN** only vertical three-cell gaps or three separated empty cells exist, **WHEN** `hasAnyLegalPlacement` is queried for a `3x1` fish, **THEN** it returns `false`.
- **GIVEN** at least one horizontal run of three empty cells exists, **WHEN** `hasAnyLegalPlacement` is queried for a `3x1` fish, **THEN** it returns `true`.
- **GIVEN** a board with multiple placed instances, **WHEN** reset is executed, **THEN** all `48` cells become `EMPTY` and all food instance records are removed.
- **GIVEN** Input Adapter consumes Board Model, **WHEN** it requests preview data, **THEN** Board Model provides `canPlace`, `footprintCells`, and `footprintOccupancy` results without requiring UI, pointer, or drag state.
- **GIVEN** Clear Resolver consumes Board Model, **WHEN** it requests removal after deciding a clear, **THEN** Board Model supports whole-instance removal but does not decide match groups, connected components, score, or streak.
- **GIVEN** Pressure / Pending System consumes Board Model, **WHEN** it queries `hasAnyLegalPlacement(food)` on a stable board snapshot, **THEN** Board Model returns only the true/false placement availability and does not modify pressure values.

## Open Questions

| Question | Owner | Deadline | Resolution |
|----------|-------|----------|------------|
| Should Board Model stay rectangle-only after MVP, or should it move to cell-mask footprints for L/T-shaped food? | Systems Designer | Before adding post-MVP food shapes | MVP remains rectangle-only. Revisit only if non-rectangular food is approved. |
| Should board dimensions ever vary by challenge/theme? | Game Designer | Before Daily Challenge or theme design | MVP locks `6x8`. Any variant board requires review of Input, Pressure, Clear Resolver, and Smoke Test Harness. |
| What exact implementation module owns mutation access control? | Technical Director | Architecture phase | GDD rule is that Session Runtime sequences live mutations; implementation ownership should be finalized in architecture/ADR. |
