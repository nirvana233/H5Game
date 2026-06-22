# UX Spec: Pause Menu

> **Status**: Approved - MVP Scoped Minimal
> **Author**: Codex ux-designer
> **Last Updated**: 2026-06-22
> **Platform Target**: Mobile Web / Browser

## Purpose & Player Need

MVP does not include a blocking pause menu. The game is a 2-4 minute session, so the only in-run meta action is restart. Browser blur or pointer cancel safely cancels drag without adding pending penalty.

## Navigation Position

Playable screen -> restart action -> fresh run.

## Interaction Map

| Component | Action | Outcome |
|-----------|--------|---------|
| Restart button | tap/click | reset run |
| Browser blur | app/background switch | active drag cancels safely |

## Accessibility

Restart remains focusable and has a visible focus state.

## Acceptance Criteria

- [ ] There is no modal pause state that blocks the board.
- [ ] Restart is visible during live play.
- [ ] Browser blur/cancel does not count as a miss.
- [ ] Future pause expansion must not hide critical failure/result state.
- [ ] MVP gate accepts pause as intentionally scoped minimal.
