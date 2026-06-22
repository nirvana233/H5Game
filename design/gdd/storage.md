# Storage

> **Status**: Approved
> **Author**: Fox + Codex agents
> **Last Updated**: 2026-06-22
> **Implements Pillar**: 短局高复玩; 失败也好笑

## Overview

Storage 是《冰箱爆仓了》的本地持久化系统，负责保存玩家设备上的最高分、最佳管理指数、累计游玩统计、基础设置和最近一次结果摘要。MVP 不做账号、云同步、排行榜或付费数据，只使用浏览器本地存储能力，让玩家刷新页面或下次打开时仍能看到自己的最佳成绩与基础偏好。

## Player Fantasy

玩家幻想是“我刚刚那局神操作不会丢”。Storage 不直接参与核心操作，但它让短局高复玩有连续性：最高分可以被挑战，最佳称号可以被保留，结果卡可以再次展示或分享。它必须稳定、轻量，不应该因为存储失败影响一局游戏的完成和重开。

## Detailed Design

### Core Rules

1. Storage owns local persistent records only.
2. MVP storage target is browser local storage or an equivalent local key-value adapter.
3. Storage must never be required for the core run loop to function.
4. Storage writes occur after result payload is built, not during high-frequency gameplay frames.
5. Storage saves best score only when the new score is greater than previous best.
6. Storage saves best management index only when the new index is greater than previous best.
7. Storage may save cumulative stats: games played, total cleared, total survival seconds, total overflows.
8. Storage may save settings: audio enabled, haptics enabled, reduced motion override, last selected theme if available.
9. Stored records are versioned.
10. Invalid, missing, corrupt, or old-version data must fall back safely to defaults.
11. Storage must not store personally identifiable information in MVP.
12. Storage must not block restart or result display if write fails.

### States and Transitions

| State | Entry Condition | Exit Condition | Behavior |
|-------|-----------------|----------------|----------|
| `Unavailable` | Browser storage blocked or unavailable | Adapter becomes available or fallback used | Reads return defaults; writes no-op with warning |
| `Loading` | App boot requests saved data | Load complete or fails | Reads persisted envelope |
| `Ready` | Valid data loaded or defaults created | Save requested | Exposes snapshot to UI/runtime |
| `SavingResult` | GameOver result arrives | Save complete/fails | Updates best and aggregate stats |
| `SavingSettings` | Setting changed | Save complete/fails | Persists setting values |
| `StorageError` | Parse/write/quota failure | Next read/write attempt | Preserve in-memory defaults and report debug warning |

| From | Trigger | Guard | To | Required Side Effects |
|------|---------|-------|----|-----------------------|
| `Unavailable` | Boot | local storage accessible | `Loading` | Attempt read |
| `Loading` | Valid envelope loaded | Version supported | `Ready` | Publish stored snapshot |
| `Loading` | Missing/corrupt data | None | `Ready` | Use defaults |
| `Ready` | Result payload | GameOver result available | `SavingResult` | Compute best updates and aggregate increments |
| `SavingResult` | Write success/fail | None | `Ready` | Publish updated in-memory snapshot or warning |
| `Ready` | Setting changed | Setting key valid | `SavingSettings` | Write settings envelope |
| Any | Parse/quota error | None | `StorageError` | Do not break gameplay |

### Interactions with Other Systems

| System | Direction | Interface Contract |
|--------|-----------|--------------------|
| Scoring / Result Rules | Storage consumes result | Receives immutable result payload after GameOver. |
| Session Runtime | Runtime calls storage | Requests load at boot and save after result. |
| Gameplay HUD / Result UI | UI consumes stored best | Shows best score/index and settings state. |
| Feedback Layer | Optional settings consumer | Reads audio/haptics/reduced motion settings. |
| Visual Asset Spec | Optional theme consumer | May use selected theme if themes exist later. |
| Smoke Test Harness | Verifies storage behavior | Tests corrupt data, best score updates, and write failure fallback. |

## Formulas

### `shouldUpdateBestScore`

The `shouldUpdateBestScore` formula is defined as:

`shouldUpdateBestScore(newScore, storedBestScore) = newScore > storedBestScore`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| New score | `newScore` | int | `>=0` | Score from final result |
| Stored best score | `storedBestScore` | int | `>=0` | Current saved best |

**Output Range:** Boolean.
**Example:** `2500 > 1800` returns `true`.

### `shouldUpdateBestIndex`

The `shouldUpdateBestIndex` formula is defined as:

