import { randomSpot } from '../lib/grid.js'
import catalog from './catalog.json'

export const RARITIES = {
  1: 'Common',
  2: 'Uncommon',
  3: 'Rare',
  4: 'Epic',
  5: 'Legendary',
  6: 'Mythic',
}

// How likely each rarity is to drop, before container modifiers.
const RARITY_WEIGHT = { 1: 40, 2: 28, 3: 17, 4: 9, 5: 4.5, 6: 1.5 }

// Seconds it takes to search (reveal) one item of each rarity.
export const SEARCH_TIME = { 1: 0.5, 2: 0.7, 3: 0.9, 4: 1.2, 5: 1.6, 6: 2.0 }

// Real items, prices and icons snapshotted from deltaforceapi.com by `pnpm sync-items`.
// Each entry: { id, name, type, sub, quality, w, h, price } with w/h in grid cells.
const ICON_URL = (id) => `https://cdn.deltaforceapi.com/deltaforceapi/item/${id}/icon.png`

// Weapons have no quality in the API, so their rarity comes from price.
const WEAPON_RARITY_PRICE = [[15000, 1], [40000, 2], [100000, 3], [200000, 4], [500000, 5]]

const MAG_SIZE = {
  WEAPON_ASSAULT_RIFLE: 30,
  WEAPON_SMG: 30,
  WEAPON_LMG: 100,
  WEAPON_MARKSMAN_RIFLE: 20,
  WEAPON_SNIPER_RIFLE: 5,
  WEAPON_SHOTGUN: 7,
  WEAPON_PISTOL: 15,
}

// Max durability of helmets and body armor by rarity.
const DURABILITY = { 1: 20, 2: 25, 3: 38, 4: 50, 5: 61, 6: 75 }

const CATEGORY_BY_SUB = {
  COLLECTIBLE_MEDICAL_ITEM: 'med',
  COLLECTIBLE_ELECTRONIC_PRODUCT: 'tech',
  COLLECTIBLE_CRAFTWORK: 'valuable',
  CONSUMABLE_ARMOR_REP: 'misc',
}
const CATEGORY_BY_TYPE = { WEAPON: 'weapon', WEAPON_PART: 'part', GEAR: 'gear', AMMO: 'ammo', CONSUMABLE: 'med', KEYCARD: 'valuable' }

const SLOT_BY_SUB = { WEAPON_PISTOL: 'pistol', GEAR_HELMET: 'helmet', GEAR_VEST: 'armor' }

function toDef(it) {
  const rarity =
    it.type === 'WEAPON'
      ? (WEAPON_RARITY_PRICE.find(([max]) => it.price < max)?.[1] ?? 6)
      : Math.min(6, Math.max(1, it.quality))
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

// w/h are grid cells; value is the base price before random variance.
// slot: which equipment slot the item can be equipped in.
// dur: max durability (helmets/armor); mag: magazine size (guns).
// The API has no melee weapons, so the knife stays hand-made.
export const CATALOG = [
  ...catalog.items.map(toDef),
  { name: 'Combat Knife', icon: '🔪', cat: 'weapon', slot: 'melee', rarity: 1, w: 2, h: 1, value: 1500 },
]

// Weapon parts outnumber everything else in the API, so they drop less often per item.
const CATEGORY_WEIGHT = { part: 0.3 }

const byName = (name) => CATALOG.find((d) => d.name === name)

// Equipment slots, shared by the player and enemy bodies.
const SLOTS = [
  { id: 'weapon1', name: 'Primary Weapon', accepts: 'weapon', label: '1', wide: true },
  { id: 'weapon2', name: 'Secondary Weapon', accepts: 'weapon', label: '2', wide: true },
  { id: 'helmet', name: 'Helmet', accepts: 'helmet' },
  { id: 'armor', name: 'Body Armor', accepts: 'armor' },
  { id: 'pistol', name: 'Pistol', accepts: 'pistol' },
  { id: 'melee', name: 'Melee', accepts: 'melee' },
]

// Chance an enemy body has something in each slot.
const BODY_SLOT_CHANCE = { weapon1: 0.8, weapon2: 0.35, helmet: 0.6, armor: 0.6, pistol: 0.45, melee: 0.5 }

// luck multiplies the weight of Epic and better items.
const CRATE_TYPES = [
  { name: 'Weapon Case', icon: '🧳', w: 7, h: 4, count: [3, 6], prefer: ['weapon', 'ammo', 'part'], luck: 1.3 },
  { name: 'Medical Crate', icon: '🧰', w: 6, h: 4, count: [4, 8], prefer: ['med'], luck: 1 },
  { name: 'Duffel Bag', icon: '👜', w: 6, h: 5, count: [5, 9], prefer: ['misc', 'tech'], luck: 1 },
  { name: 'Safe', icon: '🗃️', w: 4, h: 4, count: [3, 5], prefer: ['valuable'], luck: 3 },
]

const perRarity = CATALOG.reduce((acc, d) => ((acc[d.rarity] = (acc[d.rarity] || 0) + 1), acc), {})

let nextUid = 1

const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1))

