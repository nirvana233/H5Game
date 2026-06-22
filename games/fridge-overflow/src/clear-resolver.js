function areAdjacent(a, b) {
  for (const cellA of a.cells) {
    for (const cellB of b.cells) {
      const distance = Math.abs(cellA.x - cellB.x) + Math.abs(cellA.y - cellB.y);
      if (distance === 1) {
        return true;
      }
    }
  }
  return false;
}

export function resolveClears(boardSnapshot) {
  const byType = new Map();
  for (const instance of boardSnapshot.instances) {
    if (!byType.has(instance.type)) {
      byType.set(instance.type, []);
    }
    byType.get(instance.type).push(instance);
  }

  const clearGroups = [];

  for (const [type, instances] of byType.entries()) {
    const visited = new Set();
    for (const start of instances) {
      if (visited.has(start.id)) continue;

      const group = [];
      const stack = [start];
      visited.add(start.id);

      while (stack.length > 0) {
        const current = stack.pop();
        group.push(current);

        for (const candidate of instances) {
          if (visited.has(candidate.id)) continue;
          if (!areAdjacent(current, candidate)) continue;
          visited.add(candidate.id);
          stack.push(candidate);
        }
      }

      if (group.length >= 3) {
        clearGroups.push({
          type,
          ids: group.map((instance) => instance.id),
          itemCount: group.length,
          cellCount: group.reduce((sum, instance) => sum + instance.cells.length, 0),
        });
      }
    }
  }

  return {
    clearGroups,
    clearedItems: clearGroups.reduce((sum, group) => sum + group.itemCount, 0),
    clearedCells: clearGroups.reduce((sum, group) => sum + group.cellCount, 0),
    multiClearCount: clearGroups.length,
  };
}
