# Food Config

> **Status**: Approved
> **Author**: Fox + Codex agents
> **Last Updated**: 2026-06-21
> **Implements Pillar**: 形状制造戏剧; 一眼看懂冰箱要爆

## Overview

Food Config 是《冰箱爆仓了》的食物数据源，负责定义每种 MVP 食物的 `type`、显示名称、矩形 footprint、解锁时间、生成权重入口、识别标签和玩法角色。它必须同时服务两个目标：让 Board Model、RNG、Clear Resolver 和 Pressure 等系统拿到稳定一致的数据；也让玩家一眼看懂“这个食物有多占地方、会制造什么空间压力”。MVP 食物总量锁定为 7 种，开局启用 5 种，并在 20 秒、40 秒逐步加入大件来制造后期压力。

## Player Fantasy

Food Config 的玩家幻想是“每个食物一出现，我就立刻知道它会惹什么麻烦”。奶茶和剩菜盒应该让玩家觉得可以填缝和救急；鸡蛋盒、披萨盒、年货礼盒开始制造方向性空间选择；汤锅和冻鱼则应该让玩家一眼紧张，意识到必须提前留出大块或横向空间。这个系统不直接产生操作，但它决定了食物是否有生活感、是否容易识别、以及形状压力是否足够戏剧化。

## Detailed Design

### Core Rules

1. Food Config owns the canonical MVP food list. No gameplay system may invent food types outside this list.
2. Each food config entry must define:
   - `type`
   - `displayName`
   - `w`
   - `h`
   - `unlockAtSeconds`
   - `role`
   - `recognitionTags`
   - `pressureProfile`
3. `type` is the stable logic id used by RNG, Clear Resolver, scoring, tests, and telemetry.
4. `displayName` is player-facing Chinese text.
5. `w` and `h` must match Board Model's approved rectangular footprints.
6. MVP foods are locked to 7 types:

| Type | Display Name | Footprint | Unlock | Role | Pressure Profile |
|------|--------------|-----------|--------|------|------------------|
| `tea` | 奶茶 | `1x1` | `0s` | 小件填缝和早期教学 | Low |
| `leftover` | 剩菜盒 | `1x1` | `0s` | 小件填缝和早期教学 | Low |
| `egg` | 鸡蛋盒 | `2x1` | `0s` | 横向轻压力 | Medium |
| `pizza` | 披萨盒 | `2x1` | `0s` | 横向轻压力 | Medium |
| `gift` | 年货礼盒 | `1x2` | `0s` | 纵向轻压力 | Medium |
| `pot` | 汤锅 | `2x2` | `20s` | 第一个大件压力 | High |
| `fish` | 冻鱼 | `3x1` | `40s` | 横向空间压力 | High |

7. Food Config does not decide the next spawned food. It exposes food definitions and weight tables to RNG / Difficulty Scheduler.
8. Food Config does not decide placement legality. Board Model owns footprint legality.
9. Food Config does not decide clearing. Clear Resolver owns match and connected-component logic.
10. Food Config must preserve visual recognition intent: each type needs a distinct silhouette/color direction for later Visual Asset Spec.
11. Food Config values are data constants for MVP. Runtime systems may read them but must not mutate them during a session.

### States and Transitions

| State | Entry Condition | Exit Condition | Behavior |
|-------|-----------------|----------------|----------|
| Config Unloaded | Page/app not initialized | Config file/module loaded | No food data available |
| Config Loaded | Food definitions parsed | Validation begins | Raw entries exist but are not yet trusted |
| Config Validated | All entries pass schema and Board Model footprint checks | Session start | Food list is safe for gameplay systems |
| Runtime Read-Only | Session is active | Session ends or restart reloads config | Systems may read definitions; no mutation allowed |
| Config Invalid | Schema, duplicate type, or illegal footprint detected | Fixed before release | Game must fail fast in development/test builds |

Food Config should normally reach `Runtime Read-Only` before the first food is spawned.

### Interactions with Other Systems