`shouldUpdateBestIndex(newIndex, storedBestIndex) = newIndex > storedBestIndex`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| New index | `newIndex` | int | `0..100` | Management index from result |
| Stored best index | `storedBestIndex` | int | `0..100` | Current saved best index |

**Output Range:** Boolean.
**Example:** `96 > 92` returns `true`.

### `updatedAggregateStats`

The `updatedAggregateStats` formula is defined as:

`updatedAggregateStats(stats, result) = {gamesPlayed + 1, totalCleared + result.totalClearedItems, totalSurvivalSeconds + result.survivalSeconds, totalOverflows + 1 if result.failureCause != none else totalOverflows}`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Stored stats | `stats` | object | nonnegative counters | Current aggregate stats |
| Result | `result` | object | final result payload | Latest run result |

**Output Range:** Updated aggregate stats object.
**Example:** A run clearing 18 items increments total cleared by `18`.

### `storageEnvelope`

The `storageEnvelope` formula is defined as:

`storageEnvelope(data) = {version: 1, gameId: "fridge-overflow", updatedAt, data}`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Version | `version` | int | `1` in MVP | Storage schema version |
| Game id | `gameId` | string | `"fridge-overflow"` | Prevents cross-game confusion |
| Updated time | `updatedAt` | timestamp | current time | Debug/audit metadata |
| Data | `data` | object | MVP storage payload | Bests, stats, settings |

**Output Range:** Versioned storage object.
**Example:** Saved best score lives under `data.bestScore`.

## Edge Cases

- **If local storage is unavailable**: use in-memory defaults and keep gameplay playable.
- **If stored JSON is corrupt**: ignore it, reset to defaults, and optionally overwrite on next successful save.
- **If schema version is unknown**: ignore unknown fields and use defaults unless a migration exists.
- **If quota exceeded on write**: keep in-memory result and show no player-blocking error.
- **If new score equals best score**: do not update best timestamp unless product later wants tied-best tracking.
- **If a result payload is missing score/index**: skip best update and log validation error.
- **If user clears browser data**: treat as fresh player with no warning.
- **If multiple tabs write results**: last write wins for MVP; future sync can add conflict resolution.

## Dependencies

| Dependency | Type | Contract |
|------------|------|----------|
| Scoring / Result Rules | Hard | Source of final result payload. |
| Session Runtime | Hard | Calls load/save at lifecycle points. |
| Gameplay HUD / Result UI | Downstream | Displays stored bests/settings. |
| Feedback Layer | Soft | Reads feedback-related settings. |
| Smoke Test Harness | Downstream | Tests storage reliability paths. |

## Tuning Knobs

| Knob | Current Value | Safe Range | Effect |
|------|---------------|------------|--------|
| `storageSchemaVersion` | `1` | monotonic ints | Enables future migrations. |
| `storageKey` | `fridge-overflow:v1` | unique string | Prevents collisions. |
| `saveRecentResult` | `true` | `true/false` | Allows result card restore/debug. |
| `maxRecentResults` | `1` | `0..10` | MVP stores only latest result. |
| `writeTimeoutMs` | `100ms` | `50..500ms` | Debug threshold for slow writes. |

## Visual/Audio Requirements

Storage has no direct visual/audio output. UI may show "new best" when Storage confirms a best update, but the cue belongs to Gameplay HUD / Result UI and Feedback Layer.

## UI Requirements

- Result UI may show best score and best index.
- Settings UI may show audio/haptics/reduced-motion toggles if those controls ship.
- Storage errors should not appear to normal players unless data loss would be visible; debug builds may show warnings.

## Acceptance Criteria

- **GIVEN** stored best score is `1000`, **WHEN** result score is `1200`, **THEN** best score updates.
- **GIVEN** stored best score is `1000`, **WHEN** result score is `1000`, **THEN** best score does not update.
- **GIVEN** stored JSON is corrupt, **WHEN** Storage loads, **THEN** defaults are returned and gameplay can start.
- **GIVEN** local storage write fails, **WHEN** result is saved, **THEN** result UI remains usable and restart works.
- **GIVEN** result clears 18 items, **WHEN** aggregate stats update, **THEN** total cleared increases by `18`.
- **GIVEN** schema version is unknown, **WHEN** Storage loads, **THEN** it falls back safely rather than throwing into gameplay.

## Open Questions

| Question | Current Assumption | Owner | Target Resolution |
|----------|--------------------|-------|-------------------|
| Should recent results history store more than one card? | No for MVP; one latest result is enough. | Product | Post-MVP. |
| Should settings be a separate key? | Single envelope for MVP simplicity. | Technical | Implementation. |
| Should best score compare score or management index first? | Store both independently. | Design | Result UI design. |
