# Web Platform Deprecated APIs

Last verified: 2026-06-22

## Avoid In Production Code

| Avoid | Use Instead | Reason |
|-------|-------------|--------|
| `touchstart`-only gameplay input | Pointer Events with touch fallback | Pointer Events unify touch, mouse, and stylus. |
| `document.write` | DOM creation APIs / templates | Unsafe and not suitable for app runtime. |
| synchronous layout reads inside pointermove loops | cached layout + `requestAnimationFrame` | Prevents layout thrashing. |
| color-only warning states | color + shape/pattern/text | Accessibility and readability. |
| unguarded `localStorage` calls | storage adapter with try/catch | Browser privacy/quota modes can throw. |

## Notes

This is a project-level deprecated-pattern list, not a complete web standards deprecation database.
