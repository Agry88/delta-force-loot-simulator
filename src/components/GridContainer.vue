<script setup>
import ItemTile from './ItemTile.vue'

const props = defineProps({ grid: { type: Object, required: true } })
const emit = defineEmits(['item-click', 'drag-start', 'drop-at'])

function onDrop(e) {
  const r = e.currentTarget.getBoundingClientRect()
  const cell = r.width / props.grid.w
  emit('drop-at', Math.floor((e.clientX - r.left) / cell), Math.floor((e.clientY - r.top) / cell))
}
</script>

<template>
  <div class="grid" :style="{ '--w': grid.w, '--h': grid.h }" @dragover.prevent @drop.prevent="onDrop">
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
