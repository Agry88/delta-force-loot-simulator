export type Rarity = 1 | 2 | 3 | 4 | 5 | 6

export type Category = 'weapon' | 'part' | 'gear' | 'ammo' | 'med' | 'tech' | 'valuable' | 'misc'

// Which equipment slot an item can go in.
export type SlotType = 'weapon' | 'helmet' | 'armor' | 'pistol' | 'melee'

// What a raid can turn up.
export type LootMode = 'both' | 'crate' | 'body'

export type Owner = 'player' | 'loot'

// w/h are grid cells; value is the base price before random variance.
// dur: max durability (helmets/armor); mag: magazine size (guns).
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
  items: Item[]
}

export type Storage = SlotStorage | GridStorage

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
}