| System | Direction | Interface |
|--------|-----------|-----------|
| Board Model | Food Config conforms to Board Model | Every `w,h` must be one of Board Model's valid rectangular footprints |
| RNG / Difficulty Scheduler | Consumes Food Config | Reads `type`, `unlockAtSeconds`, and weight entries |
| Clear Resolver | Consumes Food Config | Uses `type` identity to group same-type food |
| Pressure / Pending System | Consumes Food Config | Uses `w,h` and unlocked food profile to evaluate no-space pressure |
| Session Runtime | Consumes Food Config | Requests available food definitions at spawn time |
| Visual Asset Spec | Consumes Food Config | Uses `displayName`, role, footprint, and recognition tags to define icons |
| Smoke Test Harness | Consumes Food Config | Validates all expected food ids, shapes, unlocks, and weights |

## Formulas

Food Config formulas define static validation and availability. They do not perform random selection, difficulty progression, anti-streak correction, or weighted pool expansion.

### `foodArea`

The `foodArea` formula is defined as:

`foodArea(food) = food.w * food.h`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Food width | `food.w` | int | `{1,2,3}` | Footprint width from Food Config |
| Food height | `food.h` | int | `{1,2}` | Footprint height from Food Config |

**Output Range:** `1..4` for MVP foods.
**Example:** `foodArea(pot) = 2 * 2 = 4`.

### `isFootprintAllowed`

The `isFootprintAllowed` formula is defined as:

`isFootprintAllowed(food) = (food.w, food.h) in BoardModel.validFootprints`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Footprint pair | `(food.w, food.h)` | tuple<int,int> | ordered pair | Shape dimensions; `(2,1)` and `(1,2)` are different |
| Valid footprints | `BoardModel.validFootprints` | set | `{(1,1),(2,1),(1,2),(2,2),(3,1)}` | Source of truth owned by Board Model |

**Output Range:** Boolean.
**Example:** `egg (2,1) = true`; rotated fish `(1,3) = false`.

### `isUnlocked`

The `isUnlocked` formula is defined as:

`isUnlocked(food, elapsedSeconds) = elapsedSeconds >= food.unlockAtSeconds`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Food unlock time | `food.unlockAtSeconds` | int seconds | `{0,20,40}` in MVP | Time when this food becomes available |
| Elapsed seconds | `elapsedSeconds` | float seconds | `>= 0` | Runtime session timer; negative input is invalid |

**Output Range:** Boolean.
**Example:** At `25s`, `pot` is unlocked and `fish` is not.

### `availableFoods`

The `availableFoods` formula is defined as:

`availableFoods(elapsedSeconds) = {food in allFoods | isUnlocked(food, elapsedSeconds)}`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| All foods | `allFoods` | set | 7 MVP food configs | Canonical Food Config list |
| Elapsed seconds | `elapsedSeconds` | float seconds | `>= 0` | Runtime session timer |

**Output Range:** Set of food configs. With valid MVP config, size is `5..7`.
**Example:** `availableFoods(0s)` returns `tea,leftover,egg,pizza,gift`; `availableFoods(40s)` returns all 7 foods.

### `configWeight`

The `configWeight` interface is defined as:

`configWeight(food, difficultyProfile) = configured nonnegative integer weight for food.type in the requested profile, or 0 if absent`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Food type | `food.type` | enum | `tea,leftover,egg,pizza,gift,pot,fish` | Stable logic id |
| Difficulty profile | `difficultyProfile` | external profile id | Owned by RNG / Difficulty Scheduler | Difficulty context asking for a weight |
| Configured weight | `weight` | int | `0..100` | Query result; `0` means not eligible through this weight profile |

**Output Range:** Integer `0..100`.
**Example:** Missing weight returns `0`, but this does not override `isUnlocked`; unlock and weighting are separate gates.

Ownership boundary: Food Config exposes `configWeight` as a data lookup contract only. Difficulty levels, concrete per-level weight tables, anti-streak, fallback behavior, and weighted random selection belong to `RNG / Difficulty Scheduler`.

## Edge Cases

