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
export const CATALOG = [
  { name: 'Bandage', icon: '🩹', cat: 'med', rarity: 1, w: 1, h: 1, value: 800 },
  { name: '9mm Ammo', icon: '🔸', cat: 'ammo', rarity: 1, w: 1, h: 1, value: 600 },
  { name: 'Energy Drink', icon: '🥤', cat: 'misc', rarity: 1, w: 1, h: 1, value: 1200 },
  { name: 'Screws', icon: '🔩', cat: 'misc', rarity: 1, w: 1, h: 1, value: 900 },
  { name: 'Lighter', icon: '🔥', cat: 'misc', rarity: 1, w: 1, h: 1, value: 700 },

  { name: '5.56x45 Ammo', icon: '🔶', cat: 'ammo', rarity: 2, w: 1, h: 1, value: 2400 },
  { name: 'First Aid Kit', icon: '🧰', cat: 'med', rarity: 2, w: 1, h: 2, value: 3500 },
  { name: 'Canned Food', icon: '🥫', cat: 'misc', rarity: 2, w: 1, h: 1, value: 2000 },
  { name: 'Flashlight', icon: '🔦', cat: 'tech', rarity: 2, w: 1, h: 2, value: 3000 },
  { name: 'Compass', icon: '🧭', cat: 'misc', rarity: 2, w: 1, h: 1, value: 4200 },

  { name: 'Field Medkit', icon: '🩺', cat: 'med', rarity: 3, w: 1, h: 2, value: 9000 },
  { name: 'Tactical Helmet', icon: '⛑️', cat: 'gear', rarity: 3, w: 2, h: 2, value: 14000 },
  { name: 'Radio', icon: '📻', cat: 'tech', rarity: 3, w: 2, h: 1, value: 11000 },
  { name: 'Hard Drive', icon: '💽', cat: 'tech', rarity: 3, w: 1, h: 1, value: 12000 },
  { name: 'Binoculars', icon: '🔭', cat: 'gear', rarity: 3, w: 2, h: 1, value: 10000 },

  { name: 'Assault Tactical Vest', icon: '🦺', cat: 'gear', rarity: 4, w: 2, h: 3, value: 28000 },
  { name: 'Gold Watch', icon: '⌚', cat: 'valuable', rarity: 4, w: 1, h: 1, value: 32000 },
  { name: 'Night Vision', icon: '🥽', cat: 'gear', rarity: 4, w: 2, h: 1, value: 38000 },
  { name: 'Laptop', icon: '💻', cat: 'tech', rarity: 4, w: 2, h: 2, value: 45000 },
  { name: 'M1014 Shotgun', icon: '🔫', cat: 'weapon', rarity: 4, w: 4, h: 1, value: 40000 },

  { name: 'Gold Bar', icon: '🪙', cat: 'valuable', rarity: 5, w: 1, h: 1, value: 120000 },
  { name: 'Diamond Ring', icon: '💍', cat: 'valuable', rarity: 5, w: 1, h: 1, value: 150000 },
  { name: 'Military Server', icon: '🗄️', cat: 'tech', rarity: 5, w: 2, h: 2, value: 180000 },
  { name: 'M249 LMG', icon: '🔫', cat: 'weapon', rarity: 5, w: 5, h: 2, value: 160000 },
  { name: 'Encrypted Phone', icon: '📱', cat: 'tech', rarity: 5, w: 1, h: 1, value: 95000 },

  { name: 'Heart of Africa', icon: '💎', cat: 'valuable', rarity: 6, w: 1, h: 1, value: 1200000 },
  { name: 'Quantum Storage', icon: '🧊', cat: 'tech', rarity: 6, w: 2, h: 2, value: 900000 },
  { name: 'Ancient Artifact', icon: '🏺', cat: 'valuable', rarity: 6, w: 1, h: 2, value: 750000 },
]

// luck multiplies the weight of Epic and better items.
const CONTAINER_TYPES = [
  { name: 'Enemy Operator', w: 7, h: 5, count: [6, 10], prefer: [], luck: 1 },
  { name: 'Weapon Case', w: 7, h: 4, count: [3, 6], prefer: ['weapon', 'ammo'], luck: 1.3 },
  { name: 'Medical Crate', w: 6, h: 4, count: [4, 8], prefer: ['med'], luck: 1 },
  { name: 'Duffel Bag', w: 6, h: 5, count: [5, 9], prefer: ['misc', 'tech'], luck: 1 },
  { name: 'Safe', w: 4, h: 4, count: [3, 5], prefer: ['valuable'], luck: 3 },
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

function pickItem(type) {
  return pickWeighted(
    CATALOG.map((def) => {
      let w = RARITY_WEIGHT[def.rarity] / perRarity[def.rarity]
      if (def.rarity >= 4) w *= type.luck
      if (type.prefer.includes(def.cat)) w *= 3
      return [def, w]
    }),
  )
}

export function createLootContainer() {
  const type = CONTAINER_TYPES[randInt(0, CONTAINER_TYPES.length - 1)]
  const grid = { id: 'loot', name: type.name, w: type.w, h: type.h, items: [] }
  const target = randInt(...type.count)

  for (let attempt = 0; attempt < target * 4 && grid.items.length < target; attempt++) {
    const def = pickItem(type)
    const spot = randomSpot(grid, def.w, def.h)
    if (!spot) continue
    grid.items.push({
      uid: nextUid++,
      def,
      x: spot.x,
      y: spot.y,
      value: Math.round((def.value * (0.85 + Math.random() * 0.3)) / 10) * 10,
      revealed: false,
      searching: false,
    })
  }
  return grid
}
