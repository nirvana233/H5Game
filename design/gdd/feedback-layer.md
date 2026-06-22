# Feedback Layer

> **Status**: Approved
> **Author**: Fox + Codex agents
> **Last Updated**: 2026-06-22
> **Implements Pillar**: 消除必须救命; 形状制造戏剧; 一眼看懂冰箱要爆

## Overview

Feedback Layer 是《冰箱爆仓了》的局内视觉、动效、提示、音频/触感事件编排系统，负责把输入预览、合法放置、非法回弹、清除、压力上涨、压力回落、待处理增加、得分和 Game Over 转化成即时反馈。它消费 Input Adapter、Clear Resolver、Pressure / Pending System、Scoring / Result Rules 和 Session Runtime 的事件，不改变任何规则结果。目标是让玩家清楚看懂“能不能放”“清掉了什么”“危险是不是降低了”。

## Player Fantasy

玩家幻想是“冰箱真的被我塞进去、清出来、差点爆掉”。反馈要服务手感和可读性：拖拽预览可信，非法位置提前警告，三消释放空间有明确爽感，压力下降让人松一口气。它不是堆粒子，而是用低成本、高识别的反馈强化核心循环。

## Detailed Design

### Core Rules

1. Feedback Layer owns transient visuals, animation requests, haptic/audio event requests, and feedback timing.
2. It does not decide placement legality, clear eligibility, score, pressure, pending, or Game State Machine transitions.
3. Legal and illegal preview are driven by Input Adapter `previewLegal` and full footprint cells.
4. Illegal preview must not rely on color alone.
5. Invalid release return should complete within `150ms` unless reduced-motion mode requests instant/simple return.
6. Clear feedback should highlight all clear groups and cells from Clear Resolver.
7. Logical clear completion is not blocked by full visual duration; Session Runtime may spawn after rules allow it.
8. Pressure warning should be event-throttled to avoid constant flashing.
9. Score popups and streak labels should not cover active drag target cells.
10. Audio/haptic requests must be rate-limited and optional for browser support.
11. Feedback must degrade gracefully on low-end devices.
12. Reduced motion mode keeps semantic feedback but lowers movement intensity.

### States and Transitions

| State | Entry Condition | Exit Condition | Behavior |
|-------|-----------------|----------------|----------|
| `IdleFeedback` | No active transient feedback | Event arrives | No overlay active |
| `PreviewFeedback` | Drag preview active | Drag ends/cancels | Shows legal/illegal footprint |
| `PlacementFeedback` | Legal drop event | Drop animation complete | Snap/place cue |
| `InvalidReturnFeedback` | Invalid release | Return cue complete | Short return/shake cue |
| `ClearFeedback` | Clear result with items | Clear cue complete | Highlight groups and freed cells |
| `DangerFeedback` | Pressure/timer/pending warning | Danger clears or escalates | Warning pulse/cue |
| `ResultFeedback` | GameOver | Restart | Game over reveal cue |

| From | Trigger | Guard | To | Required Side Effects |
|------|---------|-------|----|-----------------------|
| `IdleFeedback` | Drag starts | Current food exists | `PreviewFeedback` | Show ghost/preview |
| `PreviewFeedback` | Candidate updates | Drag active | `PreviewFeedback` | Update cells and legal state |
| `PreviewFeedback` | Legal release | `dropLegal == true` | `PlacementFeedback` | Clear preview; play placement cue |
| `PreviewFeedback` | Invalid release | `dropLegal == false` | `InvalidReturnFeedback` | Clear preview; return cue |
| Any live state | Clear result | `clearedItems > 0` | `ClearFeedback` | Highlight clear groups |
| Any live state | Danger event | Throttle allows | `DangerFeedback` | Show pressure/pending warning |
| Any live state | GameOver | Result ready | `ResultFeedback` | Stop gameplay feedback and reveal failure |

### Interactions with Other Systems

| System | Direction | Interface Contract |
|--------|-----------|--------------------|
| Input Adapter | Feedback consumes preview data | Uses ghost position, candidate cells, and preview legality. |
| Clear Resolver | Feedback consumes clear groups | Highlights immutable clear groups and cleared cells. |
| Pressure / Pending System | Feedback consumes pressure events | Shows pressure increase, relief, pending increment, danger. |
| Scoring / Result Rules | Feedback consumes score events | Shows score popups, streak, new best/result reveal. |
| Gameplay HUD / Result UI | Feedback overlays UI | Must not obscure core HUD/drag targets. |
| Session Runtime | Feedback consumes ordered events | Uses runId to ignore stale delayed feedback. |
| Visual Asset Spec | Feedback consumes asset definitions | Uses approved icons, VFX sprites, colors, and motion style. |

## Formulas

### `invalidReturnDuration`

The `invalidReturnDuration` formula is defined as:

`invalidReturnDuration(reducedMotion) = 0ms if reducedMotion else 150ms`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Reduced motion | `reducedMotion` | bool | `true/false` | Accessibility preference |

**Output Range:** `0ms` or `150ms`.
**Example:** Normal invalid release returns in `150ms`.

### `clearFeedbackDuration`

The `clearFeedbackDuration` formula is defined as:

