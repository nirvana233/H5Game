# ADR-0004: Local Storage Adapter

## Status

Accepted — 2026-06-22

## Context

MVP needs local best score, best management index, aggregate stats, and settings. Browser storage can fail in private modes or quota-restricted environments, so gameplay must not depend on successful persistence.

## Decision

Use a small Storage Adapter around Web Storage. It stores a versioned JSON envelope, catches read/write failures, returns defaults on corrupt data, and never blocks result display or restart.

## Consequences

- No account/cloud sync in MVP.
- Storage writes occur after result payloads or settings changes.
- Result UI can show in-memory results even if persistence fails.
- Future cloud save or daily challenge sync can replace the adapter without changing scoring rules.

## Engine Compatibility

- Engine: Web Platform / HTML5 Browser Runtime
- APIs: `localStorage`, JSON serialization
- Reference: `docs/engine-reference/web-platform/modules/storage.md`
- Risk: LOW/MEDIUM because browser privacy settings can block storage.

## GDD Requirements Addressed

- TR-storage-001

## ADR Dependencies

- Depends On: ADR-0001
- Enables: result persistence and Storage GDD implementation.
