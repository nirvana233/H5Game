import {
  BOARD_COLS,
  BOARD_ROWS,
  FOODS,
  GAME_RULES,
  chooseWeightedFood,
  createSeededRandom,
  getDifficultyProfile,
} from './config.js';
import { createBoardModel } from './board-model.js';
import { resolveClears } from './clear-resolver.js';

const root = document.querySelector('[data-game]');
const boardEl = document.querySelector('[data-board]');
const boardCellsEl = document.querySelector('[data-board-cells]');
const boardLayerEl = document.querySelector('[data-board-layer]');
const conveyorEl = document.querySelector('[data-conveyor]');
const scoreEl = document.querySelector('[data-score]');
const bestEl = document.querySelector('[data-best]');
const levelEl = document.querySelector('[data-level]');
const typeCountEl = document.querySelector('[data-type-count]');
const timerFillEl = document.querySelector('[data-timer-fill]');
const pressureFillEl = document.querySelector('[data-pressure-fill]');
const pressureTextEl = document.querySelector('[data-pressure-text]');
const pendingEl = document.querySelector('[data-pending]');
const statusEl = document.querySelector('[data-status]');
const resultEl = document.querySelector('[data-result]');
const resultTitleEl = document.querySelector('[data-result-title]');
const resultBodyEl = document.querySelector('[data-result-body]');
const resultStatsEl = document.querySelector('[data-result-stats]');
const restartButtons = document.querySelectorAll('[data-restart]');
const shareButton = document.querySelector('[data-share]');

const storageKey = 'fridge-overflow-v1';
const board = createBoardModel({ cols: BOARD_COLS, rows: BOARD_ROWS });
const random = createSeededRandom(Date.now());
const placedElements = new Map();

let cellSize = 48;
let state = 'ready';
let runStartedAt = performance.now();
let lastFrameAt = performance.now();
let nextId = 1;
let currentFood = null;
let currentEl = null;
let currentTimeLimit = 5;
let currentTimeRemaining = 5;
let activePointerId = null;
let dragOffset = { x: 0, y: 0 };
let dragCandidate = null;
let score = 0;
let bestScore = loadBestScore();
let pressure = 0;
let pending = 0;
let clearStreak = 0;
let clearedTotal = 0;
let recentTypes = [];
let failureCause = 'none';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function loadBestScore() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Number.isFinite(parsed.bestScore) ? parsed.bestScore : 0;
  } catch {
    return 0;
  }
}

function saveBestScore() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ bestScore }));
  } catch {
    // Storage is optional by architecture; gameplay continues if it fails.
  }
}

function elapsedSeconds() {
  return (performance.now() - runStartedAt) / 1000;
}

function currentProfile() {
  return getDifficultyProfile(elapsedSeconds());
}

function activeTypeCount(profile) {
  return Object.keys(profile.weights).length;
}

function createBoardCells() {
  boardCellsEl.innerHTML = '';
  for (let i = 0; i < BOARD_COLS * BOARD_ROWS; i += 1) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    boardCellsEl.appendChild(cell);
  }
}

function syncLayout() {
  const rect = boardEl.getBoundingClientRect();
  cellSize = rect.width / BOARD_COLS;
  root.style.setProperty('--cell-size', `${cellSize}px`);

  for (const [id, el] of placedElements.entries()) {
    const instance = board.snapshot().instances.find((entry) => entry.id === id);
    if (instance) positionPlacedElement(el, instance);
  }

  if (currentEl && state !== 'dragging') {
    positionCurrentAtHome();
  }
}

function cellIndex(x, y) {
  return y * BOARD_COLS + x;
}

function clearPreview() {
  for (const cell of boardCellsEl.children) {
    cell.classList.remove('preview-ok', 'preview-bad');
  }
}

function renderPreview(candidate) {
  clearPreview();
  if (!currentFood || !candidate) return;
  const canPlace = board.canPlace(currentFood, candidate.x, candidate.y);
  const className = canPlace ? 'preview-ok' : 'preview-bad';
  for (const cell of board.footprintCells(currentFood, candidate.x, candidate.y)) {
    if (cell.x < 0 || cell.y < 0 || cell.x >= BOARD_COLS || cell.y >= BOARD_ROWS) continue;
    boardCellsEl.children[cellIndex(cell.x, cell.y)].classList.add(className);
  }
}

function positionPlacedElement(el, instance) {
  el.style.left = `${instance.x * cellSize}px`;
  el.style.top = `${instance.y * cellSize}px`;
  el.style.width = `${instance.w * cellSize}px`;
  el.style.height = `${instance.h * cellSize}px`;
}

function createFoodElement(food, className) {
  const el = document.createElement('div');
  el.className = className;
  el.style.background = food.color;
  el.innerHTML = `<span>${food.shortName}</span>`;
  el.setAttribute('aria-label', food.name);
  return el;
}

