<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import ItemTile from './ItemTile.vue'
import { gridCells } from '../domain/grid.ts'
import type { GridStorage, Item } from '../domain/models.ts'

interface Props {
  grid: GridStorage
}

interface Emits {
  'item-click': [item: Item]
  'item-dblclick': [item: Item]
  'drag-start': [item: Item, gx: number, gy: number]
  'drop-at': [cx: number, cy: number]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const gridEl = useTemplateRef('grid')

// Cells at the end of the last row that a bag doesn't have.
const blocked = computed(() => props.grid.w * props.grid.h - gridCells(props.grid))

function onDrop(e: DragEvent) {
  if (!gridEl.value) return
  const r = gridEl.value.getBoundingClientRect()
  const cell = r.width / props.grid.w
  emit('drop-at', Math.floor((e.clientX - r.left) / cell), Math.floor((e.clientY - r.top) / cell))
}
</script>

<template>
  <div ref="grid" class="grid" :style="{ '--w': grid.w, '--h': grid.h }" @dragover.prevent @drop.prevent="onDrop">
    <div v-if="blocked" class="blocked" :style="{ '--bw': blocked }" />
    <ItemTile
      v-for="item in grid.items"
      :key="item.uid"
      :item="item"
      class="placed"
      :style="{ '--x': item.x, '--y': item.y, '--iw': item.def.w, '--ih': item.def.h }"
      @click="emit('item-click', item)"
      @dblclick="emit('item-dblclick', item)"
      @grab="(gx, gy) => emit('drag-start', item, gx, gy)"
    />
  </div>
</template>

<style scoped>
.grid {
  position: relative;
  flex: none;
  width: calc(var(--w) * var(--cell) + 1px);
  height: calc(var(--h) * var(--cell) + 1px);
  background-color: var(--cell-bg);
  background-image:
    linear-gradient(var(--cell-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--cell-line) 1px, transparent 1px);
  background-size: var(--cell) var(--cell);
}
.blocked {
  position: absolute;
  right: 0;
  bottom: 0;
  width: calc(var(--bw) * var(--cell) + 1px);
  height: calc(var(--cell) + 1px);
  background: repeating-linear-gradient(135deg, #161c21 0 6px, #0e1215 6px 12px);
  border-left: 1px solid var(--cell-line);
  border-top: 1px solid var(--cell-line);
}
.placed {
  position: absolute;
  left: calc(var(--x) * var(--cell) + 1px);
  top: calc(var(--y) * var(--cell) + 1px);
  width: calc(var(--iw) * var(--cell) - 1px);
  height: calc(var(--ih) * var(--cell) - 1px);
}
</style>
