# Control Manifest

> **Engine**: Web Platform / HTML5 Browser Runtime
> **Last Updated**: 2026-06-22
> **Manifest Version**: 2026-06-22
> **ADRs Covered**: ADR-0001, ADR-0002, ADR-0003, ADR-0004, ADR-0005
> **Status**: Active - regenerate with `/create-control-manifest update` when ADRs change

This manifest is a programmer quick-reference extracted from Accepted ADRs, technical preferences, and engine reference docs. For reasoning, read the cited ADRs.

---

## Foundation Layer Rules

*Applies to: runtime setup, event contracts, persistence, test harness, engine initialization.*

### Required Patterns

- **Use the Web Platform / HTML5 Browser Runtime for MVP production.** Source: ADR-0001
- **Use dependency-light ES modules for production code.** Source: ADR-0001
- **Use a single Session Runtime to orchestrate run lifecycle, frame order, current food, timer, snapshots, and cross-system side effects.** Source: ADR-0002
- **All delayed callbacks must carry `runId`.** Source: ADR-0002
- **Wrap Web Storage with a Storage Adapter that catches failures and returns defaults on corrupt data.** Source: ADR-0004
- **Use Node.js built-in `node:test` and `assert` for initial unit and integration smoke tests.** Source: ADR-0005

### Forbidden Approaches

- **Never introduce Unity, Godot, Unreal, or another packaged runtime for MVP without a new ADR.** Source: ADR-0001
- **Never let storage failure block result display or restart.** Source: ADR-0004
- **Never depend on browser automation as the only rule-regression gate before it is intentionally added.** Source: ADR-0005

### Performance Guardrails

- **Frame target**: 60 FPS; gameplay logic should normally stay below `3ms` per frame on the `6x8` board. Source: technical-preferences
- **Initial load**: avoid framework bundles for MVP. Source: technical-preferences

## Core Layer Rules

*Applies to: board, food config, game state machine, RNG, input, clear resolver, pressure, scoring.*

### Required Patterns

- **Board placement, food definitions, clear detection, pressure, scoring, and RNG must be deterministic and testable.** Source: ADR-0003
- **Core gameplay modules must have no DOM dependency.** Source: ADR-0003
- **Session Runtime is the only path for Board Model mutations during gameplay.** Source: ADR-0002, ADR-0003
- **Use seeded RNG through the scheduler; do not use ambient randomness for spawn decisions.** Source: technical-preferences
- **Input Adapter uses Pointer Events and tracks one active pointer for MVP.** Source: ADR-0001, current-best-practices

### Forbidden Approaches

- **Never put production game logic only inside anonymous inline DOM handlers.** Source: technical-preferences, ADR-0003
- **Never let UI code mutate Board Model or scoring state directly.** Source: ADR-0003, technical-preferences
- **Never let Input Adapter mutate Board Model.** Source: architecture.md

### Performance Guardrails

- **Avoid synchronous layout reads inside pointermove loops; cache layout and coalesce preview rendering to `requestAnimationFrame`.** Source: deprecated-apis, current-best-practices
- **Avoid full board rebuilds during drag.** Source: technical-preferences

## Feature Layer Rules

*Applies to: session runtime behavior, pressure, scoring, persistence integration, smoke scenarios.*

### Required Patterns

- **Runtime applies Board, Clear, Pressure, Score, Storage, HUD, and Feedback calls in deterministic order.** Source: ADR-0002
- **Integration smoke tests should replay deterministic scenarios.** Source: ADR-0002, ADR-0005
- **Scoring and result payloads are computed before storage writes.** Source: ADR-0004
- **Storage writes occur after result payloads or settings changes.** Source: ADR-0004

### Forbidden Approaches

- **Never allow stale callbacks to mutate a restarted run.** Source: ADR-0002
- **Never make account/cloud sync an MVP dependency.** Source: ADR-0004

### Performance Guardrails

- **Resolution locks may pause input/timer for visual feedback, but logic must remain deterministic and smoke-testable.** Source: ADR-0002, ADR-0005

## Presentation Layer Rules

*Applies to: DOM/CSS rendering, HUD, result UI, feedback, visual assets.*

### Required Patterns

- **HUD and Feedback consume runtime snapshots and event payloads only.** Source: ADR-0001, architecture.md
- **Keep DOM rendering and feedback in presentation modules.** Source: current-best-practices
- **Use Pointer Events for drag and CSS transforms for drag ghosts/feedback.** Source: ADR-0001, current-best-practices
- **Every core food needs readable shape identity at phone size.** Source: art-bible, visual-asset-spec
- **Legal/illegal and danger feedback must use color plus non-color backup.** Source: technical-preferences, deprecated-apis, accessibility-requirements

### Forbidden Approaches

- **Never rely on `touchstart`-only gameplay input.** Source: deprecated-apis
- **Never use `document.write` in app runtime.** Source: deprecated-apis
- **Never rely on color-only warning states.** Source: deprecated-apis
- **Never cover active board play with long modal banners for difficulty changes.** Source: HUD UX spec, RNG GDD

### Performance Guardrails

- **Food icons target `<=20KB` each; HUD icons target `<=10KB` each.** Source: technical-preferences, art-bible
- **Use small optimized assets and CSS fallback shapes.** Source: current-best-practices, art-bible

## Global Rules

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| JavaScript classes | PascalCase | `SessionRuntime` |
| Functions / variables | camelCase | `createBoardModel` |
| Constants | UPPER_SNAKE_CASE for shared constants | `MAX_PENDING` |
| Files | kebab-case | `clear-resolver.js` |
| DOM ids/classes | kebab-case | `pressure-meter` |

### Performance Budgets

| Target | Value |
|--------|-------|
| Framerate | 60 FPS on mainstream mobile browsers |
| Frame budget | 16.6ms total |
| Gameplay logic | normally below 3ms per frame on `6x8` board |
| DOM mutation | avoid full board rebuilds during drag |
| Asset budget | food icons `<=20KB` each |

### Approved Libraries / Addons

- Runtime dependencies: none approved for MVP.
- Tests/tooling: Node.js built-in modules only.

### Forbidden APIs / Patterns

- `touchstart`-only gameplay input - use Pointer Events with fallback.
- `document.write` - use DOM creation APIs/templates.
- synchronous layout reads inside pointermove loops - cache layout and batch with `requestAnimationFrame`.
- color-only warning states - add shape/pattern/text backup.
- unguarded `localStorage` calls - use Storage Adapter with `try/catch`.

### Cross-Cutting Constraints

- Current production track is 《冰箱爆仓了》.
- Mobile-first browser behavior wins over desktop embellishment.
- Optional browser APIs such as share, audio, and haptics require feature detection and fallback before they become MVP dependencies.
- Any new runtime dependency requires an ADR or explicit architecture update.
