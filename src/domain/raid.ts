import type { Item, LootContainer, Player, RaidResult, Storage } from './models.ts'

// Gear you spawned with doesn't count as loot.
export function lootValue(storages: Storage[]): number {
  return storages.reduce((sum, s) => sum + s.items.reduce((t, it) => t + (it.owned ? 0 : it.value), 0), 0)
}

// Carried weight in kg: a base kit plus a rough weight per occupied cell.
export function carryWeight(storages: Storage[]): number {
  return 9.5 + storages.reduce((sum, s) => sum + s.items.reduce((t, it) => t + it.def.w * it.def.h * 0.55, 0), 0)
}

// Where a click sends an item: loot goes onto the player (slots first if equippable), player items go back to the container.
export function quickMoveTargets(item: Item, from: Storage, player: Player, loot: LootContainer): Storage[] {
  return from.owner === 'loot'
    ? [...(item.def.slot ? player.slots : []), ...player.grids]
    : [...loot.grids, ...loot.slots]
}

export function raidResult(storages: Storage[], containersOpened: number): RaidResult {
  return {
    items: storages.flatMap((s) => s.items.filter((it) => !it.owned).map((it) => ({ ...it.def, value: it.value, where: s.name }))),
    containersOpened,
  }
}
