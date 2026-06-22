---
status: reverse-documented
source: prototypes/boss-is-coming-core-loop-concept/
date: 2026-06-22
verified-by: local prototype inspection
---

# Prototype Concept: 老板来了! 摸鱼伪装赛

> **Note**: This document was reverse-engineered from the existing prototype and `design/gdd/boss-is-coming-game-concept.md`.

## Prototype Question

If the player holds to slack off and releases to fake work as the boss approaches, does the near-miss greed loop feel tense and funny?

## Core Fantasy

The player is a worker trying to squeeze out as much slacking-off time as possible while switching back to fake work at the last possible moment before the boss notices.

## Implemented Mechanics

- Hold / press to slack off and earn score.
- Release to fake work.
- Boss approach meter driven by patrol phase timing.
- Risk multiplier grows while slacking.
- Caught state when the player keeps slacking too late.
- Win / result state with humorous office-flavored copy.

## Discovered Loop

Safe window -> start slacking -> boss progress rises -> decide whether to keep greed-scoring or release -> either fake work safely or get caught -> result / restart.

## Design Intent Captured

- The primary emotion is "差一点": the best moment should be releasing just before the boss catches the player.
- Failure should feel self-inflicted rather than random.
- The office comedy theme is essential; the mechanic alone would be too abstract without social embarrassment framing.

## Prototype Shortcuts

- Single-file HTML/CSS/JS implementation.
- Abstract office scene and simple boss progress logic.
- No production architecture, save system, asset pipeline, audio, or expanded patrol role set.
- Prototype code is throwaway and should not be imported into production.

## Follow-Up Work

- Write a formal prototype report if this concept is resumed.
- Expand patrol variety only after the one-boss greed loop is confirmed by playtest.
- Preserve single-input simplicity if moving into a production GDD pass.
