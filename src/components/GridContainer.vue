<script setup lang="ts">
import { useTemplateRef } from 'vue'
import ItemTile from './ItemTile.vue'
import type { GridStorage, Item } from '../domain/models.ts'

interface Props {
  grid: GridStorage
}

interface Emits {
  'item-click': [item: Item]
  'drag-start': [item: Item, gx: number, gy: number]
  'drop-at': [cx: number, cy: number]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const gridEl = useTemplateRef('grid')

function onDrop(e: DragEvent) {
  if (!gridEl.value) return
  const r = gridEl.value.getBoundingClientRect()
  const cell = r.width / props.grid.w
  emit('drop-at', Math.floor((e.clientX - r.left) / cell), Math.floor((e.clientY - r.top) / cell))
}
</script>

<template>
  <div ref="grid" class="grid" :style="{ '--w': grid.w, '--h': grid.h }" @dragover.prevent @drop.prevent="onDrop">
    <ItemTile
      v-for="item in grid.items"
      :key="item.uid"
      :item="item"
      class="placed"
      :style="{ '--x': item.x, '--y': item.y, '--iw': item.def.w, '--ih': item.def.h }"
      @click="emit('item-click', item)"
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
.placed {
  position: absolute;
  left: calc(var(--x) * var(--cell) + 2px);
  top: calc(var(--y) * var(--cell) + 2px);
  width: calc(var(--iw) * var(--cell) - 3px);
  height: calc(var(--ih) * var(--cell) - 3px);
}
</style>
