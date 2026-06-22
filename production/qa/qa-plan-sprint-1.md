# QA Plan: Sprint 1 — Fridge Overflow MVP

**Date**: 2026-06-22
**Scope**: `games/fridge-overflow/`

## Automated Tests Required

- `tests/unit/fridge-overflow-core.test.js`
- `tests/unit/documentation-contract.test.js`
- `tests/integration/pipeline-smoke.test.js`

## Manual Smoke Checks

1. Open `games/fridge-overflow/index.html`.
2. Confirm board, current food, score, timer, pressure, pending, restart are visible.
3. Drag current food into a legal placement.
4. Drag into an illegal placement and confirm return behavior.
5. Create a same-type three-clear.
6. Wait for timeout and confirm pending increments.
7. Fill pending or pressure and confirm result card.
8. Restart from result.
9. Use share action and confirm native share or fallback status.

## Pass Criteria

- All automated tests pass.
- No blocking layout overlap on common mobile viewport.
- No hard failure if storage/share is unavailable.
