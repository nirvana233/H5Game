# Visual Asset Spec

> **Status**: Approved
> **Author**: Fox + Codex agents
> **Last Updated**: 2026-06-22
> **Implements Pillar**: 一眼看懂冰箱要爆; 形状制造戏剧; 失败也好笑

## Overview

Visual Asset Spec 是《冰箱爆仓了》的 MVP 美术资产规格系统，负责定义食物图标、冰箱网格、压力条、待处理槽、拖拽预览、清除反馈、结果卡和分享视觉所需的资产清单、命名、尺寸、识别要求与生产边界。它不生成玩法规则，也不替代 Art Bible；它把 Food Config、Gameplay HUD / Result UI 和 Feedback Layer 的需求整理成可执行的资产规格，确保玩家一眼看懂每种食物的形状、占格和危险。

## Player Fantasy

玩家幻想是“这些食物像真实生活里的东西，而且一看就知道占多大地方”。奶茶、剩菜盒、鸡蛋盒、披萨盒、年货礼盒、汤锅、冻鱼必须有清楚轮廓和差异，不靠文字才能识别。视觉资产还要让爆仓、清除、压力回落和失败死因有生活梗，支撑截图传播。

## Detailed Design

### Core Rules

1. Visual Asset Spec owns asset requirements, not final gameplay rules.
2. MVP must define all 7 Food Config types的视觉识别规格。
3. 每个食物资产必须清楚表达 footprint 方向和尺寸。
4. `1x1`, `2x1`, `1x2`, `2x2`, `3x1` 必须在网格中可读。
5. 食物图标应使用生活化、可爱、扁平高识别风格，避免写实噪声。
6. Legal/illegal preview must include non-color distinction.
7. Pressure and pending assets must communicate danger without covering the board.
8. Result card must support screenshot/share composition.
9. Assets should be optimized for mobile web file size and quick load.
10. Asset names must be stable and derived from type/purpose/state.
11. All assets must have fallback CSS/shape treatment if bitmap loading fails.
12. Asset production should follow Art Bible when that document exists; until then, this GDD provides MVP working constraints.

### States and Transitions

| State | Entry Condition | Exit Condition | Behavior |
|-------|-----------------|----------------|----------|
| `SpecDrafted` | GDD complete | Art Bible approved or production starts | Defines required assets and constraints |
| `AwaitingArtBible` | Art Bible missing | Art Bible created | Uses provisional style direction |
| `AssetPromptReady` | Asset list stable | Asset generation starts | Per-asset prompts/specs can be produced |
| `AssetIntegrated` | Assets imported | Asset audit passes | UI/feedback consumes assets |
| `AssetNeedsRevision` | Asset fails readability/performance | Revised asset passes | Rework unclear or oversized assets |

| From | Trigger | Guard | To | Required Side Effects |
|------|---------|-------|----|-----------------------|
| `SpecDrafted` | Art Bible approved | Style rules available | `AssetPromptReady` | Align prompts/specs to Art Bible |
| `AssetPromptReady` | Generate/import assets | Required assets exist | `AssetIntegrated` | Link assets to Food Config/UI specs |
| `AssetIntegrated` | Audit failure | Missing/unclear/oversized asset | `AssetNeedsRevision` | Record fix needed |
| `AssetNeedsRevision` | Revision complete | Audit pass | `AssetIntegrated` | Update asset reference |

### Interactions with Other Systems

| System | Direction | Interface Contract |
|--------|-----------|--------------------|
| Food Config | Asset spec consumes food definitions | Uses `type`, display name, footprint, role, recognition tags. |
| Gameplay HUD / Result UI | Asset spec supplies UI assets | Board, HUD icons, pressure/pending, result card treatments. |
| Feedback Layer | Asset spec supplies feedback assets | Preview styles, clear flashes, warning accents. |
| Input Adapter | Asset spec supports drag visuals | Current food and ghost must preserve readable footprint. |
| Scoring / Result Rules | Asset spec supports result text | Result card layout and badge/tier assets. |
| Storage | Optional consumer | Themes or settings later may reference asset ids. |
| Smoke Test Harness | Verification consumer | Can check asset existence/naming and basic dimensions. |

## Formulas

### `assetId`

The `assetId` formula is defined as:

`assetId(system, type, state) = kebabCase(system + "-" + type + "-" + state)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| System | `system` | string | asset category | `food`, `hud`, `feedback`, `result` |
| Type | `type` | string | food or component id | Stable source id |
| State | `state` | string | visual state | `idle`, `drag`, `legal`, `illegal`, etc. |

**Output Range:** Stable kebab-case asset id.
**Example:** `assetId(food, pot, idle) = food-pot-idle`.

### `gridAssetBox`

The `gridAssetBox` formula is defined as:

`gridAssetBox(food, cellPx) = {widthPx: food.w * cellPx, heightPx: food.h * cellPx}`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Food width | `food.w` | int | `1..3` | Footprint width |
| Food height | `food.h` | int | `1..2` | Footprint height |
| Cell size | `cellPx` | float px | responsive | Rendered grid cell size |

**Output Range:** Pixel box matching footprint.
**Example:** `fish 3x1` at `48px` cell uses `144x48px`.

### `readabilityMinSize`

The `readabilityMinSize` formula is defined as:

`readabilityMinSize(cellPx) = max(32px, cellPx * 0.72)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Cell size | `cellPx` | float px | responsive | Current rendered grid cell |

**Output Range:** Minimum recognizable visual detail size.
**Example:** `cellPx=44` gives minimum `32px`.

### `assetBudget`

The `assetBudget` formula is defined as:

`assetBudget(assetKind) = target file size budget by kind`

