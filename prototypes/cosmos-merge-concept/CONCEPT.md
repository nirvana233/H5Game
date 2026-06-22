---
status: reverse-documented
source: prototypes/cosmos-merge-concept/
date: 2026-06-22
verified-by: local prototype inspection
---

# Prototype Concept: 合成宇宙 Cosmos Merge

> **Note**: This document was reverse-engineered from the existing prototype and `design/gdd/game-concept.md`.

## Prototype Question

物理合成核心循环是否好玩？自写圆形物理手感是否稳定？

## Core Fantasy

The player acts as a cosmic creator, dropping small celestial bodies and merging them into larger objects until black holes create dramatic clearing moments.

## Implemented Mechanics

- Canvas-based vertical container.
- Player positions and drops the current celestial body.
- Circle physics with gravity, wall/floor collision, friction, damping, and sub-steps.
- Same-level body collision can merge into a higher level.
- Highest-level merge can trigger black-hole absorption and clear nearby bodies.
- Death line detects overflow pressure.
- Score, next preview, particle feedback, and game-over overlay are rendered in canvas.

## Discovered Loop

Aim drop -> body falls and settles -> matching bodies collide and merge -> higher bodies increase space pressure -> black hole clear can recover the container -> overflow ends run -> restart.

## Design Intent Captured

- The differentiator is not only Suika-style merging; it is the cosmic escalation and black-hole recovery moment.
- The black hole should be a deliberate comeback tool, not just an end-state trophy.
- Readability and stable hand-written physics are the main risks.

## Prototype Shortcuts

- Single-file HTML/canvas prototype.
- Hardcoded physics, radii, colors, score, and merge levels.
- No production module boundaries, test harness, asset pipeline, audio, persistence, or formal balancing data.
- Prototype code is reference only and should not become production code directly.

## Follow-Up Work

- If resumed, write an explicit physics/merge GDD and ADR before production.
- Add deterministic tests for merge and black-hole rules.
- Validate mobile performance and low-end canvas draw cost before expanding effects.
