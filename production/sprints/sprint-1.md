# Sprint 1 — 2026-06-22 to 2026-06-28

## Sprint Goal

Deliver a playable MVP of 《冰箱爆仓了》 in the H5 collection with testable core logic and production handoff evidence.

## Capacity

- Total days: 7
- Buffer: 1 day
- Available: 6 days
- Actual status: completed in current production pass

## Tasks

### Must Have

| ID | Task | Owner | Status | Acceptance Criteria |
|----|------|-------|--------|---------------------|
| S1-001 | Foundation Runtime stories | lead-programmer | Complete | board/food/storage/test evidence exists |
| S1-002 | Core Loop stories | gameplay-programmer | Complete | drag, clear, pressure, result loop playable |
| S1-003 | Presentation HUD stories | ui-programmer | Complete | mobile HUD/result visible and accessible |
| S1-004 | QA smoke and evidence | qa-lead | Complete | `npm test` passes and smoke report exists |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Mobile browser feel may differ from desktop static checks | Medium | High | Run real-device QA before Release |
| CSS block food art may be too plain | Medium | Medium | Add final bitmap icons during Polish |
| Share API support varies | Medium | Low | Clipboard/status fallback already exists |

## Definition of Done

- [x] All Must Have tasks completed.
- [x] Automated tests pass.
- [x] QA plan exists.
- [x] Smoke evidence exists.
- [x] Design documents updated for deviations.
