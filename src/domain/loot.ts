import type { ItemRepository } from '../data/itemRepository/itemRepository.ts'
import { findSlot, randomSpot } from './grid.ts'
import type { Category, GridStorage, Item, ItemDef, LootContainer, LootMode, Owner, PartSlot, Player, Rarity, SlotStorage, SlotType } from './models.ts'
import { RARITY_WEIGHT } from './rarity.ts'

export const LOOT_MODES: LootMode[] = ['both', 'crate', 'body']

// Weapon parts outnumber everything else in the API, so they drop less often per item.
const CATEGORY_WEIGHT: Partial<Record<Category, number>> = { part: 0.3 }

// Equipment slots, shared by the player and enemy bodies.
const SLOTS: Pick<SlotStorage, 'id' | 'name' | 'accepts' | 'label' | 'wide'>[] = [
  { id: 'weapon1', name: 'Primary Weapon', accepts: 'weapon', label: '1', wide: true },
  { id: 'weapon2', name: 'Secondary Weapon', accepts: 'weapon', label: '2', wide: true },
  { id: 'helmet', name: 'Helmet', accepts: 'helmet' },
  { id: 'armor', name: 'Body Armor', accepts: 'armor' },
  { id: 'pistol', name: 'Pistol', accepts: 'pistol' },
  { id: 'melee', name: 'Melee', accepts: 'melee' },
]

interface AttachmentSlot {
  id: string
  name: string
  accepts: PartSlot
}

// A rifle's attachment slots, in the order the attachment screen lists them.
const ATTACHMENT_SLOTS: AttachmentSlot[] = [
  { id: 'rearGrip', name: 'Rear Grip', accepts: 'rearGrip' },
  { id: 'barrel', name: 'Barrel', accepts: 'barrel' },
  { id: 'muzzle', name: 'Muzzle', accepts: 'muzzle' },
  { id: 'stock', name: 'Stock', accepts: 'stock' },
  { id: 'foregrip', name: 'Foregrip', accepts: 'foregrip' },
  { id: 'bipod', name: 'Rail Bipod', accepts: 'bipod' },
  { id: 'topRail', name: 'Top Rail', accepts: 'rail' },
  { id: 'leftRail', name: 'Left Rail', accepts: 'tactical' },
  { id: 'rightRail', name: 'Right Rail', accepts: 'tactical' },
  { id: 'topPanel', name: 'Top Panel', accepts: 'panel' },
  { id: 'leftPanel', name: 'Left Panel', accepts: 'panel' },
  { id: 'rightPanel', name: 'Right Panel', accepts: 'panel' },
  { id: 'magazine', name: 'Magazine', accepts: 'magazine' },
  { id: 'magWell', name: 'Mag Well', accepts: 'magWell' },
  { id: 'optic', name: 'Optic', accepts: 'sight' },
  { id: 'sideSight', name: 'Side Sight', accepts: 'sight' },
]
const PISTOL_ATTACHMENTS = ['rearGrip', 'barrel', 'muzzle', 'rightRail', 'magazine', 'optic']

// These parts only fit one gun family, so random rolls only use parts named after the gun (e.g. "AKM 40-Round Extended Mag").
const GUN_SPECIFIC: PartSlot[] = ['barrel', 'stock', 'magazine']

// Chance each attachment slot comes filled.
const ATTACHMENT_CHANCE = 0.35

// Chance an enemy body has something in each slot.
const BODY_SLOT_CHANCE: Record<string, number> = { weapon1: 0.8, weapon2: 0.35, helmet: 0.6, armor: 0.6, pistol: 0.45, melee: 0.5 }

interface PickOptions {
  prefer?: Category[]
  // Multiplies the weight of Epic and better items.
  luck?: number
  slot?: SlotType | null
}

interface CrateType extends PickOptions {
  name: string
  icon: string
  w: number
  h: number
  count: [number, number]
}

const CRATE_TYPES: CrateType[] = [
  { name: 'Weapon Case', icon: '🧳', w: 7, h: 4, count: [3, 6], prefer: ['weapon', 'ammo', 'part'], luck: 1.3 },
  { name: 'Medical Crate', icon: '🧰', w: 6, h: 4, count: [4, 8], prefer: ['med'], luck: 1 },
  { name: 'Duffel Bag', icon: '👜', w: 6, h: 5, count: [5, 9], prefer: ['misc', 'tech'], luck: 1 },
  { name: 'Safe', icon: '🗃️', w: 4, h: 4, count: [3, 5], prefer: ['valuable'], luck: 3 },
]

let nextUid = 1

const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1))

function pickWeighted<T>(entries: [T, number][]): T {
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [value, w] of entries) {
    if ((r -= w) < 0) return value
  }
  return entries[entries.length - 1][0]
}

interface MakeItemOptions {
  x?: number
  y?: number
  revealed?: boolean
  owned?: boolean
  cond?: number
}

function makeAttachmentSlots(def: ItemDef): SlotStorage[] {
  if (def.slot !== 'weapon' && def.slot !== 'pistol') return []
  const slots = def.slot === 'pistol' ? ATTACHMENT_SLOTS.filter((s) => PISTOL_ATTACHMENTS.includes(s.id)) : ATTACHMENT_SLOTS
  // Owner is unused here: detaching a part always hands it to the player.
  return slots.map((s) => ({ ...s, kind: 'slot', owner: 'player', items: [] }))
}