- **If a food entry is missing `type`**: config validation fails; no runtime system may use the config.
- **If two food entries share the same `type`**: config validation fails; `type` must be unique across all MVP foods.
- **If a food `type` is outside the MVP enum**: config validation fails unless the systems index and all dependent systems are revised.
- **If `displayName` is empty or not localized for the current language**: development validation warns; MVP may fall back to the Chinese `displayName`, but shipping builds should not show blank names.
- **If `(w,h)` is not in `BoardModel.validFootprints`**: config validation fails; Food Config must not silently rotate or reshape the food.
- **If `unlockAtSeconds` is negative or non-numeric**: config validation fails.
- **If `elapsedSeconds` passed to `isUnlocked` or `availableFoods` is negative**: treat it as invalid input in tests; runtime callers should clamp session time before calling Food Config.
- **If all foods are locked due to bad unlock data**: config validation fails because MVP must expose 5 foods at `0s`.
- **If a configured weight is missing for a difficulty profile**: `configWeight` returns `0`; this does not mean the food is locked, only that the requesting profile gives it zero spawn weight.
- **If a configured weight is negative, fractional, or above `100`**: config validation fails.
- **If `pressureProfile` is missing**: config validation fails; downstream systems need this for readable risk labeling and tuning.
- **If `recognitionTags` are missing or duplicate another food too closely**: development validation warns; Visual Asset Spec must resolve the recognition conflict before production art.
- **If post-MVP wants rotation or non-rectangular food**: do not add it only in Food Config; first revise Board Model and downstream systems.
- **If a runtime system attempts to mutate Food Config during a session**: reject the mutation; Food Config is read-only after validation.

## Dependencies

Food Config has one hard upstream design constraint: Board Model owns the legal footprint set. Food Config must conform to it but must not redefine it.

| System | Direction | Nature of Dependency |
|--------|-----------|----------------------|
| Board Model | Food Config depends on Board Model | Uses `BoardModel.validFootprints` to validate `w,h`; does not own placement legality |
| RNG / Difficulty Scheduler | Depends on Food Config | Reads food ids, unlock gates, and weight lookup contract; owns actual difficulty tables and random selection |
| Clear Resolver | Depends on Food Config | Uses `type` to determine same-type grouping; does not read display names or visual tags |
| Pressure / Pending System | Depends on Food Config | Uses `w,h`, unlock state, and pressure profile labels to reason about shape pressure |
| Session Runtime | Depends on Food Config | Requests available food definitions before spawning current food |
| Scoring / Result Rules | Depends on Food Config | May use `displayName`, `type`, and role labels for result text and death reasons |
| Visual Asset Spec | Depends on Food Config | Uses display names, silhouettes, footprint, and recognition tags to define food icons |
| Smoke Test Harness | Depends on Food Config | Validates the exact 7 MVP ids, footprints, unlock times, and config validation failures |

Dependency notes:

- Food Config must be loaded and validated before RNG, Session Runtime, Clear Resolver, or Pressure consume it.
- Downstream systems may cache read-only food definitions for a session, but must not mutate them.
- Any change to `type`, footprint, unlock time, or the 7-food MVP set requires re-checking RNG / Difficulty, Clear Resolver, Pressure, Visual Asset Spec, and Smoke Test Harness.

## Tuning Knobs

Food Config tuning should stay conservative. It may tune identity, unlock gates, labels, and spawn-weight inputs, but it must not tune board legality, random selection, or pressure formulas.

| Parameter | Current Value | Safe Range | Effect of Increase | Effect of Decrease |
|-----------|---------------|------------|--------------------|--------------------|
| `mvpFoodCount` | `7` | `7` for MVP | More food increases recognition load and QA matrix | Fewer food types reduce variety and weaken late-game pressure |
| `initialFoodCount` | `5` | `5` for MVP | More starting types raises early cognitive load | Fewer starting types makes the opening too repetitive |
| `pot.unlockAtSeconds` | `20` | `15..30` | Later pot delays first major shape pressure | Earlier pot increases early failure risk |
| `fish.unlockAtSeconds` | `40` | `30..50` | Later fish delays horizontal-space tension | Earlier fish can feel unfair before players learn spacing |
| `weightInputMax` | `100` | `1..100` | Higher max gives Difficulty Scheduler finer granularity | Lower max makes weight profiles coarse |
| `recognitionTags` | Per food | At least 2 tags per food | More tags help asset direction but can become noisy | Fewer tags increase visual ambiguity |
| `pressureProfile` | `Low/Medium/High` | Locked labels for MVP | More profile levels may overfit tuning | Fewer levels lose useful risk labeling |

