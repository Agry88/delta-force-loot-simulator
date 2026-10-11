import { reactive } from 'vue'
import type { Item } from '../domain/models.ts'

interface DragState {
  item: Item | null
}

// The item being dragged, so drop targets can light up. Set by RaidScreen.
export const dragState = reactive<DragState>({ item: null })