**Variables:**

| Asset Kind | Target Budget | Description |
|------------|---------------|-------------|
| Food icon | `<=20KB` each | Optimized WebP/PNG/SVG as appropriate |
| HUD icon | `<=10KB` each | Simple UI symbol |
| Result card decoration | `<=80KB` total | Shareable but lightweight |
| Feedback sprite/texture | `<=40KB` total | Optional; CSS fallback allowed |

**Output Range:** File size budget per asset category.
**Example:** Seven food icons should target `<=140KB` total.

## Edge Cases

- **If a food icon is visually ambiguous with another type**: asset fails spec and must be revised before production.
- **If a multi-cell food does not clearly show its footprint direction**: asset fails spec.
- **If bitmap asset fails to load**: UI must fall back to labeled shape/block treatment.
- **If color-blind player cannot distinguish legal/illegal preview**: preview spec fails; add pattern/outline distinction.
- **If asset size exceeds budget**: optimize or replace before release.
- **If Art Bible later contradicts provisional colors/style**: Art Bible wins; update this spec accordingly.
- **If a result card is too text-heavy for mobile screenshot**: shorten text and prioritize title/index/death reason.
- **If low-end device struggles with feedback assets**: use CSS/simple vector fallback.

## Dependencies

| Dependency | Type | Contract |
|------------|------|----------|
| Food Config | Hard | Source of food list, names, footprints. |
| Gameplay HUD / Result UI | Hard | Source of UI asset needs. |
| Feedback Layer | Hard | Source of feedback asset needs. |
| Scoring / Result Rules | Soft | Source of result titles/tier needs. |
| Input Adapter | Soft | Source of drag ghost/preview needs. |
| Smoke Test Harness | Downstream | Can validate asset presence and naming. |
| Art Bible | Future hard | Final style authority once authored. |

## Tuning Knobs

| Knob | Current Value | Safe Range | Effect |
|------|---------------|------------|--------|
| `foodIconBudgetKb` | `20KB` | `10..35KB` | Controls load speed vs detail. |
| `resultDecorationBudgetKb` | `80KB` | `40..140KB` | Controls share card richness. |
| `minReadableDetailPx` | `32px` | `28..40px` | Minimum food detail on mobile. |
| `previewPatternOpacity` | `0.35` | `0.2..0.6` | Illegal/legal non-color cue readability. |
| `fallbackLabelsEnabled` | `true` | MVP locked | Ensures playability if assets fail. |

## Visual/Audio Requirements

Required MVP visual assets:

| Asset | Required States | Notes |
|-------|-----------------|-------|
| `tea` 奶茶 | idle/drag | `1x1`, cup silhouette, straw/lid readable |
| `leftover` 剩菜盒 | idle/drag | `1x1`, square container distinct from egg/pizza |
| `egg` 鸡蛋盒 | idle/drag | `2x1`, carton cells visible |
| `pizza` 披萨盒 | idle/drag | `2x1`, flat box, warmer color but not confused with egg |
| `gift` 年货礼盒 | idle/drag | `1x2`, vertical package/ribbon |
| `pot` 汤锅 | idle/drag | `2x2`, heavy round/square mass |
| `fish` 冻鱼 | idle/drag | `3x1`, long horizontal silhouette |
| Fridge grid | normal/danger | `6x8`, clear cells and occupied state |
| Legal preview | legal | Full footprint, outline/pattern |
| Illegal preview | illegal | Full footprint, red plus stripe/outline |
| Pressure bar | calm/warn/critical | Readable without color alone |
| Pending slots | empty/filled | 3 slots |
| Result card | tier/death reason | Mobile screenshot composition |

Audio asset specs belong to Audio / Haptics later; MVP may use simple generated UI sounds if scoped.

Asset Spec: This document is the MVP asset spec seed. After Art Bible approval, run `/asset-spec system:Visual Asset Spec` for per-asset prompts.

## UI Requirements

- Food assets must fit grid cells without clipping.
- Multi-cell food assets must align exactly with footprint boxes.
- HUD icons must remain legible on `390x844`.
- Result card must prioritize title, management index, score, and death reason.
- Fallback labels must use Food Config display names or short labels.

UX Flag - Visual Asset Spec: This system has UI requirements and should feed the gameplay HUD/result UX specs.

## Acceptance Criteria

- **GIVEN** all 7 MVP food types, **WHEN** asset checklist runs, **THEN** each type has an idle and drag visual spec.
- **GIVEN** a `3x1` fish at `48px` cell size, **WHEN** grid asset box is calculated, **THEN** it is `144x48px`.
- **GIVEN** legal and illegal preview assets, **WHEN** viewed without color information, **THEN** their outline/pattern treatment remains distinguishable.
- **GIVEN** food icon files are imported, **WHEN** asset audit checks budgets, **THEN** each food icon targets `<=20KB`.
- **GIVEN** bitmap food icon fails to load, **WHEN** UI renders current food, **THEN** fallback labeled footprint remains playable.
- **GIVEN** two food icons are confused in a 390px-wide screenshot, **WHEN** asset review runs, **THEN** at least one icon must be revised.

## Open Questions

| Question | Current Assumption | Owner | Target Resolution |
|----------|--------------------|-------|-------------------|
| Should food icons be bitmap, SVG, or CSS blocks for MVP? | Use simple generated bitmap or SVG-compatible assets with CSS fallback. | Art / Technical | Art Bible + implementation. |
| Is there a final art style yet? | No; provisional playful fridge/food style until Art Bible. | Art Director | Art Bible phase. |
| Should result card include a background illustration? | Lightweight decoration only; no large asset unless performance allows. | UI / Art | Result UI spec. |