Locked constants:

- Food `type` ids are locked after dependent systems reference them.
- `w,h` footprints are locked to Board Model valid footprints.
- `tea`, `leftover`, `egg`, `pizza`, and `gift` unlock at `0s` for MVP onboarding.
- Food Config must not tune actual spawn probability directly; RNG / Difficulty Scheduler owns concrete per-level weights and random selection.

## Visual/Audio Requirements

Food Config does not create final art or audio assets, but it must provide enough recognition direction for Visual Asset Spec and Feedback Layer to keep every food readable at mobile size.

| Food Type | Visual Recognition Tags | Silhouette Requirement | Audio Direction | Priority |
|-----------|-------------------------|------------------------|-----------------|----------|
| `tea` | cup, straw, round lid, warm drink color | Small round/vertical cup shape distinct from square leftover | Light plastic cup tap | Medium |
| `leftover` | square box, lid, label, leftovers | Small square container distinct from tea cup | Soft plastic box thud | Medium |
| `egg` | egg carton, row, pale yellow/cream | Horizontal `2x1` rectangle with repeated egg bumps | Light carton tap | Medium |
| `pizza` | flat box, red/orange, slice mark | Horizontal `2x1` flat box distinct from egg carton | Cardboard slide | Medium |
| `gift` | tall box, ribbon, festive red/gold | Vertical `1x2` shape with strong ribbon cue | Wrapped box knock | Medium |
| `pot` | round pot, handles, dark rim, soup | Large `2x2` bulky silhouette with handles | Heavy pot clunk | High |
| `fish` | long fish, tail, icy blue, frozen wrap | Long `3x1` horizontal silhouette; must not read as pizza | Frozen slap / icy slide | High |

Global requirements:

- Every food must be identifiable at `390x844` gameplay size.
- Each food must have a unique silhouette, not only a unique color.
- Shape and recognition tags must align with `w,h`; visuals must not imply rotation or a different footprint.
- Audio is directional only here. Actual sound event timing belongs to Feedback Layer / Audio.

## UI Requirements

Food Config has no standalone UI screen, but it supplies player-facing labels and metadata that UI systems must consume consistently.

| Information | Display Location | Update Frequency | Condition |
|-------------|------------------|------------------|-----------|
| `displayName` | Result card, debug overlay, future collection UI | Static per food type | Used when naming cleared food, waste, or death reason |
| Food icon key | Conveyor, board item, result card, future collection UI | Static per food type | Must map 1:1 with `type` |
| Footprint `w,h` | Debug overlay / QA tooling | Static per food type | Not required in normal player HUD |
| `unlockAtSeconds` | Optional debug overlay / tutorial tuning view | Static per food type | Not shown to normal players in MVP |
| `pressureProfile` | Debug overlay, tuning tools, possible danger hints | Static per food type | Normal HUD should show pressure state, not raw profile text |
| Recognition tags | Visual Asset Spec / internal tools | Static per food type | Not shown to players |

UI constraints:

- UI must never display a food with a label/icon that does not match its `type`.
- Normal gameplay UI should rely on icon silhouette first, not text labels.
- Debug UI may expose `type`, `w,h`, unlock time, and weight lookup results for QA.
- Food Config does not own layout, animation, tooltip behavior, or result-card copywriting.

## Acceptance Criteria

