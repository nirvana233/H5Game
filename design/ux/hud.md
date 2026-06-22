# HUD Design

> **Status**: In Review
> **Author**: Codex ux-designer
> **Last Updated**: 2026-06-22
> **Template**: HUD Design
> **Source GDD**: `design/gdd/gameplay-hud-result-ui.md`

---

## HUD Philosophy

The HUD is compact and always in service of the next placement. It must keep the board, current food, timer, pressure, pending slots, and score visible without scrolling on a common phone viewport.

## Information Architecture

### Full Information Inventory

| Information | Category | Source |
|-------------|----------|--------|
| 6x8 board | Must Show | Board Model / Session Runtime |
| current food footprint | Must Show | Food Config / Session Runtime |
| legal/illegal preview | Contextual | Input Adapter / Board Model |
| conveyor timer | Must Show | Game State Machine / RNG Scheduler |
| pressure meter | Must Show | Pressure / Pending System |
| pending slots | Must Show | Pressure / Pending System |
| live score | Must Show | Scoring / Result Rules |
| clear streak | Contextual | Scoring / Result Rules |
| difficulty cue | Contextual | RNG / Difficulty Scheduler |
| input locked state | Contextual | Game State Machine |
| result card | GameOver only | Scoring / Result Rules / Storage |

### Categorization

Must-show items are board, current food, timer, pressure, pending slots, and score. Streak and difficulty are compact contextual chips. Debug details, raw RNG data, and best score are excluded from live HUD.

## Layout Zones

Mobile-first portrait layout:

```text
+----------------------------------+
| Score chip | Pressure meter | Lv |
+----------------------------------+
|                                  |
|          6 x 8 fridge board      |
|                                  |
+----------------------------------+
| Pending slots | Timer bar        |
| Current food conveyor / drag pad |
+----------------------------------+
```

Rules:

- Board is the largest visual element.
- Current food stays near the bottom thumb zone.
- Pressure and pending remain visible while dragging.
- Result card overlays only after `GameOver`.

## HUD Elements

| Element | Visual Form | Update Behavior | Notes |
|---------|-------------|-----------------|-------|
| Board grid | fixed 6x8 cells | event-driven after placement/clear | never distorted by pressure effects |
| Current food | footprint icon/ghost | live during drag | shape must match occupied cells |
| Timer | horizontal bar or ring | frame/tick driven | should become urgent near expiry |
| Pressure | meter with label/icon | tick/event driven | pattern backup for danger |
| Pending | three slots | on timeout/miss | third slot is fatal |
| Score | compact number chip | on placement/clear | do not animate so much it distracts |
| Streak | small pop/chip | only when `>1` | transient |
| Result card | centered card | GameOver only | restart primary, share secondary |

## Dynamic Behaviors

- Dragging shows footprint preview and keeps live danger visible.
- Valid release enters resolution lock if clears occur.
- Clears flash released cells and reduce pressure treatment.
- High pressure escalates border/meter intensity.
- Timeout fills one pending slot and adds pressure.
- GameOver freezes live HUD and reveals result card after result payload is ready.

## Platform & Input Variants

| Platform | Behavior |
|----------|----------|
| Mobile touch | primary; single active pointer; drag pad near thumb zone |
| Desktop mouse | same pointer model; cursor drag mirrors touch |
| Keyboard | only restart/share focus path required for Basic+ MVP |
| Gamepad | not supported for MVP |

## Accessibility

- Legal/illegal previews use color plus outline/hatch.
- Pressure danger uses icon/pattern/label, not red alone.
- Pending is represented as three slots, not only a number.
- Restart/share buttons meet `44x44px` target and visible focus.
- Result card text wraps and remains readable on `390x844`.
- Reduced-motion setting should suppress shake/pulse once settings exist.

## Acceptance Criteria

- [ ] On `390x844`, board, current food, timer, pressure, pending, and score are visible without scrolling.
- [ ] Legal and illegal previews are distinguishable without relying on color alone.
- [ ] Input locked state is visible during clear resolution.
- [ ] GameOver result card shows score, management index, title, failure reason, survival time, cleared count, restart, and share/fallback action.
- [ ] Restart from result starts exactly one fresh run and clears old result state.
- [ ] Storage save failure does not prevent result card display or restart.

## Open Questions

- Final visual treatment for result sharing image/export is deferred until Share / Export enters scope.
- Best score placement remains result-card secondary row unless later UX review changes it.
