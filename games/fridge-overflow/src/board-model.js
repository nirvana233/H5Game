export function createBoardModel({ cols, rows }) {
  const cells = Array.from({ length: rows }, () => Array(cols).fill(null));
  const instances = new Map();

  function isInside(x, y) {
    return x >= 0 && y >= 0 && x < cols && y < rows;
  }

  function footprintCells(food, x, y) {
    const result = [];
    for (let dy = 0; dy < food.h; dy += 1) {
      for (let dx = 0; dx < food.w; dx += 1) {
        result.push({ x: x + dx, y: y + dy });
      }
    }
    return result;
  }

  function canPlace(food, x, y) {
    return footprintCells(food, x, y).every((cell) => (
      isInside(cell.x, cell.y) && cells[cell.y][cell.x] === null
    ));
  }

  function place({ id, type, food, x, y }) {
    if (!canPlace(food, x, y)) {
      return { ok: false, reason: 'occupied_or_out_of_bounds' };
    }

    const instance = {
      id,
      type,
      x,
      y,
      w: food.w,
      h: food.h,
      cells: footprintCells(food, x, y),
    };

    for (const cell of instance.cells) {
      cells[cell.y][cell.x] = id;
    }
    instances.set(id, instance);
    return { ok: true, instance };
  }

  function removeInstances(ids) {
    for (const id of ids) {
      const instance = instances.get(id);
      if (!instance) continue;
      for (const cell of instance.cells) {
        if (isInside(cell.x, cell.y) && cells[cell.y][cell.x] === id) {
          cells[cell.y][cell.x] = null;
        }
      }
      instances.delete(id);
    }
  }

  function hasAnyLegalPlacement(food) {
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if (canPlace(food, x, y)) {
          return true;
        }
      }
    }
    return false;
  }

  function reset() {
    for (let y = 0; y < rows; y += 1) {
      cells[y].fill(null);
    }
    instances.clear();
  }

  function snapshot() {
    return {
      cols,
      rows,
      cells: cells.map((row) => [...row]),
      instances: [...instances.values()].map((instance) => ({
        ...instance,
        cells: instance.cells.map((cell) => ({ ...cell })),
      })),
    };
  }

  return {
    cols,
    rows,
    canPlace,
    footprintCells,
    hasAnyLegalPlacement,
    place,
    removeInstances,
    reset,
    snapshot,
  };
}
