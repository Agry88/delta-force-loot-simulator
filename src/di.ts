// Wires domain services to their data sources. Swap a repository implementation here.
import { ItemRepositoryApi } from './data/itemRepository/itemRepositoryApi.ts'
import { LootGenerator } from './domain/loot.ts'

export const itemRepository = new ItemRepositoryApi()
export const lootGenerator = new LootGenerator(itemRepository)
