import { reactive } from 'vue'
import type { Item } from '../domain/models.ts'

// The item currently hovered, shown in a floating tooltip by RaidScreen.
export const tooltip = reactive<{ item: Item | null; x: number; y: number }>({ item: null, x: 0, y: 0 })

export function showTooltip(item: Item, e: MouseEvent) {
  tooltip.item = item
  tooltip.x = e.clientX
  tooltip.y = e.clientY
}

export function hideTooltip() {
  tooltip.item = null
}
