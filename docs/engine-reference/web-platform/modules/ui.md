# Web Platform UI Module Reference

Last verified: 2026-06-22

## Relevant APIs

- DOM rendering
- CSS Grid/Flexbox
- CSS transforms
- CSS custom properties
- media queries and responsive layout

## Project Guidance

- The first viewport must show the playable board, current food, timer, pressure, and pending slots.
- Use stable layout boxes for the board and current food.
- Do not make result/HUD state depend on reading internal logic modules directly; consume runtime snapshots.
- Legal and illegal states must use non-color cues.
