<script setup>
import GridContainer from './GridContainer.vue'
import { usedCells } from '../lib/grid.js'
import { t, tn } from '../i18n/index.js'

defineOptions({ inheritAttrs: false })
defineProps({
  grid: { type: Object, required: true },
  note: { type: String, default: '' },
})
</script>

<template>
  <div class="storage">
    <div class="head">
      <span>{{ tn(grid.name) }}: {{ usedCells(grid) }}<small>/{{ grid.w * grid.h }}</small></span>
      <span class="q" :title="note || t('storage.size', { w: grid.w, h: grid.h })">?</span>
      <em v-if="note">{{ note }}</em>
    </div>
    <div class="body">
      <div v-if="grid.icon" class="icon-tile" :style="{ '--rows': Math.min(grid.h, 2) }">{{ grid.icon }}</div>
      <GridContainer :grid="grid" v-bind="$attrs" />
    </div>
  </div>
</template>

<style scoped>
.storage + .storage {
  margin-top: 10px;
}
.head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 10px;
  margin-bottom: 5px;
  background: var(--header);
  border-left: 2px solid #4a5560;
  color: var(--text-strong);
  font-weight: 600;
  font-size: 15px;
}
.head small {
  color: var(--muted);
  font-size: 12px;
}
.q {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid var(--muted);
  color: var(--muted);
  font-size: 10px;
  line-height: 12px;
  text-align: center;
  cursor: help;
}
.head em {
  margin-left: auto;
  font-style: normal;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
}
.body {
  display: flex;
  gap: 5px;
  align-items: flex-start;
}
.icon-tile {
  flex: none;
  width: calc(var(--cell) * 2);
  height: calc(var(--rows) * var(--cell));
  display: grid;
  place-items: center;
  font-size: calc(var(--cell) * 0.85);
  background: linear-gradient(160deg, #222a32, #161b20);
  border: 1px solid var(--cell-line);
  filter: saturate(0.4);
}

@media (max-width: 700px) {
  .icon-tile {
    display: none;
  }
}
</style>
