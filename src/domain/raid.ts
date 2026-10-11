import type { Item, LootContainer, Player, RaidResult, SlotStorage, Storage } from './models.ts'

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

// The first free attachment slot on the gun that takes this part.
export function freeAttachmentSlot(gun: Item, part: Item): SlotStorage | null {
  return gun.attachments.find((s) => !s.items.length && s.accepts === part.def.slot) ?? null
}

// What the weapon dialog offers for a gun, depending on where it is.
export type GunAction = 'equip' | 'unequip' | 'pickUp' | 'putBack'

export function gunActions(from: Storage): GunAction[] {
  if (from.owner === 'loot') return ['equip', 'pickUp']
  return from.kind === 'slot' ? ['unequip', 'putBack'] : ['equip', 'putBack']
}

// Where each action tries to put the gun, first fit wins.
export function gunActionTargets(action: GunAction, player: Player, loot: LootContainer): Storage[] {
  if (action === 'equip') return player.slots
  if (action === 'putBack') return [...loot.grids, ...loot.slots]
  return player.grids
}

// Where a click sends an item: loot goes onto the player (slots first if equippable), player items go back to the container.
export function quickMoveTargets(item: Item, from: Storage, player: Player, loot: LootContainer): Storage[] {
  return from.owner === 'loot'
    ? [...(item.def.slot ? player.slots : []), ...player.grids]
    : [...loot.grids, ...loot.slots]
}

export function raidResult(storages: Storage[], containersOpened: number): RaidResult {
  return {
    items: storages.flatMap((s) => s.items.flatMap(withAttachments).filter((it) => !it.owned).map((it) => ({ ...it.def, value: it.value, where: s.name }))),
    containersOpened,
  }
}