`clearFeedbackDuration(clearedItems, reducedMotion) = 120ms if reducedMotion else clamp(260ms + 20ms * clearedItems, 300ms, 500ms)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Cleared items | `clearedItems` | int | `0..N` | Number of cleared food instances |
| Reduced motion | `reducedMotion` | bool | `true/false` | Accessibility preference |

**Output Range:** `120ms` in reduced motion; otherwise `300..500ms`.
**Example:** Clearing 5 items gives `360ms`.

### `feedbackThrottleAllowed`

The `feedbackThrottleAllowed` formula is defined as:

`feedbackThrottleAllowed(now, lastEventTime, cooldownMs) = now - lastEventTime >= cooldownMs`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Current time | `now` | ms | monotonic | Current feedback clock |
| Last event time | `lastEventTime` | ms | monotonic | Last played same event |
| Cooldown | `cooldownMs` | int ms | `0..1000` | Event-specific cooldown |

**Output Range:** Boolean.
**Example:** A pressure warning with `500ms` cooldown cannot play twice within half a second.

### `previewStyle`

The `previewStyle` formula is defined as:

`previewStyle(previewLegal) = legalStyle if previewLegal else illegalStyle`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Preview legal | `previewLegal` | bool | `true/false` | Input Adapter legality result |

**Output Range:** Legal or illegal style token.
**Example:** Illegal style uses red plus stripe/outline, not red alone.

## Edge Cases

- **If preview cells include out-of-bounds coordinates**: show in-bounds cells and illegal state; do not invent board cells.
- **If drag cancels mid-animation**: clear preview and return to stable current-food presentation.
- **If clear result arrives while placement cue is playing**: clear feedback may layer after placement cue but must use the immutable clear result.
- **If GameOver occurs during feedback**: stop non-result gameplay feedback and show result feedback.
- **If browser does not support haptics/audio autoplay**: silently skip those cues; visual feedback remains required.
- **If reduced motion is active**: replace shakes and large movement with opacity/outline changes.
- **If low-end performance mode is active**: disable particles and use simple class/transform effects.
- **If the same pressure warning fires every frame**: throttle warnings to avoid visual/audio spam.

## Dependencies

| Dependency | Type | Contract |
|------------|------|----------|
| Input Adapter | Hard | Source of drag preview data. |
| Clear Resolver | Hard | Source of clear groups. |
| Pressure / Pending System | Hard | Source of danger/relief events. |
| Scoring / Result Rules | Hard | Source of score/streak/result events. |
| Session Runtime | Hard | Source of event order and runId. |
| Gameplay HUD / Result UI | Peer | Shares screen space and result timing. |
| Visual Asset Spec | Downstream/peer | Defines final art assets. |

## Tuning Knobs

| Knob | Current Value | Safe Range | Effect |
|------|---------------|------------|--------|
| `invalidReturnMs` | `150ms` | `80..180ms` | Shorter feels snappy; longer feels sluggish. |
| `clearFeedbackMinMs` | `300ms` | `220..380ms` | Minimum clear readability. |
| `clearFeedbackMaxMs` | `500ms` | `400..650ms` | Maximum clear celebration. |
| `pressureWarningCooldownMs` | `500ms` | `300..1000ms` | Prevents spam. |
| `scorePopupMaxVisible` | `3` | `1..5` | Limits clutter. |
| `particlesEnabledLowEnd` | `false` | `true/false` | Performance fallback. |

## Visual/Audio Requirements

Required feedback events:

- legal drag preview
- illegal drag preview
- valid placement snap
- invalid release return
- clear group highlight
- pressure increase warning
- pressure relief cue
- pending slot fill
- score/streak popup
- GameOver reveal

Audio/haptics are optional enhancement. Visual readability is mandatory.

Asset Spec: Visual/Audio requirements are defined. After the art bible is approved, run `/asset-spec system:Feedback Layer`.

## UI Requirements

Feedback overlays must not cover critical HUD data or the active board footprint. Legal/illegal states must be visible under a finger on mobile. Debug feedback ids may appear only in QA builds.

UX Flag - Feedback Layer: This system has UI requirements for overlay placement, motion, and accessibility.

## Acceptance Criteria

- **GIVEN** `previewLegal=true`, **WHEN** preview renders, **THEN** legal style is used for every footprint cell.
- **GIVEN** `previewLegal=false`, **WHEN** preview renders, **THEN** illegal style uses non-color distinction.
- **GIVEN** invalid release in normal motion mode, **WHEN** return feedback plays, **THEN** it completes in `150ms` or less.
- **GIVEN** `clearedItems=5`, **WHEN** clear feedback duration is calculated, **THEN** it equals `360ms`.
- **GIVEN** pressure warning fired `200ms` ago with `500ms` cooldown, **WHEN** another warning arrives, **THEN** it is suppressed.
- **GIVEN** GameOver arrives during clear feedback, **WHEN** feedback processes the event, **THEN** gameplay feedback stops and result feedback begins.
- **GIVEN** haptic API is unavailable, **WHEN** feedback requests haptics, **THEN** no error blocks visual feedback.

## Open Questions

| Question | Current Assumption | Owner | Target Resolution |
|----------|--------------------|-------|-------------------|
| Should clear feedback use particles or simple cell flashes? | Simple flashes first; particles only if performance budget allows. | Art / Technical | Visual Asset Spec. |
| Should haptics ship in MVP? | Optional, feature-detected, no dependency. | Technical | Browser QA. |
| How intense should late pressure warnings be? | Warning at HUD level; avoid full-screen obstruction. | UX / Art | Playtest polish. |
