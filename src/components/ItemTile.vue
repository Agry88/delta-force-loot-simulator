<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { SEARCH_TIME } from '../domain/rarity.ts'
import { formatShort } from '../lib/format.ts'
import { dragState } from '../lib/drag.ts'
import { hideTooltip, showTooltip } from '../lib/tooltip.ts'
import { freeAttachmentSlot } from '../domain/raid.ts'
import { tn } from '../i18n/index.ts'
import type { Item } from '../domain/models.ts'

interface Props {
  item: Item
  // 'grid' shows the price; 'slot' shows durability/ammo like an equipped item.
  mode?: 'grid' | 'slot'
  locked?: boolean
}

interface Emits {
  grab: [gx: number, gy: number]
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'grid',
  locked: false,
})
const emit = defineEmits<Emits>()
const tile = useTemplateRef('tile')

const max = computed(() => props.item.def.dur ?? props.item.def.mag)
// While a part is dragged, guns with a free slot for it light up as drop targets.
const attachable = computed(() => !!dragState.item && props.item.revealed && !!freeAttachmentSlot(props.item, dragState.item))
const corner = computed(() => {
  if (props.mode === 'slot' && max.value) return `${props.item.cond}/${max.value}`
  return formatShort(props.item.value)
})

function onDragStart(e: DragEvent) {
  if (!props.item.revealed || props.locked) return e.preventDefault()
  hideTooltip()
  if (!tile.value || !e.dataTransfer) return
  const r = tile.value.getBoundingClientRect()
  e.dataTransfer.setData('text/plain', String(props.item.uid))
  e.dataTransfer.effectAllowed = 'move'
  // Which cell of the item was grabbed, so a drop lines up under the cursor.
  emit('grab', Math.floor(((e.clientX - r.left) / r.width) * props.item.def.w), Math.floor(((e.clientY - r.top) / r.height) * props.item.def.h))
}

function onHover(e: MouseEvent) {
  if (props.item.revealed) showTooltip(props.item, e)
}
</script>

<template>
  <div
    ref="tile"
    class="tile"
    :data-uid="item.uid"
    :class="[`r${item.def.rarity}`, `in-${mode}`, { hidden: !item.revealed, searching: item.searching, locked, attachable }]"
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
  /* A flat rarity fill, with the grid's cell lines still showing through it. */
  background-color: color-mix(in srgb, var(--rc) 30%, #161b20);
  background-image:
    linear-gradient(rgb(0 0 0 / 0.28) 1px, transparent 1px),
    linear-gradient(90deg, rgb(0 0 0 / 0.28) 1px, transparent 1px);
  background-size: var(--cell) var(--cell);
  background-position: -1px -1px;
  animation: reveal 0.3s ease-out;
}
.tile:hover {
  box-shadow: inset 0 0 0 1px #e8edf2;
}
.tile.in-slot {
  width: 100%;
  height: 100%;
  background-image: none;
}
.tile.attachable {
  box-shadow: inset 0 0 0 1px #fff, inset 0 0 0 999px rgb(255 255 255 / 0.22);
}
.tile.locked {
  cursor: default;
}
.tile.hidden {
  cursor: default;
  background: repeating-linear-gradient(135deg, #1b2228 0 5px, #161c21 5px 10px);
  animation: none;
}
.tile.hidden:hover {
  box-shadow: none;
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
.in-slot .icon {
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
