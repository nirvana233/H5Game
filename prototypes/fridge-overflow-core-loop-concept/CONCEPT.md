---
status: reverse-documented
source: prototypes/fridge-overflow-core-loop-concept/
date: 2026-06-22
verified-by: prototype report and local inspection
---

# Prototype Concept: 冰箱爆仓了 Core Loop

> **Note**: This document summarizes the existing concept prototype and `REPORT.md`.

## Prototype Question

If the player drags shaped food into a `6x8` fridge grid and clears adjacent groups of three matching foods, does the conveyor create readable pressure and satisfying rescue moments?

## Core Fantasy

The player is the last organizer of a chaotic fridge, trying to fit incoming food just long enough to trigger a lifesaving clear before the fridge bursts.

## Implemented Mechanics

- `6x8` fridge grid.
- Drag-and-drop shaped food.
- Seven food types, with five active at start.
- Timed conveyor pressure.
- Same-type adjacent `3+` instance clear.
- Pending overflow and pressure overflow failure.
- Score, combo, active type count, result card, and restart.
- Progressive difficulty: pot unlock, fish unlock, late timer and pressure ramp.

## Validated Result

Verdict: PROCEED.

The prototype confirmed that the core loop works after tuning. The key observed moment was a near-fail placement followed by a just-in-time three-clear that rescued the board.

## Prototype Shortcuts

- Single-file HTML/CSS/JS implementation.
- Placeholder food visuals.
- Hardcoded tuning values.
- No production architecture, no save system, no asset pipeline, no formal test harness.
- Prototype code is throwaway and should not be imported into production.

## Follow-Up Work Completed

- Formal GDDs and architecture were created.
- Production-track build now exists at `games/fridge-overflow/index.html`.
- Vertical slice report exists at `prototypes/fridge-overflow-vertical-slice/REPORT.md`.
