# Interaction Pattern Library

> **Status**: Initialized
> **Author**: Codex ux-designer
> **Last Updated**: 2026-06-22
> **Template**: Interaction Pattern Library
> **Source**: `design/gdd/fridge-overflow-game-concept.md`, MVP GDDs, Art Bible v1.0

## Overview

This library defines the reusable interaction patterns for 《冰箱爆仓了》. MVP is mobile-first and uses single-finger drag, compact HUD feedback, and fast restart.

## Pattern Catalog

| Pattern | Category | One-Line Description |
|---------|----------|----------------------|
| Single Active Drag | Input | One pointer controls the current food; extra pointers are ignored. |
| Footprint Preview | Feedback | Legal and illegal target cells preview the full food shape before release. |
| Invalid Release Return | Feedback | Releasing outside a legal footprint returns the food to the conveyor quickly. |
| Resolution Lock | State | Clear animation locks input while logic has already freed cells. |
| Pressure Meter Escalation | Data Display | Pressure communicates safety, warning, and fatal danger without color-only cues. |
| Pending Slot Counter | Data Display | Missed food fills three visible slots before failure. |
| Compact Difficulty Cue | Data Display | Difficulty is shown as a small non-modal cue, not a blocking banner. |
| Result Rescue Story | Result | Game over card explains score, index, death cause, and shareable title. |
| Instant Restart | Navigation | Restart returns directly to a fresh run without a menu. |

## Patterns

### Single Active Drag

**Category**: Input
**Used In**: Core gameplay HUD

Only the current food can be dragged. The first pointer that starts on the current food becomes `activePointerId`; move/release/cancel from other pointers are ignored.

Specification:

- Pickup records the pointer offset relative to the food's top-left.
- Drag ghost follows that offset to avoid a visible jump.
- Page scrolling is suppressed only while active dragging is in progress.
- `pointercancel`, page blur, and orientation change cancel drag and return the food to the conveyor without counting as a miss.

### Footprint Preview

**Category**: Feedback
**Used In**: Core gameplay HUD

During drag, the board previews the full target footprint derived from the ghost top-left grid coordinate.

Specification:

- Legal preview uses cyan/green fill plus solid outline.
- Illegal preview uses red plus diagonal hatch or shake.
- Preview must show every occupied footprint cell, not only the anchor cell.
- Preview is updated through animation-frame batching, not synchronous layout work on every pointer event.

### Invalid Release Return

**Category**: Feedback
**Used In**: Core gameplay HUD

If release is illegal or outside the board, the current food returns to the conveyor in `<=150ms`; the timer continues.

Specification:

- The release does not consume pending capacity.
- A short invalid cue may play, but it must not hide the board.
- Repeated invalid releases should remain readable without feeling like a modal error.

### Resolution Lock

**Category**: State
**Used In**: Session Runtime, HUD, Feedback Layer

When a valid placement triggers clear resolution, gameplay input is locked while visual feedback plays. Logic has already freed cells before the next spawn decision.

Specification:

- HUD may show a short clearing state.
- Timer is paused during the lock.
- Delayed callbacks must carry `runId` and cannot mutate a restarted run.

### Pressure Meter Escalation

**Category**: Data Display
**Used In**: HUD

The pressure meter communicates danger as a rising appliance failure state.

Specification:

- Safe: cool fill, calm label.
- Warning: stronger border/icon and warmer fill.
- Critical: red plus pattern/icon/pulse; never red alone.
- Fatal: enters GameOver; meter no longer accepts live updates.

### Pending Slot Counter

**Category**: Data Display
**Used In**: HUD

Missed food fills three visible slots. The third filled slot causes failure.

Specification:

- Use three slots or pips rather than a bare number.
- Filled slots should remain visible while dragging.
- Slot fill animation must be short and must not delay the next spawn.

### Compact Difficulty Cue

**Category**: Data Display
**Used In**: HUD

Difficulty may show display level and active food type count in compact text.

Specification:

- It must not expose raw RNG weights or internal profile names.
- First appearance of pot or fish may get a non-modal cue shorter than `1s`.
- The cue never pauses gameplay or covers the board.

### Result Rescue Story

**Category**: Result
**Used In**: Result card

The result card turns failure into a shareable story: score, management index, title, death cause, survival time, cleared count, and restart/share.

Specification:

- Title and management index are visually dominant.
- Failure cause is specific and funny but still accurate.
- Restart is the primary action.
- Share/export must have a fallback if browser share APIs are unavailable.

### Instant Restart

**Category**: Navigation
**Used In**: Result card

Restart starts a new session immediately after GameOver.

Specification:

- Result state clears before the new run snapshot renders.
- Storage failure cannot block restart.
- Accidental double-tap should not produce two active sessions.

## Gaps & Patterns Needed

- Share/export fallback pattern should be expanded if result image sharing enters MVP.
- Settings/reduced-motion pattern should be expanded before a settings screen exists.
- Main menu/pause pattern can remain minimal until those screens are scoped.

## Open Questions

- Whether player-facing difficulty should show both level and active type count in the final UI, or keep active type count debug-only.
- Whether share action exports an image, text summary, or both.
