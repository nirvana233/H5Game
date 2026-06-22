# Test Infrastructure

**Engine**: Web Platform / HTML5 Browser Runtime
**Test Framework**: Node.js built-in test runner
**CI**: `.github/workflows/tests.yml`
**Setup date**: 2026-06-22

## Directory Layout

```text
tests/
  unit/           # isolated tests for formulas, state, and documentation contracts
  integration/    # cross-system and phase-gate smoke tests
  smoke/          # critical path manual smoke checklist
  evidence/       # screenshots and manual test sign-off records
```

## Running Tests

```bash
npm test
```

## Test Naming

- Files: `[system]-[feature].test.js`
- Functions: describe the scenario and expected outcome in plain language.

## Story Type To Test Evidence

| Story Type | Required Evidence | Location |
|------------|-------------------|----------|
| Logic | automated unit test | `tests/unit/` |
| Integration | integration or smoke test | `tests/integration/` |
| Visual / Feel | screenshot plus sign-off | `tests/evidence/` |
| UI | walkthrough or interaction test | `tests/evidence/` |
| Config / Data | smoke check pass | `production/qa/` |

## CI

Tests run on push to `main` and pull requests targeting `main`.
