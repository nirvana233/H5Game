# Accessibility Requirements: 冰箱爆仓了

> **Status**: Committed
> **Tier**: Basic+ Mobile H5
> **Last Updated**: 2026-06-22
> **Applies To**: MVP core loop, HUD, drag preview, result card

## Tier Definition

Basic+ means the MVP must be playable and readable on common mobile browsers without relying on color-only communication, hover-only controls, tiny targets, or motion-heavy feedback. It is not a full screen-reader-optimized release tier yet.

## Required Standards

- **Touch targets**: primary buttons and draggable current food area should be at least `44x44px`.
- **Color independence**: legal/illegal placement, pressure danger, pending danger, and clear success must include shape, pattern, icon, text, or animation backup.
- **Readable text**: live HUD text should remain legible on `390x844`; result card text must wrap instead of clipping.
- **Motion safety**: clear and warning animations must be short; a reduced-motion setting should suppress shake/pulse effects when production settings exist.
- **No hover-only behavior**: every action must work with touch and mouse click/drag.
- **Single active pointer**: second-finger input is ignored without corrupting drag state.
- **Focus visibility**: restart/share buttons must show focus state for keyboard or assistive browsing.
- **Storage failure tolerance**: failing to save best score must not block restart or result viewing.

## Screen-Specific Notes

| Surface | Accessibility Requirement |
|---------|---------------------------|
| Board | preview footprint shows all occupied cells with outline and fill |
| Current food | drag origin must not jump under finger after pickup |
| Pressure meter | danger state uses label/icon or pattern in addition to red |
| Pending slots | three-slot capacity is shown spatially, not only as a number |
| Result card | failure cause and restart action are visible without scrolling on common phones |

## Deferred For Later Release

- Full screen reader narration for each board cell.
- Remappable keyboard controls.
- Full localization QA across multiple languages.
- Formal WCAG audit.