function makeItem(def: ItemDef, { x = 0, y = 0, revealed = false, owned = false, cond }: MakeItemOptions = {}): Item {
  const max = def.dur ?? def.mag
  return {
    uid: nextUid++,
    def,
    x,
    y,
    value: Math.round((def.value * (0.85 + Math.random() * 0.3)) / 10) * 10,
    // Current durability or ammo, shown as cond/max.
    cond: max ? (cond ?? randInt(0, max)) : null,
    revealed,
    searching: false,
    owned,
    attachments: makeAttachmentSlots(def),
  }
}

function makeSlots(owner: Owner): SlotStorage[] {
  return SLOTS.map((s) => ({ ...s, kind: 'slot', owner, items: [] }))
}

function makeGrid(owner: Owner, id: string, name: string, w: number, h: number, icon: string | null = null): GridStorage {
  return { kind: 'grid', owner, id, name, w, h, icon, items: [] }
}

// Rolls the player's starting kit and the containers they loot, from the items a repository provides.
export class LootGenerator {
  private readonly items: ItemRepository
  private readonly perRarity: Record<Rarity, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }

  constructor(items: ItemRepository) {
    this.items = items
    for (const d of items.getAll()) this.perRarity[d.rarity]++
  }

  createPlayer(): Player {
    const slots = makeSlots('player')
    const slot = (id: string) => findSlot(slots, id)
    const equip = (id: string, name: string, cond?: number) =>
      slot(id).items.push(this.attachParts(makeItem(this.items.getByName(name), { revealed: true, owned: true, cond })))
    equip('weapon1', 'AUG Assault Rifle', 30)
    equip('weapon2', 'M1014 Shotgun', 6)
    equip('helmet', 'H07 Tactical Helmet', 29)
    equip('armor', 'Light Vest', 0)
    equip('melee', 'Combat Knife')
    slot('melee').locked = true

    return {
      slots,
      grids: [
        makeGrid('player', 'rig', 'Chest Rig', 7, 2, '🦺'),
        makeGrid('player', 'pockets', 'Pockets', 5, 1),
        makeGrid('player', 'backpack', 'Backpack', 6, 4, '🎒'),
        makeGrid('player', 'safebox', 'Safebox', 2, 2, '🔐'),
      ],
    }
  }

  createLootContainer(mode: LootMode = 'both'): LootContainer {
    if (mode === 'crate') return this.createCrate()
    if (mode === 'body') return this.createBody()
    return Math.random() < 0.4 ? this.createBody() : this.createCrate()
  }

  private pickItem({ prefer = [], luck = 1, slot = null }: PickOptions = {}): ItemDef {
    return pickWeighted(
      this.items
        .getAll()
        .filter((def) => !slot || def.slot === slot)
        .map((def): [ItemDef, number] => {
          let w = RARITY_WEIGHT[def.rarity] / this.perRarity[def.rarity]
          if (def.rarity >= 4) w *= luck
          if (prefer.includes(def.cat)) w *= 3
          w *= CATEGORY_WEIGHT[def.cat] ?? 1
          return [def, w]
        }),
    )
  }

  // A part for one of the gun's attachment slots, or null when none fits.
  private pickPart(gun: ItemDef, slot: SlotType): ItemDef | null {
    const family = `${gun.name.split(' ')[0]} `
    const specific = GUN_SPECIFIC.some((s) => s === slot)
    const parts = this.items.getAll().filter((def) => def.slot === slot && (!specific || def.name.startsWith(family)))
    return parts.length ? pickWeighted(parts.map((def): [ItemDef, number] => [def, RARITY_WEIGHT[def.rarity]])) : null
  }

  // Fills some of a gun's attachment slots. Parts come revealed and owned along with the gun.
  private attachParts(gun: Item): Item {
    for (const slot of gun.attachments) {
      if (Math.random() >= ATTACHMENT_CHANCE) continue
      const def = this.pickPart(gun.def, slot.accepts)
      if (def) slot.items.push(makeItem(def, { revealed: true, owned: gun.owned }))
    }
    return gun
  }

  private fillGrid(grid: GridStorage, count: number, opts: PickOptions) {
    for (let attempt = 0; attempt < count * 4 && grid.items.length < count; attempt++) {
      const def = this.pickItem(opts)
      const spot = randomSpot(grid, def)
      if (spot) grid.items.push(this.attachParts(makeItem(def, spot)))
    }
  }

  private createBody(): LootContainer {
    const slots = makeSlots('loot')
    for (const slot of slots) {
      if (Math.random() < BODY_SLOT_CHANCE[slot.id]) {
        slot.items.push(this.attachParts(makeItem(this.pickItem({ slot: slot.accepts }), { revealed: true })))
      }
    }
    const grids = [makeGrid('loot', 'rig', 'Chest Rig', 7, 2, '🦺'), makeGrid('loot', 'pockets', 'Pockets', 5, 1)]
    this.fillGrid(grids[0], randInt(2, 5), {})
    this.fillGrid(grids[1], randInt(0, 3), {})
    if (Math.random() < 0.7) {
      const backpack = makeGrid('loot', 'backpack', 'Backpack', 6, 4, '🎒')
      this.fillGrid(backpack, randInt(2, 6), {})
      grids.push(backpack)
    }
    return { name: 'Enemy Operator', slots, grids }
  }

  private createCrate(): LootContainer {
    const type = CRATE_TYPES[randInt(0, CRATE_TYPES.length - 1)]
    const grid = makeGrid('loot', 'crate', type.name, type.w, type.h, type.icon)
    this.fillGrid(grid, randInt(...type.count), type)
    return { name: type.name, slots: [], grids: [grid] }
  }
}
