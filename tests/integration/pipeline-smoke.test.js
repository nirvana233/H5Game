import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function assertMeaningfulFile(path) {
  const absolute = join(root, path);
  assert.equal(existsSync(absolute), true, `${path} should exist`);
  assert.ok(statSync(absolute).size > 200, `${path} should contain meaningful content`);
}

test('technical setup gate artifacts are present', () => {
  for (const path of [
    'AGENTS.md',
    '.Codex/docs/technical-preferences.md',
    'docs/engine-reference/web-platform/VERSION.md',
    'docs/architecture/architecture.md',
    'docs/architecture/requirements-traceability.md',
    'docs/architecture/control-manifest.md',
    'design/art/art-bible.md',
    'design/accessibility-requirements.md',
    'design/ux/interaction-patterns.md',
    'design/ux/hud.md',
    'tests/README.md',
    'tests/smoke/critical-paths.md',
    '.github/workflows/tests.yml',
    'production/gate-checks/technical-setup-to-pre-production-2026-06-22.md',
  ]) {
    assertMeaningfulFile(path);
  }

  assert.equal(existsSync(join(root, 'tests/unit')), true);
  assert.equal(existsSync(join(root, 'tests/integration')), true);
});

test('CI and package scripts run the Node smoke suite', () => {
  const packageJson = JSON.parse(read('package.json'));
  assert.equal(packageJson.scripts.test, 'node --test');

  const workflow = read('.github/workflows/tests.yml');
  assert.match(workflow, /npm test/);
  assert.match(workflow, /actions\/checkout@v4/);
  assert.match(workflow, /actions\/setup-node@v4/);
});

test('phase state advances only after PASS gate reports exist', () => {
  const gate = read('production/gate-checks/technical-setup-to-pre-production-2026-06-22.md');
  assert.match(gate, /### Verdict: PASS/);
  assert.match(gate, /Required Artifacts: 13\/13 present/);
  assert.match(gate, /Quality Checks: 9\/9 passing/);

  const productionGate = read('production/gate-checks/pre-production-to-production-2026-06-22.md');
  assert.match(productionGate, /### Verdict: PASS/);
  assert.match(productionGate, /Playable build: `games\/fridge-overflow\/index\.html`/);

  const stage = read('production/stage.txt').trim();
  assert.equal(stage, 'Production');
});
