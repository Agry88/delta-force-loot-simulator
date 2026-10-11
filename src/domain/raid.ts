import { gridsOf } from './grid.ts'
import type { GearSlot, Item, LootContainer, Player, RaidResult, SlotStorage, SlotType, Storage } from './models.ts'

// Time limits offered on the start screen, in seconds.
export const RAID_DURATIONS = [15, 30, 60, 120]

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

// Gear you spawned with doesn't count as loot.
export function lootValue(storages: Storage[]): number {
  return storages
    .flatMap((s) => s.items.flatMap(withAttachments))
    .reduce((t, it) => t + (it.owned ? 0 : it.value), 0)
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

const GEAR_SLOTS: GearSlot[] = ['weapon', 'helmet', 'armor', 'rig', 'backpack', 'pistol', 'melee']
const isGearSlot = (slot: SlotType | undefined) => GEAR_SLOTS.some((s) => s === slot)

// What the item dialog offers, depending on the item and where it is.
export type ItemAction = 'equip' | 'unequip' | 'pickUp' | 'putBack'

export function itemActions(item: Item, from: Storage): ItemAction[] {
  if (from.kind === 'slot' && from.locked) return []
  const equip: ItemAction[] = isGearSlot(item.def.slot) ? ['equip'] : []
  if (from.owner === 'loot') return [...equip, 'pickUp']
  return from.kind === 'slot' ? ['unequip', 'putBack'] : [...equip, 'putBack']
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

export function raidResult(storages: Storage[], containersOpened: number): RaidResult {
  return {
    items: storages.flatMap((s) => s.items.flatMap(withAttachments).filter((it) => !it.owned).map((it) => ({ ...it.def, value: it.value, where: s.name }))),
    containersOpened,
  }
}
