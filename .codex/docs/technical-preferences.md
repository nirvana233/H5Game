# Technical Preferences

## Engine & Language

- **Engine**: Web Platform / HTML5 Browser Runtime
- **Pinned Reference**: `docs/engine-reference/web-platform/VERSION.md`
- **Language**: JavaScript, HTML, CSS
- **Module Format**: ES modules for production source; inline scripts allowed only for disposable prototypes
- **Target Platforms**: Mobile browser first, desktop browser supported
- **Primary Input**: Touch / Pointer Events
- **Secondary Input**: Mouse

## Naming Conventions

- JavaScript classes and modules: PascalCase for classes, camelCase for functions and variables.
- Constants: UPPER_SNAKE_CASE for cross-module constants; camelCase for local immutable values.
- Files: kebab-case for production modules and documentation files.
- DOM ids/classes: kebab-case.
- GDD-derived system modules should preserve system names in file names where practical, e.g. `board-model.js`, `clear-resolver.js`.

## Input & Platform

- **Target Platforms**: Web / Browser, mobile-first.
- **Input Methods**: Touch, Pointer Events, Mouse.
- **Primary Input**: Single-finger drag using Pointer Events.
- **Gamepad Support**: None for MVP.
- **Touch Support**: Full.
- **Platform Notes**: Avoid hover-only controls. Use `touch-action` deliberately inside the play area. Do not globally block browser gestures outside active gameplay drag.

## Performance Budgets

- **Frame Rate Target**: 60 FPS on mainstream mobile browsers.
- **Frame Budget**: 16.6ms total; gameplay logic should normally stay below 3ms per frame on the 6x8 board.
- **DOM Mutation Budget**: Avoid full board rebuilds during drag; coalesce pointer preview updates to animation frames.
- **Initial Load Target**: MVP playable page should stay small enough for instant H5 loading; avoid framework bundles.
- **Asset Budget**: Follow `design/gdd/visual-asset-spec.md`; food icons target `<=20KB` each.

## Testing

- **Unit Tests**: Node.js built-in test runner under `tests/unit/`.
- **Integration Smoke Tests**: Node.js built-in test runner under `tests/integration/`.
- **Browser Manual Smoke**: Open production/prototype HTML in Chrome/Safari mobile viewport and verify first valid drag within 5 seconds.
- **CI**: `.github/workflows/tests.yml` runs `npm test`.

## Forbidden Patterns

- Do not put production game logic only inside anonymous inline DOM handlers.
- Do not let UI code mutate Board Model or scoring state directly.
- Do not use ambient randomness for spawn decisions; use seeded RNG through the scheduler.
- Do not add external runtime dependencies without a concrete implementation need.
- Do not rely on color alone for legal/illegal or danger feedback.

## Allowed Libraries

- None for MVP runtime.
- Node.js built-in modules are allowed for tests and simple tooling.

## Engine Specialists

- **Primary**: lead-programmer for Web Platform architecture and JavaScript module boundaries.
- **UI Specialist**: ui-programmer for DOM/CSS/HUD implementation.
- **UX Specialist**: ux-designer for mobile touch flows and accessibility.
- **Performance Specialist**: performance-analyst for frame, DOM, and asset budgets.
- **QA Specialist**: qa-lead for smoke and regression test strategy.

## File Extension Routing

| File Extension / Type | Specialist |
|-----------------------|------------|
| `.js` / `.mjs` | lead-programmer |
| `.html` | ui-programmer |
| `.css` | ui-programmer |
| visual assets | technical-artist |
| architecture docs | technical-director |
| tests | qa-lead |
