<script setup>
import { computed } from 'vue'
import { SEARCH_TIME } from '../data/items.js'
import { formatShort } from '../lib/format.js'
import { hideTooltip, showTooltip } from '../lib/tooltip.js'
import { tn } from '../i18n/index.js'

// mode 'grid' shows the price; 'slot' shows durability/ammo like an equipped item.
const props = defineProps({
  item: { type: Object, required: true },
  mode: { type: String, default: 'grid' },
  locked: { type: Boolean, default: false },
})
const emit = defineEmits(['grab'])

const max = computed(() => props.item.def.dur ?? props.item.def.mag)
const corner = computed(() => {
  if (props.mode === 'slot' && max.value) return `${props.item.cond}/${max.value}`
  return formatShort(props.item.value)
})

function onDragStart(e) {
  if (!props.item.revealed || props.locked) return e.preventDefault()
  hideTooltip()
  const r = e.currentTarget.getBoundingClientRect()
  e.dataTransfer.setData('text/plain', String(props.item.uid))
  e.dataTransfer.effectAllowed = 'move'
  // Which cell of the item was grabbed, so a drop lines up under the cursor.
  emit('grab', Math.floor(((e.clientX - r.left) / r.width) * props.item.def.w), Math.floor(((e.clientY - r.top) / r.height) * props.item.def.h))
}

function onHover(e) {
  if (props.item.revealed) showTooltip(props.item, e)
}
</script>

<template>
  <div
    class="tile"
    :class="[`r${item.def.rarity}`, mode, { hidden: !item.revealed, searching: item.searching, locked }]"
    :draggable="item.revealed && !locked"
    @dragstart="onDragStart"
    @mouseenter="onHover"
    @mousemove="onHover"
    @mouseleave="hideTooltip"
  >
    <template v-if="item.revealed">
      <span class="name">{{ tn(item.def.name) }}</span>
      <img v-if="item.def.img" class="img" :src="item.def.img" alt="" draggable="false" loading="lazy" />
      <span v-else class="icon">{{ item.def.icon }}</span>
      <span class="corner" :class="{ empty: max && mode === 'slot' && item.cond === 0 }">{{ corner }}</span>
    </template>
    <template v-else-if="item.searching">
      <span class="magnifier">🔍</span>
      <span class="progress" :style="{ animationDuration: `${SEARCH_TIME[item.def.rarity]}s` }" />
    </template>
  </div>
</template>

<style scoped>
.tile {
  position: relative;
  overflow: hidden;
  user-select: none;
  cursor: pointer;
  border: 1px solid color-mix(in srgb, var(--rc) 55%, #000);
  background:
    linear-gradient(180deg, transparent 40%, color-mix(in srgb, var(--rc) 22%, transparent)),
    linear-gradient(160deg, color-mix(in srgb, var(--rc) 42%, #161b20), color-mix(in srgb, var(--rc) 18%, #11151a));
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.04);
  animation: reveal 0.3s ease-out;
}
.tile:hover {
  border-color: #e8edf2;
}
.tile.slot {
  width: 100%;
  height: 100%;
  background: linear-gradient(160deg, color-mix(in srgb, var(--rc) 26%, #1a2026), #141a1f);
  border-color: color-mix(in srgb, var(--rc) 40%, #2a333c);
}
.tile.locked {
  cursor: default;
}
.tile.hidden {
  cursor: default;
  border-color: #2e3740;
  background: repeating-linear-gradient(135deg, #1b2228 0 5px, #161c21 5px 10px);
  animation: none;
}
.tile.hidden:hover {
  border-color: #2e3740;
}

.name {
  position: absolute;
  top: 2px;
  left: 4px;
  right: 4px;
  font-size: 11px;
  line-height: 1.15;
  color: #d5dbe1;
  text-shadow: 0 0 3px #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 1;
}
.icon {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: calc(var(--cell) * 0.42);
  filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.6));
}
.img {
  position: absolute;
  inset: 14px 4px 14px;
  width: calc(100% - 8px);
  height: calc(100% - 28px);
  object-fit: contain;
  filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.6));
  pointer-events: none;
}
.slot .icon {
  font-size: 38px;
}
.corner {
  position: absolute;
  right: 4px;
  bottom: 1px;
  font-size: 13px;
  font-weight: 700;
  color: #f1f4f7;
  text-shadow: 0 0 3px #000, 0 0 3px #000;
  font-variant-numeric: tabular-nums;
}
.corner.empty {
  color: var(--danger);
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
