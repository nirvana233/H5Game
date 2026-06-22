# UX Spec: Result Card

> **Status**: Approved
> **Author**: Codex ux-designer
> **Last Updated**: 2026-06-22
> **Platform Target**: Mobile Web / Browser

## Purpose & Player Need

The player arrives wanting to understand why they failed, feel a shareable punchline, and restart quickly.

## Layout Specification

Result card overlays the frozen play surface after `GameOver`.

Information hierarchy:

1. Title / player label.
2. Management index and failure cause.
3. Score, survival time, cleared count, pending count.
4. Restart primary action.
5. Share secondary action.

## States & Variants

| State | Trigger | What Changes |
|-------|---------|--------------|
| Pending full | pending reaches 3 | failure copy names pending overload |
| Pressure full | pressure reaches 100 | failure copy names pressure overload |
| Share supported | Web Share available | native share sheet |
| Share fallback | Web Share unavailable | clipboard/status fallback |

## Interaction Map

| Component | Action | Feedback | Outcome |
|-----------|--------|----------|---------|
| Restart | tap/click | button press | new run |
| Share | tap/click | share sheet or status text | result text shared/copied |

## Accessibility

Buttons meet `44px` height, have focus outline, and result text wraps.

## Acceptance Criteria

- [ ] Result appears only after GameOver.
- [ ] Result includes title, index, score, failure cause, survival time, cleared count, pending count.
- [ ] Restart creates exactly one new run.
- [ ] Share has a fallback when native share fails.
- [ ] Card content fits on common mobile viewport.
