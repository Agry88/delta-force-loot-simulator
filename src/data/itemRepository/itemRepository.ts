import type { ItemDef } from '../../domain/models.ts'

// Source of every item the game can spawn.
export interface ItemRepository {
  getAll(): ItemDef[]
  // Throws when no item has that name.
  getByName(name: string): ItemDef
}
