# Art Bible: 冰箱爆仓了

> **Status**: Approved
> **Version**: 1.0
> **Last Updated**: 2026-06-22
> **Source Concept**: `design/gdd/fridge-overflow-game-concept.md`
> **Art Director Sign-Off (AD-ART-BIBLE)**: APPROVED 2026-06-22 - solo/local review

---

## 1. Visual Identity Statement

**One-line rule**: Everything should read as a clean, cold fridge under comic overflow pressure: organized enough to plan, chaotic enough to make the player panic-laugh.

Supporting principles:

- **Readable before cute**: every food item must communicate its footprint at phone size before decorative detail is added.
- **Pressure is physical**: crowding, warning meters, and result copy should make the fridge feel like it is about to fail, not merely show abstract danger.
- **Clear is relief**: successful clears should visually open space, cool the palette, and reduce clutter so the rescue moment is obvious.

Design test: if a screenshot does not show a nearly full fridge, a draggable food shape, and a visible pressure state within one second, the visual direction is failing.

## 2. Mood & Atmosphere

| Game State | Primary Mood | Lighting / Value | Atmosphere Words | Energy |
|------------|--------------|------------------|------------------|--------|
| First launch / early run | clean and approachable | cool whites, pale cyan shadows, high legibility | fresh, tidy, simple, snackable | calm |
| Normal placement | focused sorting | bright fridge interior, medium contrast grid | practical, tactile, clear, responsive | measured |
| Dragging / preview | decision tension | current footprint is high contrast; invalid areas use red plus pattern | precise, urgent, hands-on | active |
| Danger | comic panic | pressure meter warms toward red; fridge edges tighten visually | crowded, compressed, noisy, funny | frantic |
| Clear / rescue | instant relief | white-blue flash, cells visibly open, warning treatment recedes | crisp, satisfying, airy, clean | burst then calm |
| Game over / result | shareable failure story | warm spotlight on result card over subdued fridge | embarrassing, witty, readable, screenshot-friendly | resolved |

## 3. Shape Language

- **Food silhouettes**: simple chunky shapes with clear footprint logic. `1x1` items are compact circles/squares; `2x1` items are horizontal trays; `1x2` items are upright packs; `2x2` pot is a blocky large anchor; `3x1` fish is long and unmistakable.
- **Grid geometry**: fridge board uses straight slots and rounded 6px corners. The grid should feel like a functional appliance, not a fantasy board.
- **UI grammar**: HUD chips are compact rounded rectangles. Danger elements use stronger outlines, striped fills, and icon backup instead of color alone.
- **Hero vs support**: current food, legal preview, pressure meter, pending slots, and clear flash are hero elements. Decorative frost, shelf lines, and result-card garnish stay low contrast.

## 4. Color System

| Role | Color | Usage |
|------|-------|-------|
| Fridge white | `#f8fbff` | main interior, clean empty cells |
| Cool shadow | `#d7e7f5` | shelf separation, inactive grid lines |
| Fresh cyan | `#65c7e8` | legal preview, active UI highlight |
| Food warm | `#ffb347` | high-attention food accents and result badges |
| Pressure red | `#e34848` | overflow danger, invalid preview, final warning |
| Rescue green | `#4fbf7a` | successful clear, pressure drop, safe feedback |
| Ink text | `#1f2a33` | primary readable text |

Semantic rules:

- Red always means danger or illegal placement and must be paired with stripe, shake, icon, or text.
- Green means valid rescue or pressure recovery and must be paired with outline/fill change.
- Blue/cyan means cold appliance UI, legal target, or normal play.
- Food type colors may vary, but same-type identity must rely on icon shape/name as well as color.

Colorblind backup: legal/illegal, pressure danger, and clear success may never be color-only. Use footprint outline, diagonal hatch, meter icon, cell flash, or short text labels.

## 5. Food Asset Direction

MVP food assets should be simple bitmap or CSS-backed icons with consistent outline weight.

| Type | Visual Rule | Readability Requirement |
|------|-------------|-------------------------|
| 奶茶 | cup silhouette with straw | must read as `1x1` |
| 剩菜盒 | square lunch box | must differ from pizza by container shape |
| 鸡蛋盒 | horizontal carton | must read as `2x1` |
| 披萨盒 | flat red/orange box | must read as `2x1` and warmer than egg |
| 年货礼盒 | vertical gift pack | must read as `1x2` |
| 汤锅 | round pot inside square footprint | must feel bulky as `2x2` |
| 冻鱼 | long wrapped fish | must read as `3x1` at a glance |

Production rule: never add tiny labels or details that are required to identify the item; phones must read the silhouette first.

## 6. Environment & Board Direction

The board is the fridge, not a decorative frame. It should occupy the visual center and preserve stable cell geometry across devices.

- Use clear shelf/grid lines and subtle cold gradients.
- Empty space should feel valuable: cleared cells visibly return to clean white-blue.
- Overflow pressure may compress the board visually with edge glow, warning border, or meter intensity, but must not distort coordinates.
- Result card may use humorous spill/overflow decorations only outside the active board.

## 7. UI / HUD Visual Direction

HUD style is restrained and scannable. The player is dragging under time pressure, so live information must be compact.

- Top band: score, difficulty cue, and pressure meter.
- Board: central, largest, always visible.
- Bottom band: current food conveyor, timer, pending slots.
- Result card: screenshot-friendly, with title, management index, score, death reason, cleared count, and restart/share actions.

Typography: use system sans-serif for speed and legibility. Use bold only for score, warning, and result title.

Animation: placement and clear feedback should be punchy and short. Avoid long easing that blocks the next decision.

## 8. Asset Standards

| Asset Kind | Standard |
|------------|----------|
| Food icon | WebP or PNG, target `<=20KB` each, readable at one grid cell |
| HUD icon | SVG or CSS icon, target `<=10KB` each |
| Result decoration | total decorative budget `<=80KB` |
| CSS fallback | every core food may be represented by shape/color CSS if bitmap loading fails |
| Naming | `food-[type].webp`, `ui-[purpose].svg`, `result-[purpose].png` |

Technical constraints:

- Keep first playable load small; no large sprite sheets unless measured.
- CSS transforms are preferred for drag ghost and clear feedback.
- Avoid effects that force repeated layout reads during pointer movement.

## 9. Style Prohibitions

- Do not make the board look like a generic match-3 jewel grid.
- Do not use color-only legal/illegal feedback.
- Do not cover the board with modal banners during active play.
- Do not make food assets realistic photos; the game needs icon-like readability.
- Do not add decorative gradients, particles, or card frames that reduce mobile clarity.
- Do not use a dark cyber/purple visual direction for this game; the core fantasy is bright fridge chaos.
