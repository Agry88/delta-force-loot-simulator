<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import SlotBox from './SlotBox.vue'
import { itemRepository } from '../di.ts'
import { gunActions, itemValue, itemWeight } from '../domain/raid.ts'
import { formatValue } from '../lib/format.ts'
import { t, tn, type UiKey } from '../i18n/index.ts'
import type { GunAction } from '../domain/raid.ts'
import type { Item, SlotStorage, SlotType, Storage } from '../domain/models.ts'

interface Props {
  gun: Item
  // Where the gun is now; decides which actions are offered.
  from: Storage
}

interface Emits {
  close: []
  action: [action: GunAction]
  'item-click': [slot: SlotStorage, item: Item]
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

const ACTIONS: Record<GunAction, ActionButton> = {
  equip: { label: 'gun.equip', icon: '⤓' },
  unequip: { label: 'gun.unequip', icon: '⤒' },
  pickUp: { label: 'gun.pickUp', icon: '↗' },
  putBack: { label: 'gun.putBack', icon: '↩' },
}

// Below this width the dialog is a bottom sheet instead of floating by the gun.
const NARROW = 700
const GAP = 8

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const dialog = useTemplateRef('dialog')
const position = ref<Position | null>(null)

const actions = computed(() => gunActions(props.from))
const sizeCells = computed(() => props.gun.def.w * props.gun.def.h)

// Empty slots show a faded picture of a part that goes there.
const ghosts = new Map<SlotType, string>()
for (const def of itemRepository.getAll()) {
  if (def.slot && def.img && !ghosts.has(def.slot)) ghosts.set(def.slot, def.img)
}

// Float beside the gun's tile: to its right if there's room, else to its left.
function place() {
  const el = dialog.value
  const tile = document.querySelector(`.tile[data-uid="${props.gun.uid}"]`)
  if (!el || !tile || window.innerWidth < NARROW) {
    position.value = null
    return
  }
  const r = tile.getBoundingClientRect()
  const w = el.offsetWidth
  const h = el.offsetHeight
  let left = r.right + GAP
  if (left + w > window.innerWidth - GAP) left = r.left - w - GAP
  left = Math.max(GAP, Math.min(left, window.innerWidth - w - GAP))
  const top = Math.max(GAP, Math.min(r.top, window.innerHeight - h - GAP))
  position.value = { left: `${left}px`, top: `${top}px` }
}

// The gun's tile moves when the gun does, and when its panel scrolls.
watch(() => props.from, () => nextTick(place))
watch(() => props.gun, () => nextTick(place))
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
  <div ref="dialog" class="dialog" :class="`r${gun.def.rarity}`" :style="position ?? {}" role="dialog" :aria-label="tn(gun.def.name)">
    <header class="head">
      <b class="name">{{ tn(gun.def.name) }}</b>
      <button class="close" :aria-label="t('gun.close')" @click="emit('close')">✕</button>
    </header>

    <div class="showcase">
      <div class="value"><span class="coin" /> {{ formatValue(itemValue(gun)) }}</div>
      <img v-if="gun.def.img" class="gun" :src="gun.def.img" alt="" draggable="false" />
      <div class="specs">
        <span>{{ itemWeight(gun).toFixed(2) }}KG</span>
        <span class="size" :style="{ '--w': gun.def.w }">
          <i v-for="n in sizeCells" :key="n" />
        </span>
      </div>
    </div>

    <div class="body">
      <div class="actions">
        <button v-for="a in actions" :key="a" @click="emit('action', a)">
          <span class="icon">{{ ACTIONS[a].icon }}</span> {{ t(ACTIONS[a].label) }}
        </button>
      </div>

      <h3>{{ t('gun.attachments') }}</h3>
      <div class="slots">
        <SlotBox
          v-for="slot in gun.attachments"
          :key="slot.id"
          :slot="slot"
          caption
          :ghost="ghosts.get(slot.accepts)"
          @item-click="(item) => emit('item-click', slot, item)"
          @drag-start="(item, gx, gy) => emit('drag-start', slot, item, gx, gy)"
          @drop-at="emit('drop-at', slot)"
        />
      </div>
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
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px 8px 14px;
  background: #232b33;
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
.gun {
  position: absolute;
  inset: 34px 30px 34px;
  width: calc(100% - 60px);
  height: calc(100% - 68px);
  object-fit: contain;
  filter: drop-shadow(0 4px 4px rgb(0 0 0 / 0.6));
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
