# Clear Resolver

> **Status**: Approved
> **Author**: Fox + Codex agents
> **Last Updated**: 2026-06-22
> **Implements Pillar**: 消除必须救命; 形状制造戏剧; 一眼看懂冰箱要爆

## Overview

Clear Resolver 是《冰箱爆仓了》的同类连通清除系统，负责在一次合法放置后读取 Board Model 上的食物实例、按 Food Config 的 `type` 分组、判断同类食物实例是否通过上下左右相邻形成连通分量，并把达到 `3+` 个实例的分量提交为整组清除结果。它不决定拖拽、放置、压力、分数、动画或生成，只回答“哪些食物实例应该被清掉、清掉多少格、产生几个清除组”。这个系统必须保证每次消除都真实释放空间，让玩家在快爆仓时通过一次精确摆放救回局面。

## Player Fantasy

玩家幻想是“我刚才那一放，真的把冰箱救回来了”。玩家不会直接看到连通图算法，但会感受到规则公平且容易预测：三个同类食物只要任意占格上下左右接上，就会整组清掉；多格食物不会只清一部分；`4+` 个同类连在一起会一起消，不会只取其中三个。Clear Resolver 的目标是把空间规划转化成即时释放空间的爽感。

## Detailed Design

### Core Rules

1. Clear Resolver 只在 Game State Machine 的 `ResolvingClears` 阶段运行。
2. Clear Resolver 读取 Board Model 的稳定快照，包括所有 active food instance、每个实例的 `foodInstanceId`、`type`、footprint cells。
3. 同 `type` 的食物实例才可能属于同一个清除组。
4. 两个同 `type` 食物实例只要任意一格上下左右相邻，即视为实例相连。
5. 斜角相邻不算连通。
6. 一个食物实例即使占多格，也只按 1 个食物实例计入清除阈值。
7. 连通分量达到 `3+` 个食物实例时，整个分量 eligible for clear。
8. `4+` 个同类连通实例会整组清除，不截取其中 3 个。
9. 多格食物被清除时，必须整实例移除，释放它占用的全部格子。
10. 一次放置可能同时产生多个 eligible component；所有 eligible component 在同一 resolution wave 内同步清除。
11. 同步清除后可以重新扫描，直到没有新的 eligible component。MVP 无重力和补位，所以通常只有一波，但保留重扫让规则可扩展。
12. Clear Resolver 不直接加分、不减压、不播放动画。它输出 `clearGroups`、`clearedItems`、`clearedCells`、`multiClearCount` 给下游系统。
13. Clear Resolver 必须 deterministic：同一 Board Model 快照和 Food Config 类型映射必须得到同一清除结果。

### States and Transitions

| State | Entry Condition | Exit Condition | Behavior |
|-------|-----------------|----------------|----------|
| `Idle` | 不在清除解析阶段 | Game State Machine 请求解析 | 不读取或改变 Board Model |
| `Snapshotting` | 合法放置完成 | 快照读取完成 | 读取实例、类型、占格 |
| `BuildingGraph` | 快照可用 | 图构建完成 | 按 type 建立实例连通图 |
| `FindingComponents` | 图可用 | 分量扫描完成 | 找出同 type connected components |
| `ResolvingWave` | 存在 eligible component | Board Model 移除完成 | 同步提交整实例移除请求 |
| `ResultReady` | 没有更多 eligible component | Game State Machine 消费结果 | 输出清除统计 |
| `ResolverError` | 快照或实例数据不一致 | Runtime reset / test failure | 不提交部分清除 |

| From | Trigger | Guard | To | Required Side Effects |
|------|---------|-------|----|-----------------------|
| `Idle` | `resolveClears` | Board Model 快照稳定 | `Snapshotting` | 记录触发放置 id |
| `Snapshotting` | Snapshot complete | 所有实例有 type 和 cells | `BuildingGraph` | 生成 per-type 实例列表 |
| `BuildingGraph` | Graph complete | 图节点和边有效 | `FindingComponents` | 记录相邻关系 |
| `FindingComponents` | Eligible components found | component size `>=3` | `ResolvingWave` | 生成 clearGroups |
| `ResolvingWave` | Board removal applied | 移除全部 eligible instances | `Snapshotting` | 可选重扫新快照 |
| `FindingComponents` | No eligible components | None | `ResultReady` | 输出空清除结果 |
| Any | Invariant failure | 缺 instance/type/cell 或 occupancy 冲突 | `ResolverError` | 不清除、不加分、不减压 |

### Interactions with Other Systems

