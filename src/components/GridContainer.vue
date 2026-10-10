<script setup>
import { SEARCH_TIME } from '../data/items.js'
import { formatShort, formatValue } from '../lib/format.js'

const props = defineProps({ grid: { type: Object, required: true } })
const emit = defineEmits(['item-click', 'drag-start', 'drop-at'])

function onDragStart(e, item) {
  if (!item.revealed) return e.preventDefault()
  const r = e.currentTarget.getBoundingClientRect()
  const cell = r.width / item.def.w
  e.dataTransfer.setData('text/plain', String(item.uid))
  e.dataTransfer.effectAllowed = 'move'
  // Which cell of the item was grabbed, so the drop lines up under the cursor.
  emit('drag-start', item, Math.floor((e.clientX - r.left) / cell), Math.floor((e.clientY - r.top) / cell))
}

function onDrop(e) {
  const r = e.currentTarget.getBoundingClientRect()
  const cell = r.width / props.grid.w
  emit('drop-at', Math.floor((e.clientX - r.left) / cell), Math.floor((e.clientY - r.top) / cell))
}
</script>

<template>
  <div class="grid" :style="{ '--w': grid.w, '--h': grid.h }" @dragover.prevent @drop.prevent="onDrop">
    <div
      v-for="item in grid.items"
      :key="item.uid"
      class="item"
      :class="[`r${item.def.rarity}`, { hidden: !item.revealed, searching: item.searching }]"
      :style="{ '--x': item.x, '--y': item.y, '--iw': item.def.w, '--ih': item.def.h }"
      :draggable="item.revealed"
      :title="item.revealed ? `${item.def.name} — ${formatValue(item.value)}` : ''"
      @dragstart="onDragStart($event, item)"
      @click="emit('item-click', item)"
    >
      <template v-if="item.revealed">
        <span class="name">{{ item.def.name }}</span>
        <span class="icon">{{ item.def.icon }}</span>
        <span class="value">{{ formatShort(item.value) }}</span>
      </template>
      <template v-else-if="item.searching">
        <span class="magnifier">🔍</span>
        <span class="progress" :style="{ animationDuration: `${SEARCH_TIME[item.def.rarity]}s` }" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.grid {
  position: relative;
  width: calc(var(--w) * var(--cell));
  height: calc(var(--h) * var(--cell));
  background-color: var(--cell-bg);
  background-image:
    linear-gradient(var(--cell-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--cell-line) 1px, transparent 1px);
  background-size: var(--cell) var(--cell);
  border-right: 1px solid var(--cell-line);
  border-bottom: 1px solid var(--cell-line);
}

.item {
  position: absolute;
  left: calc(var(--x) * var(--cell) + 2px);
  top: calc(var(--y) * var(--cell) + 2px);
  width: calc(var(--iw) * var(--cell) - 3px);
  height: calc(var(--ih) * var(--cell) - 3px);
  border: 1px solid var(--rc);
  background: linear-gradient(160deg, color-mix(in srgb, var(--rc) 35%, transparent), color-mix(in srgb, var(--rc) 8%, #11161b));
  cursor: pointer;
  overflow: hidden;
  user-select: none;
  animation: reveal 0.25s ease-out;
}
.item:hover {
  filter: brightness(1.25);
}
.item.hidden {
  border-color: #3a434d;
  background: repeating-linear-gradient(45deg, #1c232a 0 6px, #181e24 6px 12px);
  cursor: default;
  animation: none;
}
.item.hidden:hover {
  filter: none;
}

.name {
  position: absolute;
  top: 2px;
  left: 4px;
  right: 4px;
  font-size: 11px;
  line-height: 1.1;
  color: var(--text);
  text-shadow: 0 0 3px #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.icon {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: calc(var(--cell) * 0.42);
  padding-bottom: 2px;
}
.value {
  position: absolute;
  right: 4px;
  bottom: 1px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-strong);
  text-shadow: 0 0 3px #000, 0 0 3px #000;
}

.magnifier {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: calc(var(--cell) * 0.45);
  animation: pulse 0.6s ease-in-out infinite alternate;
}
.progress {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  background: var(--accent);
  transform-origin: left;
  animation: fill linear forwards;
}

@keyframes fill {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
@keyframes pulse {
  from { transform: scale(0.85); opacity: 0.6; }
  to { transform: scale(1.05); opacity: 1; }
}
@keyframes reveal {
  from { filter: brightness(2.2); }
  to { filter: brightness(1); }
}
</style>
