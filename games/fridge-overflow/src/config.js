export const BOARD_COLS = 6;
export const BOARD_ROWS = 8;

export const GAME_RULES = {
  maxPending: 3,
  maxPressure: 100,
  placementPressureRelief: 5,
  clearPressureReliefPerItem: 8,
  clearStreakBonusRelief: 3,
  placementScorePerCell: 8,
  clearScorePerItem: 80,
  streakScoreBonus: 40,
};

export const FOODS = [
  { type: 'tea', name: '奶茶', shortName: '奶茶', w: 1, h: 1, unlockAt: 0, color: '#d88448' },
  { type: 'leftover', name: '剩菜盒', shortName: '剩菜', w: 1, h: 1, unlockAt: 0, color: '#62b97f' },
  { type: 'egg', name: '鸡蛋盒', shortName: '鸡蛋', w: 2, h: 1, unlockAt: 0, color: '#f0c94a' },
  { type: 'pizza', name: '披萨盒', shortName: '披萨', w: 2, h: 1, unlockAt: 0, color: '#e56b4f' },
  { type: 'gift', name: '年货礼盒', shortName: '年货', w: 1, h: 2, unlockAt: 0, color: '#be6bd8' },
  { type: 'pot', name: '汤锅', shortName: '汤锅', w: 2, h: 2, unlockAt: 20, color: '#6e7e8f' },
  { type: 'fish', name: '冻鱼', shortName: '冻鱼', w: 3, h: 1, unlockAt: 40, color: '#4da7d8' },
];

export const DIFFICULTY_PROFILES = [
  {
    minTime: 0,
    displayLevel: 1,
    turnTimer: 5.0,
    missPressure: 24,
    noSpacePressurePerSecond: 12,
    pressureDecayPerSecond: 4.0,
    weights: { tea: 2, leftover: 2, egg: 1, pizza: 1, gift: 1 },
  },
  {
    minTime: 20,
    displayLevel: 2,
    turnTimer: 4.54,
    missPressure: 31,
    noSpacePressurePerSecond: 18,
    pressureDecayPerSecond: 3.65,
    weights: { tea: 1, leftover: 1, egg: 2, pizza: 1, gift: 1, pot: 1 },
  },
  {
    minTime: 40,
    displayLevel: 3,
    turnTimer: 4.08,
    missPressure: 38,
    noSpacePressurePerSecond: 24,
    pressureDecayPerSecond: 3.3,
    weights: { tea: 1, leftover: 1, egg: 1, pizza: 1, gift: 1, pot: 1, fish: 1 },
  },
  {
    minTime: 60,
    displayLevel: 4,
    turnTimer: 3.47,
    missPressure: 51,
    noSpacePressurePerSecond: 33,
    pressureDecayPerSecond: 2.7,
    weights: { tea: 1, leftover: 1, egg: 1, pizza: 1, gift: 2, pot: 2, fish: 1 },
  },
  {
    minTime: 80,
    displayLevel: 5,
    turnTimer: 2.86,
    missPressure: 64,
    noSpacePressurePerSecond: 42,
    pressureDecayPerSecond: 2.1,
    weights: { tea: 1, leftover: 1, egg: 1, pizza: 1, gift: 2, pot: 3, fish: 2 },
  },
  {
    minTime: 100,
    displayLevel: 6,
    turnTimer: 2.7,
    missPressure: 77,
    noSpacePressurePerSecond: 51,
    pressureDecayPerSecond: 1.5,
    weights: { tea: 1, leftover: 1, egg: 1, pizza: 1, gift: 2, pot: 3, fish: 3 },
  },
];

export function getFood(type) {
  const food = FOODS.find((entry) => entry.type === type);
  if (!food) {
    throw new Error(`Unknown food type: ${type}`);
  }
  return food;
}

export function getDifficultyProfile(elapsedSeconds) {
  let profile = DIFFICULTY_PROFILES[0];
  for (const candidate of DIFFICULTY_PROFILES) {
    if (elapsedSeconds >= candidate.minTime) {
      profile = candidate;
    }
  }
  return profile;
}

export function createSeededRandom(seed) {
  let value = seed >>> 0;
  return function nextRandom() {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function chooseWeightedFood(profile, random, recentTypes = []) {
  const entries = Object.entries(profile.weights);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    let roll = random() * total;
    let selected = entries[0][0];
    for (const [type, weight] of entries) {
      roll -= weight;
      if (roll <= 0) {
        selected = type;
        break;
      }
    }

    const lastThree = recentTypes.slice(-3);
    const sameStreak = lastThree.length === 3 && lastThree.every((type) => type === selected);
    const largeStreak = lastThree.length === 3
      && lastThree.every((type) => ['pot', 'fish'].includes(type))
      && ['pot', 'fish'].includes(selected);

    if (!sameStreak && !largeStreak) {
      return getFood(selected);
    }
  }

  return getFood(entries[0][0]);
}
