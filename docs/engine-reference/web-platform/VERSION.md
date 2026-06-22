# Web Platform — Version Reference

| Field | Value |
|-------|-------|
| **Engine** | Web Platform / HTML5 Browser Runtime |
| **Pinned Baseline** | Modern evergreen mobile browsers: Safari, Chrome, Edge, Firefox |
| **Project Pinned** | 2026-06-22 |
| **LLM Knowledge Cutoff** | 2024-06 |
| **Risk Level** | MEDIUM — browser APIs evolve continuously, but MVP uses mature APIs |

## Supported Runtime Surface

- HTML Living Standard features used by static pages.
- CSS layout, custom properties, transforms, and media queries.
- ECMAScript modules for production logic.
- Pointer Events for primary input, with touch/mouse fallback where needed.
- Web Storage for MVP local persistence.
- `requestAnimationFrame` for visual update coalescing.

## Risk Summary

The project deliberately avoids fragile or fast-moving browser APIs for MVP. Architecture decisions should still verify browser compatibility before using:

- advanced WebGPU/WebGL rendering
- complex audio autoplay flows
- haptic/vibration APIs
- File System Access API
- browser-specific install/share APIs

## Last Verified

2026-06-22.
