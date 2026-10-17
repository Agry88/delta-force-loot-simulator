import { findSpot, gridsOf } from './grid.ts'
import type { GearSlot, GridStorage, Item, LootContainer, Player, RaidResult, SlotStorage, SlotType, Storage } from './models.ts'

// Time limits offered on the start screen, in seconds.
export const RAID_DURATIONS = [15, 30, 60, 120]

// How many containers a raid has: one more for every 15 seconds on the clock.
export function containerCount(duration: number): number {
  return Math.ceil(duration / 15) + 1
}

// The item plus any parts attached to it.
function withAttachments(item: Item): Item[] {
  return [item, ...item.attachments.flatMap((s) => s.items)]
}

// Rough weight in kg: a fixed weight per grid cell, attachments included.
export function itemWeight(item: Item): number {
  return withAttachments(item).reduce((t, it) => t + it.def.w * it.def.h * 0.55, 0)
}

// Price of the item with everything attached to it.
export function itemValue(item: Item): number {
  return withAttachments(item).reduce((t, it) => t + it.value, 0)
}

// What everything in the storages is worth, attachments included.
export function carriedValue(storages: Storage[]): number {
  return storages.flatMap((s) => s.items).reduce((t, it) => t + itemValue(it), 0)
}

// Every storage on a player or body, slots first.
const storagesOf = (p: Player): Storage[] => [...p.slots, ...gridsOf(p)]

// The best haul keeps the worn rig and backpack, since another bag would change the space there is to fill.
const KEPT_SLOTS: SlotType[] = ['rig', 'backpack']

// An estimate of the most valuable load the player could walk out with: the priciest gear in each open slot,
// then everything else packed by value per cell into the player's grids. A sharp player can sometimes beat it.
export function bestHaul(player: Player, containers: LootContainer[]): number {
  const kept = player.slots.filter((s) => s.locked || KEPT_SLOTS.includes(s.accepts))
  const pool = [player, ...containers]
    .flatMap(storagesOf)
    .filter((s) => !kept.some((k) => k === s))
    .flatMap((s) => s.items)
    .sort((a, b) => itemValue(b) - itemValue(a))
  let total = carriedValue(kept)
  for (const slot of player.slots.filter((s) => !kept.includes(s))) {
    const i = pool.findIndex((it) => it.def.slot === slot.accepts)
    if (i < 0) continue
    total += itemValue(pool[i])
    pool.splice(i, 1)
  }
  // Packed into empty copies of the grids; bags count as emptied, since what's in them is in the pool too.
  const grids = gridsOf(player).map((g): GridStorage => ({ ...g, items: [] }))
  const density = (it: Item) => itemValue(it) / (it.def.w * it.def.h)
  for (const item of pool.sort((a, b) => density(b) - density(a))) {
    for (const grid of grids) {
      const spot = findSpot(grid, item.def)
      if (!spot) continue
      grid.items.push({ ...item, ...spot })
      total += itemValue(item)
      break
    }
  }
  return total
}

// Whole percent of the best haul's profit made, from 0 to 100.
export function lootShare(profit: number, maxProfit: number): number {
  if (maxProfit <= 0) return 100
  return Math.max(0, Math.min(100, Math.floor((profit / maxProfit) * 100)))
}

// Carried weight in kg: a base kit plus what's carried.
export function carryWeight(storages: Storage[]): number {
  return 9.5 + storages.reduce((sum, s) => sum + s.items.reduce((t, it) => t + itemWeight(it), 0), 0)
}

// Which storage holds the item, if any of them does.
export function storageOf(item: Item, storages: Storage[]): Storage | null {
  return storages.find((s) => s.items.includes(item)) ?? null
}

// The first free attachment slot on the gun that takes this part, if any.
export function freeAttachmentSlot(gun: Item, part: Item): SlotStorage | null {
  if (gun === part) return null
  return gun.attachments.find((s) => !s.items.length && s.accepts === part.def.slot) ?? null
}

// A bag never goes inside itself, and only an empty one can be stowed in a grid.
export function canHold(target: Storage, item: Item): boolean {
  if (!item.storage) return true
  return target !== item.storage && (target.kind === 'slot' || !item.storage.items.length)
}

// The item covering a storage cell (a slot has just the one).
export function itemAt(storage: Storage, cx: number, cy: number): Item | null {
  if (storage.kind === 'slot') return storage.items[0] ?? null
  return storage.items.find((it) => cx >= it.x && cx < it.x + it.def.w && cy >= it.y && cy < it.y + it.def.h) ?? null
}

const GEAR_SLOTS: GearSlot[] = ['weapon', 'helmet', 'armor', 'rig', 'backpack', 'pistol']
const isGearSlot = (slot: SlotType | undefined) => GEAR_SLOTS.some((s) => s === slot)

// What the item dialog offers, depending on the item and where it is.
export type ItemAction = 'equip' | 'unequip' | 'pickUp' | 'putBack' | 'drop'

export function itemActions(item: Item, from: Storage): ItemAction[] {
  if (from.kind === 'slot' && from.locked) return []
  const equip: ItemAction[] = isGearSlot(item.def.slot) ? ['equip'] : []
  if (from.owner === 'loot') return [...equip, 'pickUp']
  return from.kind === 'slot' ? ['unequip', 'putBack', 'drop'] : [...equip, 'putBack', 'drop']
}

// Where each action tries to put the item, first fit wins.
export function itemActionTargets(action: ItemAction, player: Player, loot: LootContainer): Storage[] {
  if (action === 'equip') return player.slots
  if (action === 'putBack') return [...gridsOf(loot), ...loot.slots]
  return gridsOf(player)
}

// Where a click sends an item: loot goes onto the player (slots first if equippable), player items go back to the container.
export function quickMoveTargets(item: Item, from: Storage, player: Player, loot: LootContainer): Storage[] {
  return from.owner === 'loot'
    ? [...(item.def.slot ? player.slots : []), ...gridsOf(player)]
    : [...gridsOf(loot), ...loot.slots]
}

// The worn item a new one would replace: none while a slot it fits is free, else the lowest-rarity one.
export function slotToSwap(item: Item, player: Player): SlotStorage | null {
  const slots = player.slots.filter((s) => s.accepts === item.def.slot && !s.locked)
  if (!slots.length || slots.some((s) => !s.items.length)) return null
  return slots.reduce((a, b) => (wornRarity(b) < wornRarity(a) ? b : a))
}

// Whether the item is rarer than what's worn in the slot.
export function isUpgrade(item: Item, slot: SlotStorage): boolean {
  return wornRarity(slot) < item.def.rarity
}

const wornRarity = (slot: SlotStorage) => slot.items[0]?.def.rarity ?? 0

// startValue is what the player carried in; whatever of it they no longer carry counts as lost.
export function raidResult(storages: Storage[], containersOpened: number, startValue: number, maxProfit: number): RaidResult {
  const carried = storages.flatMap((s) => s.items.flatMap(withAttachments).map((it) => ({ it, where: s.name })))
  const kept = carried.filter(({ it }) => it.owned).reduce((t, { it }) => t + it.value, 0)
  return {
    items: carried.filter(({ it }) => !it.owned).map(({ it, where }) => ({ ...it.def, value: it.value, where })),
    lost: startValue - kept,
    containersOpened,
    maxProfit,
  }
}