- **GIVEN** Food Config is validated, **WHEN** the canonical food list is loaded, **THEN** it contains exactly `7` food entries with unique `type` values: `tea`, `leftover`, `egg`, `pizza`, `gift`, `pot`, and `fish`.
- **GIVEN** any MVP food entry, **WHEN** schema validation runs, **THEN** `type`, `displayName`, `w`, `h`, `unlockAtSeconds`, `role`, `recognitionTags`, and `pressureProfile` are present.
- **GIVEN** the canonical MVP food list, **WHEN** footprint validation runs, **THEN** every `(w,h)` ordered pair exists in `BoardModel.validFootprints`.
- **GIVEN** `egg` or `pizza`, **WHEN** footprint validation runs, **THEN** `(w,h)` is `(2,1)` and not `(1,2)`.
- **GIVEN** `gift`, **WHEN** footprint validation runs, **THEN** `(w,h)` is `(1,2)` and not `(2,1)`.
- **GIVEN** `fish`, **WHEN** footprint validation runs, **THEN** `(w,h)` is `(3,1)` and no rotation entry exists.
- **GIVEN** `pot`, **WHEN** `foodArea(pot)` is evaluated, **THEN** the result is `4`.
- **GIVEN** `tea` and `leftover`, **WHEN** `foodArea` is evaluated, **THEN** each result is `1`.
- **GIVEN** `elapsedSeconds = 0`, **WHEN** `availableFoods(0)` is evaluated, **THEN** it returns exactly `tea`, `leftover`, `egg`, `pizza`, and `gift`.
- **GIVEN** `elapsedSeconds = 19.99`, **WHEN** `availableFoods(19.99)` is evaluated, **THEN** `pot` and `fish` are not included.
- **GIVEN** `elapsedSeconds = 20`, **WHEN** `availableFoods(20)` is evaluated, **THEN** `pot` is included and `fish` is not included.
- **GIVEN** `elapsedSeconds = 40`, **WHEN** `availableFoods(40)` is evaluated, **THEN** all 7 MVP foods are included.
- **GIVEN** negative `elapsedSeconds`, **WHEN** `isUnlocked` or `availableFoods` is called in tests, **THEN** the input is treated as invalid and no normal food availability result is accepted.
- **GIVEN** a duplicate `type`, missing `type`, or `type` outside the MVP enum, **WHEN** validation runs, **THEN** Food Config validation fails.
- **GIVEN** a footprint outside `BoardModel.validFootprints`, **WHEN** validation runs, **THEN** validation fails and Food Config does not silently rotate or reshape the food.
- **GIVEN** a missing configured weight for a requested difficulty profile, **WHEN** `configWeight(food, difficultyProfile)` is called, **THEN** it returns `0`.
- **GIVEN** a configured weight below `0`, above `100`, or not an integer, **WHEN** validation runs, **THEN** validation fails.
- **GIVEN** a food is locked by `unlockAtSeconds`, **WHEN** `configWeight` returns a nonzero value for that type, **THEN** Food Config still reports unlock state separately; weighting does not override unlock gating.
- **GIVEN** Food Config is in `Runtime Read-Only`, **WHEN** any runtime system attempts to mutate a food entry, **THEN** the mutation is rejected or ignored and the validated config remains unchanged.
- **GIVEN** Board Model consumes Food Config dimensions, **WHEN** a food definition is passed to Board Model, **THEN** its `w,h` pair matches Board Model's allowed footprint contract.
- **GIVEN** RNG / Difficulty Scheduler consumes Food Config, **WHEN** it requests food ids, unlock data, or `configWeight`, **THEN** Food Config provides data only and does not perform random selection, anti-streak, fallback behavior, or weighted pool expansion.
- **GIVEN** Clear Resolver consumes Food Config, **WHEN** it compares food for matching, **THEN** it uses `type` identity and does not depend on `displayName`, icon key, or recognition tags.
- **GIVEN** Visual Asset Spec consumes Food Config, **WHEN** it generates food icon requirements, **THEN** every food has recognition tags and silhouette guidance sufficient to distinguish it from the other 6 foods at mobile gameplay size.
- **GIVEN** UI consumes Food Config, **WHEN** it displays a food icon or label, **THEN** the icon key and `displayName` map 1:1 to the same `type`.

## Open Questions

| Question | Owner | Deadline | Resolution |
|----------|-------|----------|------------|
| Should Food Config store concrete per-level spawn weights, or should all weight tables live only in RNG / Difficulty Scheduler? | Systems Designer | Before RNG / Difficulty Scheduler GDD | Current decision: Food Config exposes only `configWeight` lookup contract; concrete tables belong to RNG / Difficulty. |
| Should `recognitionTags` become localized player-facing collection text later? | UX Designer | Before Collection / Themes design | MVP treats recognition tags as internal asset/spec metadata only. |
| Should post-MVP foods expand beyond 7 types? | Game Designer | Before Full H5 content expansion | MVP locks 7 types. New food requires Board Model, RNG, Clear Resolver, Pressure, Visual Asset Spec, and Smoke Test review. |
