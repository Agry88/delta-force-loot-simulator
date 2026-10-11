<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import SlotBox from './SlotBox.vue'
import { itemRepository } from '../di.ts'
import { itemActions, itemValue, itemWeight } from '../domain/raid.ts'
import { formatValue } from '../lib/format.ts'
import { t, tn, type UiKey } from '../i18n/index.ts'
import type { ItemAction } from '../domain/raid.ts'
import type { Item, SlotStorage, SlotType, Storage } from '../domain/models.ts'

interface Props {
  item: Item
  // Where the item is now; decides which actions are offered.
  from: Storage
}

interface Emits {
  close: []
  action: [action: ItemAction]
  // Double-clicking an attached part detaches it.
  'part-dblclick': [slot: SlotStorage, part: Item]
  'drag-start': [slot: SlotStorage, item: Item, gx: number, gy: number]
  'drop-at': [slot: SlotStorage]
}

interface ActionButton {
  label: UiKey
  icon: string
}

interface Position {
  left: string
  top: string
}

const ACTIONS: Record<ItemAction, ActionButton> = {
  equip: { label: 'item.equip', icon: '⤓' },
  unequip: { label: 'item.unequip', icon: '⤒' },
  pickUp: { label: 'item.pickUp', icon: '↗' },
  putBack: { label: 'item.putBack', icon: '↩' },
  drop: { label: 'item.drop', icon: '⬇' },
}

// Below this width the dialog is a bottom sheet instead of floating by the item.
const NARROW = 700
const GAP = 8

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const dialog = useTemplateRef('dialog')
const position = ref<Position | null>(null)

const actions = computed(() => itemActions(props.item, props.from))
const sizeCells = computed(() => props.item.def.w * props.item.def.h)

// Empty slots show a faded picture of a part that goes there.
const ghosts = new Map<SlotType, string>()
for (const def of itemRepository.getAll()) {
  if (def.slot && def.img && !ghosts.has(def.slot)) ghosts.set(def.slot, def.img)
}

// Once the player drags the dialog by its header, it stays where they put it.
let moved = false

function clampLeft(left: number, w: number) {
  return Math.max(GAP, Math.min(left, window.innerWidth - w - GAP))
}
function clampTop(top: number, h: number) {
  return Math.max(GAP, Math.min(top, window.innerHeight - h - GAP))
}
function setPosition(left: number, top: number) {
  position.value = { left: `${left}px`, top: `${top}px` }
}

// How much of the inventory and loot panels a dialog at this spot would hide.
function coveredArea(left: number, top: number, w: number, h: number, panels: DOMRect[]) {
  return panels.reduce((sum, p) => {
    const x = Math.min(left + w, p.right) - Math.max(left, p.left)
    const y = Math.min(top + h, p.bottom) - Math.max(top, p.top)
    return sum + Math.max(0, x) * Math.max(0, y)
  }, 0)
}

// Float beside the item's tile, on whichever side hides less of the item panels,
// so parts stay reachable for dragging onto the gun.
function place() {
  const el = dialog.value
  const tile = document.querySelector(`.tile[data-uid="${props.item.uid}"]`)
  if (!el || !tile || window.innerWidth < NARROW) {
    position.value = null
    return
  }
  if (moved) return
  const r = tile.getBoundingClientRect()
  const w = el.offsetWidth
  const h = el.offsetHeight
  const top = clampTop(r.top, h)
  const panels = Array.from(document.querySelectorAll('.panel'), (p) => p.getBoundingClientRect())
  const [best] = [clampLeft(r.right + GAP, w), clampLeft(r.left - w - GAP, w)]
    .map((left): [number, number] => [left, coveredArea(left, top, w, h, panels)])
    .sort((a, b) => a[1] - b[1])
  setPosition(best[0], top)
}