| System | Direction | Interface Contract |
|--------|-----------|--------------------|
| Board Model | Clear Resolver reads and requests removals | Reads active instances and occupied cells; requests whole-instance removal for eligible groups only. |
| Food Config | Clear Resolver consumes type identity | Uses stable `type` ids; display names and visual tags are irrelevant to matching. |
| Game State Machine | Game State Machine schedules resolver | Resolver may run only after valid placement and while gameplay input/timer are locked. |
| Session Runtime | Runtime applies resolver output | Calls resolver, applies Board Model removals, forwards clear stats to pressure/scoring/feedback. |
| Pressure / Pending System | Consumes clear stats | Uses `clearedItems`, `clearedCells`, and streak context to reduce pressure. |
| Scoring / Result Rules | Consumes clear stats | Awards clear score, streak score, and multi-clear bonus. |
| Feedback Layer | Consumes clear groups | Animates highlighted groups and cell release; must not change which groups cleared. |
| Smoke Test Harness | Verifies resolver determinism | Seeds board snapshots and expects exact clearGroups / cleared cells. |

## Formulas

### `cellsOrthogonallyAdjacent`

The `cellsOrthogonallyAdjacent` formula is defined as:

`cellsOrthogonallyAdjacent(a, b) = abs(a.x - b.x) + abs(a.y - b.y) == 1`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Cell A | `a` | coordinate | board cell | First occupied cell |
| Cell B | `b` | coordinate | board cell | Second occupied cell |

**Output Range:** Boolean.
**Example:** `(2,3)` and `(2,4)` are adjacent; `(2,3)` and `(3,4)` are not.

### `instancesAdjacent`

The `instancesAdjacent` formula is defined as:

`instancesAdjacent(i, j) = i.type == j.type AND exists cellA in i.cells, cellB in j.cells where cellsOrthogonallyAdjacent(cellA, cellB)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Instance i | `i` | food instance | active board instance | First food instance |
| Instance j | `j` | food instance | active board instance | Second food instance |
| Occupied cells | `i.cells`, `j.cells` | set<coordinate> | `1..4` cells in MVP | Whole footprint cells |
| Type | `type` | enum | MVP food types | Food Config stable id |

**Output Range:** Boolean.
**Example:** A `2x1` egg and another egg touching along one side are adjacent; egg touching pizza is not.

### `connectedComponentsByType`

The `connectedComponentsByType` formula is defined as:

`connectedComponentsByType(instances) = connected components of graph G where nodes are instances and edges exist when instancesAdjacent(i, j)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Instances | `instances` | set<food instance> | `0..48` active instances | Active board food instances |
| Graph | `G` | undirected graph | one graph per snapshot | Nodes are food instances, edges are same-type adjacency |

**Output Range:** Set of components, each containing `1..N` food instances.
**Example:** Three connected `tea` instances produce one component of size `3`.

### `isClearEligible`

The `isClearEligible` formula is defined as:

`isClearEligible(component) = count(component.instances) >= 3`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Component | `component` | set<food instance> | `1..N` | Same-type connected component |
| Instance count | `count(component.instances)` | int | `1..N` | Number of food instances, not cells |

**Output Range:** Boolean.
**Example:** Two `pot` instances touching do not clear; three touching `pot` instances clear even though they occupy 12 cells.

### `clearResult`

The `clearResult` formula is defined as:

`clearResult(eligibleComponents) = {clearGroups, clearedItems, clearedCells, multiClearCount}`

Where:

