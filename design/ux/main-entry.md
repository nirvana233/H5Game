# UX Spec: Main Entry

> **Status**: Approved
> **Author**: Codex ux-designer
> **Last Updated**: 2026-06-22
> **Platform Target**: Mobile Web / Browser

## Purpose & Player Need

The player arrives wanting to play immediately. The entry screen is the playable HUD itself; no marketing or menu screen blocks the first drag.

## Player Context On Arrival

The player opens `games/fridge-overflow/index.html` from the H5 collection and should see score, board, current food, timer, pressure, pending slots, and restart control without scrolling.

## Navigation Position

Collection -> `games/fridge-overflow/` -> playable screen.

## Entry & Exit Points

| Entry Source | Trigger | Context |
|--------------|---------|---------|
| H5 collection | link/open file | fresh run |
| Result card | restart | new run |

| Exit Destination | Trigger | Notes |
|------------------|---------|-------|
| Result card | overflow failure | run ends |
| Fresh run | restart | clears prior result |

## Layout Specification

The playable screen uses the HUD layout defined in `design/ux/hud.md`. Entry has no separate overlay.

## States & Variants

| State | Trigger | What Changes |
|-------|---------|--------------|
| Fresh run | page load | score and pressure reset, first food spawned |
| Returning player | local best exists | best score chip shows stored value |
| Storage blocked | browser rejects storage | best falls back to zero; gameplay continues |

## Interaction Map

| Component | Action | Feedback | Outcome |
|-----------|--------|----------|---------|
| Current food | drag | ghost follows pointer | preview updates |
| Restart | tap/click | button press | new run |

## Data Requirements

| Data | Source System | Read / Write | Notes |
|------|---------------|--------------|-------|
| Best score | Storage Adapter | Read | optional |
| Run state | Session Runtime | Read | live HUD |

## Accessibility

No hover-only entry controls. Restart is focusable. First action is touch-compatible.

## Acceptance Criteria

- [ ] Opening `games/fridge-overflow/index.html` shows playable board without a menu.
- [ ] First food is draggable without setup.
- [ ] Best score failure does not block play.
- [ ] Restart is reachable by touch and keyboard focus.
- [ ] No content overlaps on `390x844`.