function startMove(e: PointerEvent) {
  const el = dialog.value
  if (!el || window.innerWidth < NARROW) return
  if (e.target instanceof Element && e.target.closest('button')) return
  const r = el.getBoundingClientRect()
  const dx = e.clientX - r.left
  const dy = e.clientY - r.top
  const onMove = (m: PointerEvent) => {
    moved = true
    setPosition(clampLeft(m.clientX - dx, r.width), clampTop(m.clientY - dy, r.height))
  }
  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

// The tile moves when the item does, and when its panel scrolls.
watch(() => props.from, () => nextTick(place))
onMounted(() => {
  place()
  window.addEventListener('resize', place)
  window.addEventListener('scroll', place, true)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', place)
  window.removeEventListener('scroll', place, true)
})
</script>

<template>
  <div ref="dialog" class="dialog" :class="`r${item.def.rarity}`" :style="position ?? {}" role="dialog" :aria-label="tn(item.def.name)">
    <header class="head" @pointerdown="startMove">
      <span class="diamond" />
      <b class="name">{{ tn(item.def.name) }}</b>
      <button class="close" :aria-label="t('item.close')" @click="emit('close')">✕</button>
    </header>

    <div class="showcase">
      <div class="value"><span class="coin" /> {{ formatValue(itemValue(item)) }}</div>
      <img v-if="item.def.img" class="picture" :src="item.def.img" alt="" draggable="false" />
      <span v-else class="picture emoji">{{ item.def.icon }}</span>
      <div class="specs">
        <span>{{ itemWeight(item).toFixed(2) }}KG</span>
        <span v-if="item.def.capacity">{{ t('item.capacity', { n: item.def.capacity }) }}</span>
        <span class="size" :style="{ '--w': item.def.w }">
          <i v-for="n in sizeCells" :key="n" />
        </span>
      </div>
    </div>

    <div v-if="actions.length || item.attachments.length" class="body">
      <div v-if="actions.length" class="actions">
        <button v-for="a in actions" :key="a" @click="emit('action', a)">
          <span class="icon">{{ ACTIONS[a].icon }}</span> {{ t(ACTIONS[a].label) }}
        </button>
      </div>

      <template v-if="item.attachments.length">
        <h3>{{ t('item.attachments') }}</h3>
        <div class="slots">
          <SlotBox
            v-for="slot in item.attachments"
            :key="slot.id"
            :slot="slot"
            caption
            :ghost="ghosts.get(slot.accepts)"
            @item-dblclick="(part) => emit('part-dblclick', slot, part)"
            @drag-start="(part, gx, gy) => emit('drag-start', slot, part, gx, gy)"
            @drop-at="emit('drop-at', slot)"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dialog {
  position: fixed;
  z-index: 9;
  width: 420px;
  max-height: calc(100vh - 16px);
  display: flex;
  flex-direction: column;
  background: #12171c;
  border: 1px solid #4a545e;
  box-shadow: 0 12px 40px rgb(0 0 0 / 0.6);
}
.head {
  cursor: move;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px 8px 14px;
  background: #232b33;
}
.diamond {
  flex: none;
  width: 10px;
  height: 10px;
  margin-right: 2px;
  background: var(--rc);
  transform: rotate(45deg);
}
.name {
  flex: 1;
  min-width: 0;
  font-size: 19px;
  color: var(--text-strong);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.close {
  width: 30px;
  height: 30px;
  font: inherit;
  font-size: 20px;
  color: var(--text-strong);
  background: none;
  border: none;
  cursor: pointer;
}
.close:hover {
  color: var(--accent);
}

.showcase {
  position: relative;
  height: 170px;
  padding: 10px 14px;
  background:
    radial-gradient(ellipse at 50% 55%, color-mix(in srgb, var(--rc) 18%, transparent), transparent 70%),
    linear-gradient(180deg, #1a2026, #0f1317);
  border-bottom: 1px solid #262f38;
}
.value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  color: var(--text-strong);
}
.coin {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fff, #8a939b);
}
.picture {
  position: absolute;
  inset: 34px 30px 34px;
  width: calc(100% - 60px);
  height: calc(100% - 68px);
  object-fit: contain;
  filter: drop-shadow(0 4px 4px rgb(0 0 0 / 0.6));
}
.emoji {
  display: grid;
  place-items: center;
  font-size: 64px;
}
.specs {
  position: absolute;
  right: 14px;
  bottom: 10px;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  font-size: 16px;
  color: var(--text);
}
.size {
  display: grid;
  grid-template-columns: repeat(var(--w), 7px);
  gap: 1px;
}
.size i {
  width: 7px;
  height: 7px;
  background: #c9d0d6;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding: 12px 14px 14px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #3a444e transparent;
}
.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.actions button {
  padding: 7px;
  font: inherit;
  font-weight: 700;
  color: var(--text-strong);
  background: #161c21;
  border: 1px solid #4a545e;
  cursor: pointer;
}
/* An odd button out takes the whole row. */
.actions button:last-child:nth-child(odd) {
  grid-column: 1 / -1;
}
.actions button:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.icon {
  margin-right: 4px;
}
h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}
.slots {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 4px;
}
/* Slots share the dialog's width instead of using the fixed equipment size. */
.slots :deep(.slot) {
  width: auto;
  height: auto;
  aspect-ratio: 1;
}
.slots :deep(.caption) {
  font-size: 11px;
}

@media (max-width: 700px) {
  .dialog {
    left: 8px;
    right: 8px;
    bottom: 8px;
    width: auto;
    max-height: 75vh;
  }
  .showcase {
    height: 130px;
  }
}
</style>