- `clearGroups = eligibleComponents`
- `clearedItems = sum(count(component.instances) for component in eligibleComponents)`
- `clearedCells = union(instance.cells for each instance in eligibleComponents)`
- `multiClearCount = count(eligibleComponents)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Eligible components | `eligibleComponents` | set<component> | `0..N` | Components with size `>=3` |
| Cleared items | `clearedItems` | int | `0..active instances` | Whole food instances cleared |
| Cleared cells | `clearedCells` | set<coordinate> | `0..48` | Board cells released |
| Multi clear count | `multiClearCount` | int | `0..N` | Number of separate clear groups in this wave |

**Output Range:** Structured clear result. Empty clear emits zeros and empty groups.
**Example:** One group of 3 teas and one group of 4 eggs emits `clearedItems=7`, `multiClearCount=2`.

## Edge Cases

- **If two same-type instances touch diagonally only**: they are not adjacent and do not connect.
- **If three same-type instances are connected through a chain**: all three clear even if the first and third do not touch directly.
- **If a multi-cell food touches another same-type food on multiple cells**: it still counts as one graph edge and one food instance.
- **If four or more same-type instances are in one component**: the entire component clears.
- **If one placement creates two different type clear groups**: both groups clear in the same wave and `multiClearCount` records both.
- **If an instance appears in two eligible relationships**: it is included once in its connected component and removed once.
- **If Board Model has a cell occupied by an unknown instance id**: enter `ResolverError` and do not clear.
- **If an active instance has no occupied cells**: enter `ResolverError`; Board Model consistency is broken.
- **If an instance type is missing from Food Config**: enter `ResolverError`; matching cannot be trusted.
- **If no eligible component exists after placement**: output an empty clear result; scoring streak resets downstream.
- **If a wave removes cells and the rescan finds no new eligible component**: finish resolution.
- **If a wave would ask Board Model to remove the same instance twice**: de-duplicate before mutation.

## Dependencies

| Dependency | Type | Contract |
|------------|------|----------|
| Board Model | Hard | Source of stable occupancy and owner of whole-instance removal. |
| Food Config | Hard | Source of stable `type` ids for same-type grouping. |
| Game State Machine | Hard | Authorizes resolver timing in `ResolvingClears`. |
| Session Runtime | Hard | Calls resolver and forwards results to scoring, pressure, feedback. |
| Pressure / Pending System | Downstream | Consumes clear stats; does not decide clear groups. |
| Scoring / Result Rules | Downstream | Consumes clear stats and streak context. |
| Feedback Layer | Downstream | Renders clear feedback from immutable clear result. |
| Smoke Test Harness | Downstream | Tests graph and component behavior. |

## Tuning Knobs

| Knob | Current Value | Safe Range | Effect |
|------|---------------|------------|--------|
| `clearThresholdItems` | `3` | MVP locked | Number of same-type food instances needed to clear. |
| `adjacencyMode` | `orthogonal` | MVP locked | Diagonal clears are intentionally excluded. |
| `maxResolutionWaves` | `4` | `1..8` | Safety cap for future mechanics; MVP usually finishes in one wave. |
| `dedupeClearGroups` | `true` | MVP locked | Prevents double-removal if an instance is referenced twice. |
| `rescanAfterWave` | `true` | `true/false` | Kept for correctness and future extension; may be optimized later. |

## Visual/Audio Requirements

Clear Resolver emits data for feedback but owns no visuals or audio. Feedback Layer should be able to highlight each `clearGroup`, flash all `clearedCells`, and distinguish single clear from `multiClearCount > 1`. Audio / haptics should trigger once per clear wave, not once per cell.

Asset Spec: Visual/Audio requirements are defined. After the art bible is approved, run `/asset-spec system:Clear Resolver` for clear highlight and cell-release cue specs.

## UI Requirements

The resolver has no direct player UI, but its output must support UI feedback:

- HUD can receive `clearedItems`, `multiClearCount`, and `clearStreak` after scoring applies.
- Board feedback can map `clearGroups` back to occupied cells.
- Result UI can use aggregate `clearedItemsTotal` and largest clear group if Scoring / Result Rules stores them.
- Debug UI may show component ids and type groups for QA only.

## Acceptance Criteria

- **GIVEN** three same-type `1x1` foods connected orthogonally, **WHEN** resolver runs, **THEN** it returns one clear group of 3 instances.
- **GIVEN** three same-type foods connected only by diagonal contact, **WHEN** resolver runs, **THEN** no clear group is returned.
- **GIVEN** four same-type foods in one connected component, **WHEN** resolver runs, **THEN** all four clear together.
- **GIVEN** three `pot` instances each occupying `2x2`, **WHEN** they form one same-type component, **THEN** `clearedItems=3` and all 12 cells are released.
- **GIVEN** two separate eligible components of different types, **WHEN** resolver runs, **THEN** both clear in the same wave and `multiClearCount=2`.
- **GIVEN** Board Model snapshot contains an unknown instance id, **WHEN** resolver runs, **THEN** it enters `ResolverError` and emits no partial clear.
- **GIVEN** no eligible component exists, **WHEN** resolver runs, **THEN** it returns empty `clearGroups`, `clearedItems=0`, `clearedCells=[]`, `multiClearCount=0`.
- **GIVEN** identical board snapshots, **WHEN** resolver runs twice, **THEN** the clear result is identical.

## Open Questions

| Question | Current Assumption | Owner | Target Resolution |
|----------|--------------------|-------|-------------------|
| Should future special foods clear by cell count instead of instance count? | No for MVP; all clears are instance-count based. | Game Design | Post-MVP only. |
| Should rescan after wave be removed for performance? | Keep it; 6x8 board cost is tiny and correctness is clearer. | Technical | During implementation profiling. |
| Should clear group ordering be sorted for deterministic animation? | Yes, sort by type then top-left instance coordinate for output stability. | Feedback / QA | Before Feedback Layer implementation. |
