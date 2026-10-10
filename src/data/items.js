import { randomSpot } from '../lib/grid.js'

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

// w/h are grid cells; value is the base price before random variance.
// slot: which equipment slot the item can be equipped in.
// dur: max durability (helmets/armor); mag: magazine size (guns).
export const CATALOG = [
  { name: 'Bandage', icon: '🩹', cat: 'med', rarity: 1, w: 1, h: 1, value: 800 },
  { name: '9mm Ammo', icon: '🔸', cat: 'ammo', rarity: 1, w: 1, h: 1, value: 600 },
  { name: 'Energy Drink', icon: '🥤', cat: 'misc', rarity: 1, w: 1, h: 1, value: 1200 },
  { name: 'Screws', icon: '🔩', cat: 'misc', rarity: 1, w: 1, h: 1, value: 900 },
  { name: 'Lighter', icon: '🔥', cat: 'misc', rarity: 1, w: 1, h: 1, value: 700 },
  { name: 'Combat Knife', icon: '🔪', cat: 'weapon', slot: 'melee', rarity: 1, w: 2, h: 1, value: 1500 },

  { name: '5.56x45 Ammo', icon: '🔶', cat: 'ammo', rarity: 2, w: 1, h: 1, value: 2400 },
  { name: 'First Aid Kit', icon: '🧰', cat: 'med', rarity: 2, w: 1, h: 2, value: 3500 },
  { name: 'Canned Food', icon: '🥫', cat: 'misc', rarity: 2, w: 1, h: 1, value: 2000 },
  { name: 'Flashlight', icon: '🔦', cat: 'tech', rarity: 2, w: 1, h: 2, value: 3000 },
  { name: 'Compass', icon: '🧭', cat: 'misc', rarity: 2, w: 1, h: 1, value: 4200 },
  { name: 'G18 Pistol', icon: '🔫', cat: 'weapon', slot: 'pistol', mag: 17, rarity: 2, w: 2, h: 1, value: 4500 },
  { name: 'MP5', icon: '🔫', cat: 'weapon', slot: 'weapon', mag: 30, rarity: 2, w: 3, h: 2, value: 7000 },
  { name: 'Light Body Armor', icon: '🦺', cat: 'gear', slot: 'armor', dur: 25, rarity: 2, w: 2, h: 3, value: 6000 },

  { name: 'Field Medkit', icon: '🩺', cat: 'med', rarity: 3, w: 1, h: 2, value: 9000 },
  { name: 'Tactical Helmet', icon: '⛑️', cat: 'gear', slot: 'helmet', dur: 38, rarity: 3, w: 2, h: 2, value: 14000 },
  { name: 'Radio', icon: '📻', cat: 'tech', rarity: 3, w: 2, h: 1, value: 11000 },
  { name: 'Hard Drive', icon: '💽', cat: 'tech', rarity: 3, w: 1, h: 1, value: 12000 },
  { name: 'Binoculars', icon: '🔭', cat: 'gear', rarity: 3, w: 2, h: 1, value: 10000 },
  { name: 'AUG A3', icon: '🔫', cat: 'weapon', slot: 'weapon', mag: 30, rarity: 3, w: 4, h: 2, value: 22000 },

  { name: 'Assault Tactical Vest', icon: '🦺', cat: 'gear', rarity: 4, w: 2, h: 3, value: 28000 },
  { name: 'Gold Watch', icon: '⌚', cat: 'valuable', rarity: 4, w: 1, h: 1, value: 32000 },
  { name: 'Night Vision', icon: '🥽', cat: 'gear', rarity: 4, w: 2, h: 1, value: 38000 },
  { name: 'Laptop', icon: '💻', cat: 'tech', rarity: 4, w: 2, h: 2, value: 45000 },
  { name: 'M1014 Shotgun', icon: '🔫', cat: 'weapon', slot: 'weapon', mag: 9, rarity: 4, w: 4, h: 1, value: 40000 },
  { name: 'AK-12', icon: '🔫', cat: 'weapon', slot: 'weapon', mag: 30, rarity: 4, w: 4, h: 2, value: 48000 },
  { name: 'Desert Eagle', icon: '🔫', cat: 'weapon', slot: 'pistol', mag: 7, rarity: 4, w: 2, h: 1, value: 30000 },
  { name: 'Heavy Assault Helmet', icon: '⛑️', cat: 'gear', slot: 'helmet', dur: 50, rarity: 4, w: 2, h: 2, value: 52000 },
  { name: 'Heavy Body Armor', icon: '🦺', cat: 'gear', slot: 'armor', dur: 61, rarity: 4, w: 3, h: 3, value: 65000 },

  { name: 'Gold Bar', icon: '🪙', cat: 'valuable', rarity: 5, w: 1, h: 1, value: 120000 },
  { name: 'Diamond Ring', icon: '💍', cat: 'valuable', rarity: 5, w: 1, h: 1, value: 150000 },
  { name: 'Military Server', icon: '🗄️', cat: 'tech', rarity: 5, w: 2, h: 2, value: 180000 },
  { name: 'M249 LMG', icon: '🔫', cat: 'weapon', slot: 'weapon', mag: 100, rarity: 5, w: 5, h: 2, value: 160000 },
  { name: 'Encrypted Phone', icon: '📱', cat: 'tech', rarity: 5, w: 1, h: 1, value: 95000 },

  { name: 'Heart of Africa', icon: '💎', cat: 'valuable', rarity: 6, w: 1, h: 1, value: 1200000 },
  { name: 'Quantum Storage', icon: '🧊', cat: 'tech', rarity: 6, w: 2, h: 2, value: 900000 },
  { name: 'Ancient Artifact', icon: '🏺', cat: 'valuable', rarity: 6, w: 1, h: 2, value: 750000 },
]

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
  { name: 'Weapon Case', icon: '🧳', w: 7, h: 4, count: [3, 6], prefer: ['weapon', 'ammo'], luck: 1.3 },
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
  equip('weapon1', 'AUG A3', 30)
  equip('weapon2', 'M1014 Shotgun', 8)
  equip('helmet', 'Tactical Helmet', 29)
  equip('armor', 'Light Body Armor', 0)
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
