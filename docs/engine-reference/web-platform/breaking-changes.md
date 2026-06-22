# Web Platform Breaking Changes Watchlist

Last verified: 2026-06-22

## Current MVP Impact

No known browser breaking change blocks the planned MVP because the architecture uses mature APIs: DOM, CSS, Pointer Events, Web Storage, and `requestAnimationFrame`.

## Watch Areas

| Area | Risk | Guidance |
|------|------|----------|
| Mobile viewport sizing | Medium | Test Safari and Chrome address-bar behavior; avoid hard-coded `100vh` as the only layout constraint. |
| Touch gesture defaults | Medium | Use `touch-action` on the gameplay surface and avoid global gesture suppression. |
| Audio autoplay | Medium | Start audio only after user gesture; never require sound for gameplay feedback. |
| Local storage quota/privacy | Low/Medium | Treat storage as optional; core loop must work when storage is unavailable. |
| Share APIs | Low/Medium | Feature-detect and provide copy/fallback behavior. |

## Architecture Requirement

Any ADR that adopts a newer browser API must list fallback behavior and the target browser support matrix.
