// Storage helpers. Two kinds of storage hold items:
//   grid: { kind: 'grid', w, h, cells?, items } — items sit at x/y and take def.w × def.h cells
//   slot: { kind: 'slot', accepts, locked?, items } — holds one item whose def.slot matches

import type { GridStorage, Item, ItemDef, Player, SlotStorage, Storage } from './models.ts'

interface Spot {
  x: number
  y: number
}

export function findSlot(slots: SlotStorage[], id: string): SlotStorage {
  const slot = slots.find((s) => s.id === id)
  if (!slot) throw new Error(`Unknown slot: ${id}`)
  return slot
}

// How many cells the grid can use; a bag's last row may be partly blocked.
export function gridCells(grid: GridStorage): number {
  return grid.cells ?? grid.w * grid.h
}

// One storage panel: a grid, or a rig/backpack slot with the grid of the bag worn in it (none when empty).
export interface Section {
  id: string
  name: string
  slot: SlotStorage | null
  grid: GridStorage | null
}

// The storage panels of a player or body in order, with the rig and backpack around the pockets.
export function storageSections(p: Player): Section[] {
  const wornBagSection = (slotId: string): Section[] => {
    const slot = p.slots.find((s) => s.id === slotId)
    return slot ? [{ id: slotId, name: slot.name, slot, grid: slot.items[0]?.storage ?? null }] : []
  }
  const gridSection = (grid: GridStorage): Section => ({ id: grid.id, name: grid.name, slot: null, grid })
  return p.grids.flatMap((grid) =>
    grid.id === 'pockets'
      ? [...wornBagSection('rig'), gridSection(grid), ...wornBagSection('backpack')]
      : [gridSection(grid)],
  )
}

// Every grid that can hold items on a player or body, in panel order.
export function gridsOf(p: Player): GridStorage[] {
  return storageSections(p).flatMap((s) => (s.grid ? [s.grid] : []))
}

// The weapon slots, shown side by side on the character and on a body.
export function weaponSlots(p: Player): SlotStorage[] {
  return p.slots.filter((s) => s.accepts === 'weapon')
}

// The worn gear shown with the weapons; the rig and backpack sit with their grids instead.
export function wornGearSlots(p: Player): SlotStorage[] {
  return p.slots.filter((s) => s.accepts !== 'weapon' && s.accepts !== 'rig' && s.accepts !== 'backpack')
}

export function fits(target: Storage, def: ItemDef, x: number, y: number, ignore: Item | null = null): boolean {
  if (target.kind === 'slot') {
    return !target.locked && def.slot === target.accepts && target.items.every((it) => it === ignore)
  }
  if (x < 0 || y < 0 || x + def.w > target.w || y + def.h > target.h) return false
  // Blocked cells sit at the end of the last row, so checking the bottom-right corner is enough.
  if ((y + def.h - 1) * target.w + x + def.w > gridCells(target)) return false
  return target.items.every(
    (it) =>
      it === ignore ||
      x >= it.x + it.def.w ||
      it.x >= x + def.w ||
      y >= it.y + it.def.h ||
      it.y >= y + def.h,
  )
}

function freeSpots(target: Storage, def: ItemDef): Spot[] {
  if (target.kind === 'slot') return fits(target, def, 0, 0) ? [{ x: 0, y: 0 }] : []
  const spots: Spot[] = []
  for (let y = 0; y <= target.h - def.h; y++) {
    for (let x = 0; x <= target.w - def.w; x++) {
      if (fits(target, def, x, y)) spots.push({ x, y })
    }
  }
  return spots
}

// First free spot scanning row by row, or null when the item doesn't fit.
export function findSpot(target: Storage, def: ItemDef): Spot | null {
  return freeSpots(target, def)[0] ?? null
}

// A random free spot, used to scatter loot around a container.
export function randomSpot(target: Storage, def: ItemDef): Spot | null {
  const spots = freeSpots(target, def)
  return spots.length ? spots[Math.floor(Math.random() * spots.length)] : null
}

// A spot for the item, adding rows to the grid until there is one. Only for grids with no cell cap (the ground).
export function growToFit(grid: GridStorage, def: ItemDef): Spot {
  let spot = findSpot(grid, def)
  while (!spot) {
    grid.h += def.h
    spot = findSpot(grid, def)
  }
  return spot
}

export function usedCells(grid: GridStorage): number {
  return grid.items.reduce((sum, it) => sum + it.def.w * it.def.h, 0)
}
