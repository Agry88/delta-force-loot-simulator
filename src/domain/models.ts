export type Rarity = 1 | 2 | 3 | 4 | 5 | 6

export type Category = 'weapon' | 'part' | 'gear' | 'ammo' | 'med' | 'tech' | 'valuable' | 'misc'

export type GearSlot = 'weapon' | 'helmet' | 'armor' | 'pistol' | 'melee' | 'rig' | 'backpack'

// Which kind of part a gun's attachment slot takes.
export type PartSlot =
  | 'rearGrip'
  | 'barrel'
  | 'muzzle'
  | 'stock'
  | 'foregrip'
  | 'bipod'
  | 'rail'
  | 'tactical'
  | 'panel'
  | 'magazine'
  | 'magWell'
  | 'sight'

// Which slot an item can go in: an equipment slot, or an attachment slot on a gun.
export type SlotType = GearSlot | PartSlot

// What a raid can turn up.
export type LootMode = 'both' | 'crate' | 'body'

export type Owner = 'player' | 'loot'

// w/h are grid cells; value is the base price before random variance.
// dur: max durability (helmets/armor); mag: magazine size (guns); capacity: storage cells (rigs/backpacks).
export interface ItemDef {
  name: string
  img?: string
  icon?: string
  cat: Category
  slot?: SlotType
  rarity: Rarity
  w: number
  h: number
  value: number
  mag?: number
  dur?: number
  capacity?: number
}

export interface Item {
  uid: number
  def: ItemDef
  x: number
  y: number
  value: number
  // Current durability or ammo, shown as cond/max.
  cond: number | null
  revealed: boolean
  searching: boolean
  owned: boolean
  // A gun's attachment slots; empty for everything else.
  attachments: SlotStorage[]
  // What a chest rig or backpack holds; it travels with the bag.
  storage: GridStorage | null
}

export interface SlotStorage {
  kind: 'slot'
  owner: Owner
  id: string
  name: string
  accepts: SlotType
  label?: string
  wide?: boolean
  locked?: boolean
  items: Item[]
}

export interface GridStorage {
  kind: 'grid'
  owner: Owner
  id: string
  name: string
  w: number
  h: number
  icon: string | null
  // Usable cells, filled row by row; the rest of the last row is blocked. Defaults to w × h.
  cells?: number
  items: Item[]
}

export type Storage = SlotStorage | GridStorage

// Rig and backpack grids live on the items in those slots; grids are the fixed ones (pockets, safebox, crates).
export interface Player {
  slots: SlotStorage[]
  grids: GridStorage[]
}

export interface LootContainer extends Player {
  name: string
}

export interface ResultItem extends ItemDef {
  where: string
}

export interface RaidResult {
  items: ResultItem[]
  containersOpened: number
  // What the player carried in and left behind.
  lost: number
  // The profit of the best haul the raid allowed.
  maxProfit: number
}
