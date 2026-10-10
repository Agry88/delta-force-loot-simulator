import type { Rarity } from './models.ts'

export const RARITY_LIST: Rarity[] = [1, 2, 3, 4, 5, 6]

export const RARITIES: Record<Rarity, string> = {
  1: 'Common',
  2: 'Uncommon',
  3: 'Rare',
  4: 'Epic',
  5: 'Legendary',
  6: 'Mythic',
}

// How likely each rarity is to drop, before container modifiers.
export const RARITY_WEIGHT: Record<Rarity, number> = { 1: 40, 2: 28, 3: 17, 4: 9, 5: 4.5, 6: 1.5 }

// Seconds it takes to search (reveal) one item of each rarity.
export const SEARCH_TIME: Record<Rarity, number> = { 1: 0.5, 2: 0.7, 3: 0.9, 4: 1.2, 5: 1.6, 6: 2.0 }
