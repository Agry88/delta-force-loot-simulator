import { reactive } from 'vue'
import type { Item } from '../domain/models.ts'

interface Tooltip {
  item: Item | null
  x: number
  y: number
}

// The item currently hovered, shown in a floating tooltip by RaidScreen.
export const tooltip = reactive<Tooltip>({ item: null, x: 0, y: 0 })

export function showTooltip(item: Item, e: MouseEvent) {
  tooltip.item = item
  tooltip.x = e.clientX
  tooltip.y = e.clientY
}

export function hideTooltip() {
  tooltip.item = null
}
