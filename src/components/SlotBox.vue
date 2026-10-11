<script setup lang="ts">
import { computed } from 'vue'
import ItemTile from './ItemTile.vue'
import { tn } from '../i18n/index.ts'
import type { Item, SlotStorage, SlotType } from '../domain/models.ts'

const PLACEHOLDER: Partial<Record<SlotType, string>> = { weapon: '🔫', helmet: '⛑️', armor: '🦺', pistol: '🔫', melee: '🔪' }

interface Props {
  slot: SlotStorage
  // Shows the slot's name in the corner instead of the item's (attachment slots).
  caption?: boolean
  // Faded picture of what goes here, shown while the slot is empty.
  ghost?: string
}

interface Emits {
  'item-click': [item: Item]
  'drag-start': [item: Item, gx: number, gy: number]
  'drop-at': [cx: number, cy: number]
}

const props = withDefaults(defineProps<Props>(), { caption: false, ghost: undefined })
const emit = defineEmits<Emits>()

const item = computed(() => props.slot.items[0])
</script>

<template>
  <div
    class="slot"
    :class="{ wide: slot.wide, locked: slot.locked, labelled: slot.label, captioned: caption }"
    :title="item || caption ? '' : tn(slot.name)"
    @dragover.prevent
    @drop.prevent="emit('drop-at', 0, 0)"
  >
    <ItemTile
      v-if="item"
      :item="item"
      mode="slot"
      :locked="slot.locked"
      @click="!slot.locked && emit('item-click', item)"
      @grab="emit('drag-start', item, 0, 0)"
    />
    <img v-else-if="ghost" class="ghost" :src="ghost" alt="" draggable="false" loading="lazy" />
    <span v-else class="placeholder">{{ PLACEHOLDER[slot.accepts] }}</span>
    <span v-if="caption" class="caption">{{ tn(slot.name) }}</span>
    <span v-if="slot.label" class="badge">{{ slot.label }}</span>
    <span v-if="slot.locked" class="lock">🔒</span>
  </div>
</template>

<style scoped>
.slot {
  position: relative;
  width: var(--slot);
  height: var(--slot);
  background: var(--cell-bg);
  border: 1px solid var(--cell-line);
}
.slot.wide {
  width: calc(var(--slot) * 2 + 6px);
  height: calc(var(--slot) * 0.85);
}
.slot.locked {
  background: repeating-linear-gradient(135deg, #161c21 0 6px, #12171b 6px 12px);
}
.placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 40px;
  filter: grayscale(1);
  opacity: 0.12;
}
.ghost {
  position: absolute;
  inset: 22px 10px 10px;
  width: calc(100% - 20px);
  height: calc(100% - 32px);
  object-fit: contain;
  filter: grayscale(1) brightness(1.6) contrast(0.6);
  opacity: 0.16;
  pointer-events: none;
}
.caption {
  position: absolute;
  top: 3px;
  left: 5px;
  right: 5px;
  font-size: 13px;
  font-weight: 600;
  color: #c3ccd4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
  z-index: 2;
}
.captioned :deep(.name) {
  display: none;
}
.badge {
  position: absolute;
  top: 3px;
  left: 3px;
  min-width: 15px;
  padding: 0 3px;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  color: #0b0f12;
  background: #9aa4ad;
  z-index: 2;
}
.labelled :deep(.name) {
  left: 24px;
}
.lock {
  position: absolute;
  left: 4px;
  bottom: 2px;
  font-size: 12px;
  opacity: 0.7;
}
</style>