function pickWeighted(entries) {
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [value, w] of entries) {
    if ((r -= w) < 0) return value
  }
  return entries[entries.length - 1][0]
}

function pickItem({ prefer = [], luck = 1, slot = null } = {}) {
  return pickWeighted(
    CATALOG.filter((def) => !slot || def.slot === slot).map((def) => {
      let w = RARITY_WEIGHT[def.rarity] / perRarity[def.rarity]
      if (def.rarity >= 4) w *= luck
      if (prefer.includes(def.cat)) w *= 3
      w *= CATEGORY_WEIGHT[def.cat] ?? 1
      return [def, w]
    }),
  )
}

function makeItem(def, { x = 0, y = 0, revealed = false, owned = false, cond } = {}) {
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
  }
}

function makeSlots(owner) {
  return SLOTS.map((s) => ({ ...s, kind: 'slot', owner, items: [] }))
}

function makeGrid(owner, id, name, w, h, icon = null) {
  return { kind: 'grid', owner, id, name, w, h, icon, items: [] }
}

function fillGrid(grid, count, opts) {
  for (let attempt = 0; attempt < count * 4 && grid.items.length < count; attempt++) {
    const def = pickItem(opts)
    const spot = randomSpot(grid, def)
    if (spot) grid.items.push(makeItem(def, spot))
  }
}

export function createPlayer() {
  const slots = makeSlots('player')
  const equip = (id, name, cond) => slots.find((s) => s.id === id).items.push(makeItem(byName(name), { revealed: true, owned: true, cond }))
  equip('weapon1', 'AUG Assault Rifle', 30)
  equip('weapon2', 'M1014 Shotgun', 6)
  equip('helmet', 'H07 Tactical Helmet', 29)
  equip('armor', 'Light Vest', 0)
  equip('melee', 'Combat Knife')
  slots.find((s) => s.id === 'melee').locked = true

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

function createBody() {
  const slots = makeSlots('loot')
  for (const slot of slots) {
    if (Math.random() < BODY_SLOT_CHANCE[slot.id]) {
      slot.items.push(makeItem(pickItem({ slot: slot.accepts }), { revealed: true }))
    }
  }
  const grids = [makeGrid('loot', 'rig', 'Chest Rig', 7, 2, '🦺'), makeGrid('loot', 'pockets', 'Pockets', 5, 1)]
  fillGrid(grids[0], randInt(2, 5), {})
  fillGrid(grids[1], randInt(0, 3), {})
  if (Math.random() < 0.7) {
    const backpack = makeGrid('loot', 'backpack', 'Backpack', 6, 4, '🎒')
    fillGrid(backpack, randInt(2, 6), {})
    grids.push(backpack)
  }
  return { name: 'Enemy Operator', slots, grids }
}

function createCrate() {
  const type = CRATE_TYPES[randInt(0, CRATE_TYPES.length - 1)]
  const grid = makeGrid('loot', 'crate', type.name, type.w, type.h, type.icon)
  fillGrid(grid, randInt(...type.count), type)
  return { name: type.name, slots: [], grids: [grid] }
}

// What a raid can turn up: 'crate', 'body', or 'both'.
export const LOOT_MODES = ['both', 'crate', 'body']

export function createLootContainer(mode = 'both') {
  if (mode === 'crate') return createCrate()
  if (mode === 'body') return createBody()
  return Math.random() < 0.4 ? createBody() : createCrate()
}
