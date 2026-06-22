# ADR-0001: Web Platform Static Runtime

## Status

Accepted — 2026-06-22

## Context

《冰箱爆仓了》 targets mobile-first H5 play and the existing project is a static HTML/CSS/JavaScript game collection. MVP should open quickly, avoid framework load cost, and remain easy to deploy as static files.

## Decision

Use the Web Platform / HTML5 Browser Runtime as the production engine for MVP. Production code will use dependency-light ES modules, DOM/CSS presentation, Pointer Events input, Web Storage persistence, and Node-based pure-logic tests.

## Consequences

- No Unity/Godot/Unreal runtime is introduced.
- Core game logic must be kept separate from DOM rendering.
- Static deploy remains simple.
- Browser compatibility must be checked for mobile layout, pointer input, storage, and optional share/audio/haptic APIs.

## Engine Compatibility

- Engine: Web Platform / HTML5 Browser Runtime
- Reference: `docs/engine-reference/web-platform/VERSION.md`
- Risk: MEDIUM because browser APIs evolve continuously, but MVP uses mature APIs.
- Deprecated APIs checked: `docs/engine-reference/web-platform/deprecated-apis.md`

## GDD Requirements Addressed

- TR-input-001
- TR-hud-001
- TR-feedback-001
- TR-asset-001

## ADR Dependencies

- Depends On: None
- Enables: ADR-0002, ADR-0003, ADR-0004, ADR-0005
