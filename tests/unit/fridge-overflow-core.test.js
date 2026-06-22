import assert from 'node:assert/strict';
import test from 'node:test';

import { createBoardModel } from '../../games/fridge-overflow/src/board-model.js';
import { resolveClears } from '../../games/fridge-overflow/src/clear-resolver.js';
import {
  BOARD_COLS,
  BOARD_ROWS,
  chooseWeightedFood,
  getDifficultyProfile,
  getFood,
} from '../../games/fridge-overflow/src/config.js';

test('board model places multi-cell food only inside empty cells', () => {
  const board = createBoardModel({ cols: BOARD_COLS, rows: BOARD_ROWS });
  const pizza = getFood('pizza');

  assert.equal(board.canPlace(pizza, 0, 0), true);
  const first = board.place({ id: 'a', type: 'pizza', food: pizza, x: 0, y: 0 });
  assert.equal(first.ok, true);

  assert.equal(board.canPlace(pizza, 1, 0), false, 'overlap should be rejected');
  assert.equal(board.canPlace(pizza, 5, 0), false, 'out-of-bounds footprint should be rejected');
  assert.equal(board.hasAnyLegalPlacement(getFood('fish')), true);
});

test('clear resolver clears three adjacent same-type food instances', () => {
  const board = createBoardModel({ cols: BOARD_COLS, rows: BOARD_ROWS });
  const tea = getFood('tea');

  board.place({ id: 'a', type: 'tea', food: tea, x: 0, y: 0 });
  board.place({ id: 'b', type: 'tea', food: tea, x: 1, y: 0 });
  board.place({ id: 'c', type: 'tea', food: tea, x: 2, y: 0 });

  const result = resolveClears(board.snapshot());
  assert.equal(result.clearGroups.length, 1);
  assert.deepEqual(result.clearGroups[0].ids.sort(), ['a', 'b', 'c']);
  assert.equal(result.clearedItems, 3);
  assert.equal(result.clearedCells, 3);
});

test('clear resolver counts multi-cell foods by instance and releases all cells', () => {
  const board = createBoardModel({ cols: BOARD_COLS, rows: BOARD_ROWS });
  const egg = getFood('egg');

  board.place({ id: 'a', type: 'egg', food: egg, x: 0, y: 0 });
  board.place({ id: 'b', type: 'egg', food: egg, x: 2, y: 0 });
  board.place({ id: 'c', type: 'egg', food: egg, x: 4, y: 0 });

  const result = resolveClears(board.snapshot());
  assert.equal(result.clearGroups.length, 1);
  assert.equal(result.clearedItems, 3);
  assert.equal(result.clearedCells, 6);

  board.removeInstances(result.clearGroups[0].ids);
  assert.equal(board.snapshot().instances.length, 0);
});

test('difficulty profile unlocks more food types over time', () => {
  assert.equal(Object.keys(getDifficultyProfile(0).weights).length, 5);
  assert.equal(Object.keys(getDifficultyProfile(20).weights).includes('pot'), true);
  assert.equal(Object.keys(getDifficultyProfile(40).weights).includes('fish'), true);
  assert.equal(getDifficultyProfile(100).turnTimer, 2.7);
});

test('weighted food choice does not treat short history as a streak', () => {
  const profile = { weights: { pot: 1 } };
  const selected = chooseWeightedFood(profile, () => 0, []);
  assert.equal(selected.type, 'pot');
});
