# Smoke Test: Critical Paths

**Purpose**: Run these checks before QA hand-off.
**Run via**: `/smoke-check`
**Update**: Add new checks when production code lands.

## Core Stability

1. Game launches to playable screen without crash.
2. A new run starts within 5 seconds of opening the page.
3. Restart from result creates one fresh run.

## Core Mechanic

4. Player can drag current food into a legal board position.
5. Illegal placement shows illegal preview and returns the food without consuming pending capacity.
6. Three adjacent same-type food instances clear and free their occupied cells.
7. Multi-cell cleared food releases every occupied cell.
8. Timeout fills one pending slot and increases pressure.
9. Current food with no legal placement increases pressure over time.

## Data Integrity

10. Score updates after placement and clear.
11. Result payload includes score, management index, failure cause, survival time, cleared count, and pending count.
12. Storage failure does not block result display or restart.

## Performance / UX

13. Board, current food, timer, pressure, pending, and score are visible on `390x844`.
14. Legal/illegal and danger states are understandable without color alone.
15. No visible drag lag during normal mobile play.
