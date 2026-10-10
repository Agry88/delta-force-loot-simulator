import { reactive } from 'vue'

// The item currently hovered, shown in a floating tooltip by RaidScreen.
export const tooltip = reactive({ item: null, x: 0, y: 0 })

export function showTooltip(item, e) {
  tooltip.item = item
  tooltip.x = e.clientX
  tooltip.y = e.clientY
}

export function hideTooltip() {
  tooltip.item = null
}
