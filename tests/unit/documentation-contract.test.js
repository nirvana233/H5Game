import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function assertExists(path) {
  assert.equal(existsSync(join(root, path)), true, `${path} should exist`);
}

test('systems index has fourteen approved MVP systems', () => {
  const index = read('design/gdd/systems-index.md');
  const approvedMvpRows = index
    .split('\n')
    .filter((line) => /^\| \d+ \|/.test(line))
    .filter((line) => line.includes('| MVP | Approved |'))
    .filter((line) => line.includes('design/gdd/'));

  assert.equal(approvedMvpRows.length, 14);
  assert.match(index, /\| MVP systems designed \| 14\/14 \|/);
});

test('architecture and ADRs include required compatibility and GDD linkage sections', () => {
  assertExists('docs/architecture/architecture.md');
  assertExists('docs/architecture/requirements-traceability.md');
  assertExists('docs/architecture/architecture-review-2026-06-22.md');

  for (let i = 1; i <= 5; i += 1) {
    const id = String(i).padStart(4, '0');
    const matches = [
      'web-platform-static-runtime',
      'deterministic-session-runtime',
      'pure-logic-gameplay-modules',
      'local-storage-adapter',
      'node-smoke-test-harness',
    ];
    const body = read(`docs/architecture/adr-${id}-${matches[i - 1]}.md`);
    assert.match(body, /## Status\s+Accepted/s, `ADR-${id} should be accepted`);
    assert.match(body, /## Engine Compatibility/, `ADR-${id} should stamp engine compatibility`);
    assert.match(body, /## GDD Requirements Addressed/, `ADR-${id} should link GDD requirements`);
    assert.match(body, /## ADR Dependencies/, `ADR-${id} should document dependencies`);
  }
});

test('art bible, accessibility, and UX baseline are initialized with real content', () => {
  const art = read('design/art/art-bible.md');
  for (const heading of [
    '## 1. Visual Identity Statement',
    '## 2. Mood & Atmosphere',
    '## 3. Shape Language',
    '## 4. Color System',
  ]) {
    assert.match(art, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(art, /\[To be designed\]/);

  const accessibility = read('design/accessibility-requirements.md');
  assert.match(accessibility, /\*\*Tier\*\*: Basic\+ Mobile H5/);
  assert.match(accessibility, /Color independence/);

  const patterns = read('design/ux/interaction-patterns.md');
  assert.match(patterns, /Single Active Drag/);
  assert.match(patterns, /Footprint Preview/);

  const hud = read('design/ux/hud.md');
  assert.match(hud, /## HUD Philosophy/);
  assert.match(hud, /390x844/);
});
