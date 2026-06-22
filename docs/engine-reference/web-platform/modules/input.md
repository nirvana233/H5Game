# Web Platform Input Module Reference

Last verified: 2026-06-22

## Relevant APIs

- `PointerEvent`
- `setPointerCapture`
- `releasePointerCapture`
- `pointercancel`
- `visibilitychange`
- `blur`
- CSS `touch-action`

## Project Guidance

- Use Pointer Events as the primary input path.
- Support exactly one active gameplay pointer in MVP.
- Treat non-active pointer events as ignored.
- Cancel active drag on page hidden, blur, orientation change, or layout invalidation.
- Suppress page gestures only during active drag inside the play area.
