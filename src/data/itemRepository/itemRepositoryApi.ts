import type { Category, ItemDef, Rarity, SlotType } from '../../domain/models.ts'
import type { ItemRepository } from './itemRepository.ts'
import catalog from './catalog.json'

// Real items, prices and icons snapshotted from deltaforceapi.com by `pnpm sync-items`.
// Each entry: { id, name, type, sub, quality, w, h, price } with w/h in grid cells.
type CatalogEntry = (typeof catalog.items)[number]

const ICON_URL = (id: string) => `https://cdn.deltaforceapi.com/deltaforceapi/item/${id}/icon.png`

// Weapons have no quality in the API, so their rarity comes from price.
const WEAPON_RARITY_PRICE: [number, Rarity][] = [[15000, 1], [40000, 2], [100000, 3], [200000, 4], [500000, 5]]

const MAG_SIZE: Record<string, number> = {
  WEAPON_ASSAULT_RIFLE: 30,
  WEAPON_SMG: 30,
  WEAPON_LMG: 100,
  WEAPON_MARKSMAN_RIFLE: 20,
  WEAPON_SNIPER_RIFLE: 5,
  WEAPON_SHOTGUN: 7,
  WEAPON_PISTOL: 15,
}

// Max durability of helmets and body armor by rarity.
const DURABILITY: Record<Rarity, number> = { 1: 20, 2: 25, 3: 38, 4: 50, 5: 61, 6: 75 }

const CATEGORY_BY_SUB: Record<string, Category> = {
  COLLECTIBLE_MEDICAL_ITEM: 'med',
  COLLECTIBLE_ELECTRONIC_PRODUCT: 'tech',
  COLLECTIBLE_CRAFTWORK: 'valuable',
  CONSUMABLE_ARMOR_REP: 'misc',
}
const CATEGORY_BY_TYPE: Record<string, Category> = { WEAPON: 'weapon', WEAPON_PART: 'part', GEAR: 'gear', AMMO: 'ammo', CONSUMABLE: 'med', KEYCARD: 'valuable' }

const SLOT_BY_SUB: Record<string, SlotType> = { WEAPON_PISTOL: 'pistol', GEAR_HELMET: 'helmet', GEAR_VEST: 'armor' }

function toDef(it: CatalogEntry): ItemDef {
  const rarity: Rarity =
    it.type === 'WEAPON'
      ? (WEAPON_RARITY_PRICE.find(([max]) => it.price < max)?.[1] ?? 6)
      : (Math.min(6, Math.max(1, it.quality)) as Rarity)
  const slot = SLOT_BY_SUB[it.sub] ?? (it.type === 'WEAPON' ? 'weapon' : undefined)
  return {
    name: it.name,
    img: ICON_URL(it.id),
    cat: CATEGORY_BY_SUB[it.sub] ?? CATEGORY_BY_TYPE[it.type] ?? 'misc',
    slot,
    rarity,
    w: it.w,
    h: it.h,
    value: it.price,
    mag: MAG_SIZE[it.sub],
    dur: slot === 'helmet' || slot === 'armor' ? DURABILITY[rarity] : undefined,
  }
}

// Items from the deltaforceapi.com snapshot. The API has no melee weapons, so the knife stays hand-made.
export class ItemRepositoryApi implements ItemRepository {
  private readonly items: ItemDef[] = [
    ...catalog.items.map(toDef),
    { name: 'Combat Knife', icon: '🔪', cat: 'weapon', slot: 'melee', rarity: 1, w: 2, h: 1, value: 1500 },
  ]

  getAll(): ItemDef[] {
    return this.items
  }

  getByName(name: string): ItemDef {
    const def = this.items.find((d) => d.name === name)
    if (!def) throw new Error(`Unknown item: ${name}`)
    return def
  }
}
