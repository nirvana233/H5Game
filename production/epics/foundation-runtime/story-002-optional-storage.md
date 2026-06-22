# Story 002: Optional Best-Score Storage

> **Epic**: Foundation Runtime
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Integration
> **Manifest Version**: 2026-06-22

## Context

**GDD**: `design/gdd/storage.md`
**Requirement**: TR-storage-001
**ADR Governing Implementation**: ADR-0004

## Acceptance Criteria

- [x] Best score persists when storage is available.
- [x] Storage failures do not block result or restart.
- [x] Stored payload is version-local to this game.

## Test Evidence

- Manual/static evidence: `production/qa/evidence/fridge-overflow-mvp-evidence.md`
