# Project Instructions

@/Users/fox/.codex/RTK.md

## Technology Stack

- **Engine**: Web Platform / HTML5 Browser Runtime
- **Language**: JavaScript, HTML, CSS
- **Build System**: None for MVP; static files run directly in modern browsers
- **Asset Pipeline**: Optimized local web assets with CSS/DOM fallback states
- **Test Runner**: Node.js built-in test runner for pure logic and documentation smoke checks

## Engine Version Reference

@docs/engine-reference/web-platform/VERSION.md

## Project Notes

- Target game for the current production track: `冰箱爆仓了`.
- Target platform: mobile-first browser / H5.
- Runtime style: small, dependency-light, static deployable games.
- Prefer pure modules for game logic so Board Model, Clear Resolver, RNG, scoring, storage, and smoke tests can run outside the DOM.
- Keep prototype files separate from production implementation. Prototype code can inform behavior but is not the production architecture.