function positionCurrentAtHome() {
  const conveyorRect = conveyorEl.getBoundingClientRect();
  const rootRect = root.getBoundingClientRect();
  const width = currentFood.w * cellSize;
  const height = currentFood.h * cellSize;
  currentEl.style.width = `${width}px`;
  currentEl.style.height = `${height}px`;
  currentEl.style.left = `${conveyorRect.left - rootRect.left + conveyorRect.width / 2 - width / 2}px`;
  currentEl.style.top = `${conveyorRect.top - rootRect.top + 42}px`;
}

function spawnCurrentFood() {
  if (state === 'gameover') return;
  const profile = currentProfile();
  currentFood = chooseWeightedFood(profile, random, recentTypes);
  recentTypes.push(currentFood.type);
  recentTypes = recentTypes.slice(-6);
  currentTimeLimit = profile.turnTimer;
  currentTimeRemaining = profile.turnTimer;

  if (currentEl) currentEl.remove();
  currentEl = createFoodElement(currentFood, 'current-food');
  root.appendChild(currentEl);
  currentEl.addEventListener('pointerdown', onPointerDown);
  positionCurrentAtHome();
  state = 'ready';
  statusEl.textContent = `拖动 ${currentFood.name} 放进冰箱`;
  updateHud();
}

function addPlacedElement(instance) {
  const food = FOODS.find((entry) => entry.type === instance.type);
  const el = createFoodElement(food, 'placed-food');
  el.dataset.id = instance.id;
  boardLayerEl.appendChild(el);
  placedElements.set(instance.id, el);
  positionPlacedElement(el, instance);
}

function resolveAfterPlacement() {
  let totalClearedThisPlacement = 0;
  let multiClearCount = 0;

  while (true) {
    const result = resolveClears(board.snapshot());
    if (result.clearGroups.length === 0) break;

    const ids = result.clearGroups.flatMap((group) => group.ids);
    for (const id of ids) {
      const el = placedElements.get(id);
      if (el) {
        el.classList.add('clear-out');
        setTimeout(() => el.remove(), 220);
        placedElements.delete(id);
      }
    }

    board.removeInstances(ids);
    totalClearedThisPlacement += result.clearedItems;
    multiClearCount += result.multiClearCount;
  }

  if (totalClearedThisPlacement > 0) {
    clearStreak += 1;
    clearedTotal += totalClearedThisPlacement;
    score += totalClearedThisPlacement * GAME_RULES.clearScorePerItem;
    score += clearStreak * GAME_RULES.streakScoreBonus;
    score += Math.max(0, multiClearCount - 1) * 120;
    pressure = clamp(
      pressure
        - totalClearedThisPlacement * GAME_RULES.clearPressureReliefPerItem
        - clearStreak * GAME_RULES.clearStreakBonusRelief,
      0,
      GAME_RULES.maxPressure,
    );
    statusEl.textContent = `清掉 ${totalClearedThisPlacement} 件，连消 x${clearStreak}`;
  } else {
    clearStreak = 0;
    statusEl.textContent = '没有消除，继续留空间';
  }

  updateHud();
  setTimeout(spawnCurrentFood, totalClearedThisPlacement > 0 ? 280 : 120);
}

function placeCurrentFood(candidate) {
  const id = `f${nextId}`;
  nextId += 1;
  const result = board.place({
    id,
    type: currentFood.type,
    food: currentFood,
    x: candidate.x,
    y: candidate.y,
  });
  if (!result.ok) return false;

  score += currentFood.w * currentFood.h * GAME_RULES.placementScorePerCell;
  pressure = clamp(pressure - GAME_RULES.placementPressureRelief, 0, GAME_RULES.maxPressure);
  addPlacedElement(result.instance);
  currentEl.remove();
  currentEl = null;
  currentFood = null;
  clearPreview();
  state = 'resolving';
  resolveAfterPlacement();
  return true;
}

function missCurrentFood() {
  if (!currentFood || state === 'gameover') return;
  const profile = currentProfile();
  pending += 1;
  pressure = clamp(pressure + profile.missPressure, 0, GAME_RULES.maxPressure);
  clearStreak = 0;
  statusEl.textContent = '超时了，待处理区增加';
  if (pending >= GAME_RULES.maxPending) {
    endGame('pending_full');
    return;
  }
  currentEl.remove();
  currentEl = null;
  currentFood = null;
  setTimeout(spawnCurrentFood, 160);
}

function endGame(cause) {
  state = 'gameover';
  failureCause = cause;
  if (currentEl) {
    currentEl.remove();
    currentEl = null;
  }
  clearPreview();

  const survived = Math.floor(elapsedSeconds());
  const index = clamp(Math.round(score / 35 + clearedTotal * 4 + survived - pending * 12), 0, 100);
  const title = index >= 85 ? '年货空间规划大师' : index >= 60 ? '冰箱救场达人' : '爆仓边缘整理员';
  const reason = cause === 'pending_full' ? '待处理食物堆满了' : '冰箱压力爆表了';

  bestScore = Math.max(bestScore, score);
  saveBestScore();

  resultTitleEl.textContent = title;
  resultBodyEl.textContent = `冰箱管理指数 ${index}%。爆仓原因：${reason}。`;
  resultStatsEl.textContent = `分数 ${score} · 存活 ${survived}s · 清掉 ${clearedTotal} 件 · 待处理 ${pending}/3`;
  resultEl.classList.remove('hidden');
  updateHud();
}

