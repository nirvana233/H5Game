# Epic: Presentation HUD

> **Layer**: Presentation
> **GDDs**: `design/gdd/gameplay-hud-result-ui.md`, `design/gdd/feedback-layer.md`, `design/gdd/visual-asset-spec.md`
> **Architecture Modules**: Gameplay HUD / Result UI, Feedback Layer, Visual Asset Spec
> **Status**: Complete for MVP
> **Stories**: 2 stories

## Overview

Render the mobile-first playable screen, feedback states, pressure/pending/timer display, and result card.

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|------------------|-------------|
| ADR-0001 | Static Web Platform runtime | MEDIUM |
| ADR-0003 | UI consumes logic outputs, not game truth ownership | LOW |

## Stories

| # | Story | Type | Status | Evidence |
|---|-------|------|--------|----------|
| 001 | HUD and result UI | UI | Complete | `design/ux/hud.md`, `games/fridge-overflow/` |
| 002 | Accessibility and visual feedback | UI | Complete | `design/accessibility-requirements.md` |

## Definition of Done

- HUD fits mobile first viewport.
- Result card supports restart/share.
- Danger and legal states are not color-only.
