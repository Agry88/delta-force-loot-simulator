<script setup lang="ts">
import { computed } from 'vue'
import { RARITIES } from '../domain/rarity.ts'
import { formatValue } from '../lib/format.ts'
import { t, tn } from '../i18n/index.ts'
import type { RaidResult, Rarity } from '../domain/models.ts'

const props = defineProps<{ result: RaidResult }>()
const emit = defineEmits<{ restart: [] }>()

const items = computed(() => [...props.result.items].sort((a, b) => b.value - a.value))
const total = computed(() => items.value.reduce((s, it) => s + it.value, 0))
const best = computed(() => items.value[0])
const byRarity = computed(() =>
  (Object.keys(RARITIES).map(Number) as Rarity[])
    .map((rarity) => ({ rarity, count: items.value.filter((it) => it.rarity === rarity).length }))
    .filter((x) => x.count),
)
</script>

<template>
  <div class="result">
    <h1>{{ t('result.title') }}</h1>

    <div class="summary">
      <div class="big">
        <span class="label">{{ t('result.total') }}</span>
        <b>{{ formatValue(total) }}</b>
      </div>
      <div><span class="label">{{ t('result.items') }}</span><b>{{ items.length }}</b></div>
      <div><span class="label">{{ t('result.containers') }}</span><b>{{ result.containersOpened }}</b></div>
    </div>

    <div v-if="best" class="best" :class="`r${best.rarity}`">
      <img v-if="best.img" class="icon" :src="best.img" alt="" />
      <span v-else class="icon">{{ best.icon }}</span>
      <div>
        <div class="label">{{ t('result.best') }} · {{ tn(RARITIES[best.rarity]) }}</div>
        <div class="best-name">{{ tn(best.name) }}</div>
        <div>{{ formatValue(best.value) }}</div>
      </div>
    </div>

    <div v-if="byRarity.length" class="rarities">
      <span v-for="r in byRarity" :key="r.rarity" class="chip" :class="`r${r.rarity}`">
        {{ tn(RARITIES[r.rarity]) }} × {{ r.count }}
      </span>
    </div>

    <ul v-if="items.length" class="list">
      <li v-for="(it, i) in items" :key="i" :class="`r${it.rarity}`">
        <img v-if="it.img" class="icon" :src="it.img" alt="" loading="lazy" />
        <span v-else class="icon">{{ it.icon }}</span>
        <span class="name">{{ tn(it.name) }}</span>
        <span class="where">{{ tn(it.where) }}</span>
        <span class="val">{{ formatValue(it.value) }}</span>
      </li>
    </ul>
    <p v-else class="empty">{{ t('result.empty') }}</p>

    <button class="btn-again" @click="emit('restart')">{{ t('result.again') }}</button>
  </div>
</template>

<style scoped>
.result {
  max-width: 640px;
  margin: 0 auto;
  padding: 32px 16px 48px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
h1 {
  margin: 0;
  text-align: center;
  letter-spacing: 0.1em;
  color: var(--accent);
  font-size: clamp(26px, 6vw, 40px);
}
.label {
  display: block;
  font-size: 13px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.summary {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 10px;
}
.summary > div {
  background: var(--panel);
  border: 1px solid #222a32;
  padding: 10px 14px;
}
.summary b {
  font-size: 22px;
  color: var(--text-strong);
}
.summary .big b {
  font-size: 30px;
  color: var(--accent);
}

.best {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px;
  border: 1px solid var(--rc);
  background: linear-gradient(120deg, color-mix(in srgb, var(--rc) 30%, transparent), var(--panel));
}
.best .icon {
  font-size: 52px;
}
.best img.icon {
  width: 96px;
  height: 64px;
  object-fit: contain;
}
.best-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-strong);
}

.rarities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  padding: 2px 10px;
  border: 1px solid var(--rc);
  color: var(--rc);
  font-weight: 600;
  font-size: 14px;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.list li {
  display: grid;
  grid-template-columns: 36px 1fr auto auto;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  background: var(--panel);
  border-left: 3px solid var(--rc);
}
.list .icon {
  font-size: 22px;
}
.list img.icon {
  width: 36px;
  height: 24px;
  object-fit: contain;
}
.list .name {
  color: var(--text-strong);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.list .where {
  color: var(--muted);
  font-size: 13px;
}
.list .val {
  font-variant-numeric: tabular-nums;
  color: var(--text-strong);
  min-width: 80px;
  text-align: right;
}
.empty {
  text-align: center;
  color: var(--muted);
}

.btn-again {
  align-self: center;
  margin-top: 8px;
  padding: 14px 48px;
  font: inherit;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: #0b0f12;
  background: var(--accent);
  border: none;
  cursor: pointer;
  clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
}
.btn-again:hover {
  filter: brightness(1.15);
}

@media (max-width: 520px) {
  .summary {
    grid-template-columns: 1fr 1fr;
  }
  .summary .big {
    grid-column: span 2;
  }
  .list .where {
    display: none;
  }
  .list li {
    grid-template-columns: 30px 1fr auto;
  }
}
</style>
