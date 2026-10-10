// Grid helpers. A grid is { w, h, items: [{ x, y, def: { w, h } }] }.

export function fits(grid, w, h, x, y, ignore = null) {
  if (x < 0 || y < 0 || x + w > grid.w || y + h > grid.h) return false
  return grid.items.every(
    (it) =>
      it === ignore ||
      x >= it.x + it.def.w ||
      it.x >= x + w ||
      y >= it.y + it.def.h ||
      it.y >= y + h,
  )
}

// First free spot scanning row by row, or null when the item doesn't fit.
export function findSpot(grid, w, h) {
  for (let y = 0; y <= grid.h - h; y++) {
    for (let x = 0; x <= grid.w - w; x++) {
      if (fits(grid, w, h, x, y)) return { x, y }
    }
  }
  return null
}

// A random free spot, used to scatter loot around a container.
export function randomSpot(grid, w, h) {
  const spots = []
  for (let y = 0; y <= grid.h - h; y++) {
    for (let x = 0; x <= grid.w - w; x++) {
      if (fits(grid, w, h, x, y)) spots.push({ x, y })
    }
  }
  return spots.length ? spots[Math.floor(Math.random() * spots.length)] : null
}

export function usedCells(grid) {
  return grid.items.reduce((sum, it) => sum + it.def.w * it.def.h, 0)
}