function resetGame() {
  board.reset();
  boardLayerEl.innerHTML = '';
  placedElements.clear();
  clearPreview();
  state = 'ready';
  runStartedAt = performance.now();
  lastFrameAt = performance.now();
  nextId = 1;
  currentFood = null;
  pressure = 0;
  pending = 0;
  score = 0;
  clearStreak = 0;
  clearedTotal = 0;
  recentTypes = [];
  failureCause = 'none';
  resultEl.classList.add('hidden');
  spawnCurrentFood();
  updateHud();
}

function candidateFromPointer(event) {
  const boardRect = boardEl.getBoundingClientRect();
  const x = Math.round((event.clientX - boardRect.left - dragOffset.x) / cellSize);
  const y = Math.round((event.clientY - boardRect.top - dragOffset.y) / cellSize);
  return { x, y };
}

function onPointerDown(event) {
  if (state !== 'ready' || !currentEl || activePointerId !== null) return;
  activePointerId = event.pointerId;
  currentEl.setPointerCapture(event.pointerId);
  const rect = currentEl.getBoundingClientRect();
  dragOffset = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
  currentEl.classList.add('dragging');
  state = 'dragging';
  onPointerMove(event);
}

function onPointerMove(event) {
  if (state !== 'dragging' || event.pointerId !== activePointerId) return;
  const rootRect = root.getBoundingClientRect();
  currentEl.style.left = `${event.clientX - rootRect.left - dragOffset.x}px`;
  currentEl.style.top = `${event.clientY - rootRect.top - dragOffset.y}px`;
  dragCandidate = candidateFromPointer(event);
  renderPreview(dragCandidate);
}

function cancelDrag() {
  if (!currentEl) return;
  currentEl.classList.remove('dragging');
  activePointerId = null;
  dragCandidate = null;
  clearPreview();
  positionCurrentAtHome();
  if (state !== 'gameover') state = 'ready';
}

function onPointerUp(event) {
  if (state !== 'dragging' || event.pointerId !== activePointerId) return;
  const candidate = dragCandidate;
  currentEl.classList.remove('dragging');
  activePointerId = null;
  dragCandidate = null;

  if (candidate && board.canPlace(currentFood, candidate.x, candidate.y)) {
    placeCurrentFood(candidate);
  } else {
    statusEl.textContent = '这里放不下，换个位置';
    cancelDrag();
  }
}

function updateHud() {
  const profile = currentProfile();
  scoreEl.textContent = String(score);
  bestEl.textContent = String(bestScore);
  levelEl.textContent = String(profile.displayLevel);
  typeCountEl.textContent = String(activeTypeCount(profile));
  timerFillEl.style.width = `${clamp((currentTimeRemaining / currentTimeLimit) * 100, 0, 100)}%`;
  pressureFillEl.style.width = `${pressure}%`;
  pressureTextEl.textContent = `${Math.round(pressure)}%`;
  pressureFillEl.classList.toggle('danger', pressure >= 70);
  root.classList.toggle('danger', pressure >= 85);

  for (const [index, slot] of [...pendingEl.children].entries()) {
    slot.classList.toggle('full', index < pending);
  }
}

function tick(now) {
  const dt = Math.min((now - lastFrameAt) / 1000, 0.05);
  lastFrameAt = now;

  if ((state === 'ready' || state === 'dragging') && currentFood) {
    const profile = currentProfile();
    currentTimeRemaining -= dt;

    if (board.hasAnyLegalPlacement(currentFood)) {
      pressure = clamp(pressure - profile.pressureDecayPerSecond * dt, 0, GAME_RULES.maxPressure);
    } else {
      pressure = clamp(pressure + profile.noSpacePressurePerSecond * dt, 0, GAME_RULES.maxPressure);
      statusEl.textContent = '当前食物没有位置了，压力上升';
    }

    if (currentTimeRemaining <= 0) {
      missCurrentFood();
    } else if (pressure >= GAME_RULES.maxPressure) {
      endGame('pressure_full');
    }
  }

  updateHud();
  requestAnimationFrame(tick);
}

async function shareResult() {
  const text = `${resultTitleEl.textContent}：${resultBodyEl.textContent} ${resultStatsEl.textContent}`;
  if (navigator.share) {
    await navigator.share({ title: '冰箱爆仓了', text });
    return;
  }
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    statusEl.textContent = '成绩已复制';
  }
}

function bindEvents() {
  window.addEventListener('resize', syncLayout);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', cancelDrag);
  window.addEventListener('blur', cancelDrag);
  for (const button of restartButtons) {
    button.addEventListener('click', resetGame);
  }
  shareButton.addEventListener('click', () => {
    shareResult().catch(() => {
      statusEl.textContent = '当前浏览器不支持分享，先截图也可以';
    });
  });
}

createBoardCells();
bindEvents();
syncLayout();
resetGame();
requestAnimationFrame(tick);
