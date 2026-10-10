<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import GridContainer from './GridContainer.vue'
import { createLootContainer, SEARCH_TIME } from '../data/items.js'
import { findSpot, fits, usedCells } from '../lib/grid.js'
import { formatClock, formatValue } from '../lib/format.js'

const props = defineProps({ duration: { type: Number, required: true } })
const emit = defineEmits(['finish'])

const player = reactive([
  { id: 'rig', name: 'Chest Rig', w: 7, h: 2, items: [] },
  { id: 'pockets', name: 'Pockets', w: 5, h: 1, items: [] },
  { id: 'backpack', name: 'Backpack', w: 6, h: 4, items: [] },
  { id: 'safebox', name: 'Safebox', w: 2, h: 2, items: [] },
])
const loot = ref(createLootContainer())
const containersOpened = ref(1)
const remaining = ref(props.duration)
const toast = ref('')

const earnings = computed(() => player.reduce((sum, g) => sum + g.items.reduce((s, it) => s + it.value, 0), 0))
const searching = computed(() => loot.value.items.some((it) => !it.revealed))

// --- timer -----------------------------------------------------------------

let endAt = 0
let timerId = 0
let finished = false

function tick() {
  remaining.value = Math.max(0, (endAt - performance.now()) / 1000)
  if (remaining.value <= 0) finish()
}

function finish() {
  if (finished) return
  finished = true
  clearInterval(timerId)
  searchToken++
  emit('finish', {
    items: player.flatMap((g) => g.items.map((it) => ({ ...it.def, value: it.value, where: g.name }))),
    containersOpened: containersOpened.value,
  })
}

onMounted(() => {
  endAt = performance.now() + props.duration * 1000
  timerId = setInterval(tick, 100)
  runSearch()
})
onBeforeUnmount(() => {
  clearInterval(timerId)
  searchToken++
})

// --- searching: reveal loot one item at a time ------------------------------

let searchToken = 0
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function runSearch() {
  const token = ++searchToken
  const queue = [...loot.value.items].sort((a, b) => a.y - b.y || a.x - b.x)
  for (const item of queue) {
    item.searching = true
    await sleep(SEARCH_TIME[item.def.rarity] * 1000)
    if (token !== searchToken) return
    item.searching = false
    item.revealed = true
  }
}

function nextContainer() {
  loot.value = createLootContainer()
  containersOpened.value++
  runSearch()
}

// --- moving items --------------------------------------------------------------

let toastTimer = 0
function flash(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 1200)
}

function moveItem(item, from, to, x, y) {
  from.items.splice(from.items.indexOf(item), 1)
  item.x = x
  item.y = y
  to.items.push(item)
}

function quickMove(item, from) {
  if (!item.revealed) return
  const targets = from === loot.value ? player : [loot.value]
  for (const g of targets) {
    const spot = findSpot(g, item.def.w, item.def.h)
    if (spot) return moveItem(item, from, g, spot.x, spot.y)
  }
  flash('Not enough space')
}

let drag = null
function onDragStart(item, grid, gx, gy) {
  drag = { item, grid, gx, gy }
}
function onDrop(target, cx, cy) {
  if (!drag) return
  const { item, grid, gx, gy } = drag
  drag = null
  const x = cx - gx
  const y = cy - gy
  if (fits(target, item.def.w, item.def.h, x, y, item)) moveItem(item, grid, target, x, y)
  else flash("Doesn't fit there")
}
</script>

<template>
  <div class="raid">
    <header class="topbar">
      <div class="tabs"><span class="tab active">CHARACTER</span></div>
      <div class="timer" :class="{ danger: remaining <= 10 }">
        Time to Extraction <b>{{ formatClock(remaining) }}</b>
      </div>
      <button class="btn" @click="finish">Extract now</button>
    </header>

    <div class="columns">
      <section class="panel character">
        <div class="avatar">🪖</div>
        <div class="gear">
          <div class="slot"><span>⛑️</span>Helmet</div>
          <div class="slot"><span>🦺</span>Body Armor</div>
          <div class="slot wide"><span>🔫</span>AUG 5.56x45</div>
        </div>
        <div class="stat">Containers searched: <b>{{ containersOpened }}</b></div>
      </section>

      <section class="panel inventory">
        <div class="earnings">
          Total Battle Earnings <span class="coin" /> <b>{{ formatValue(earnings) }}</b>
        </div>
        <div v-for="g in player" :key="g.id" class="section">
          <div class="section-head">
            {{ g.name }}: {{ usedCells(g) }}<small>/{{ g.w * g.h }}</small>
            <em v-if="g.id === 'safebox'">protected</em>
          </div>
          <GridContainer
            :grid="g"
            @item-click="(it) => quickMove(it, g)"
            @drag-start="(it, gx, gy) => onDragStart(it, g, gx, gy)"
            @drop-at="(cx, cy) => onDrop(g, cx, cy)"
          />
        </div>
      </section>

      <section class="panel loot">
        <div class="loot-head">LOOT</div>
        <div class="section-head">
          {{ loot.name }}
          <em>{{ searching ? 'Searching…' : 'Searched' }}</em>
        </div>
        <GridContainer
          :key="containersOpened"
          :grid="loot"
          @item-click="(it) => quickMove(it, loot)"
          @drag-start="(it, gx, gy) => onDragStart(it, loot, gx, gy)"
          @drop-at="(cx, cy) => onDrop(loot, cx, cy)"
        />
        <button class="btn next" @click="nextContainer">Search next container →</button>
      </section>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<style scoped>
.raid {
  min-height: 100vh;
  padding: 12px 16px 24px;
}
.topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.tab {
  display: inline-block;
  padding: 6px 16px;
  font-weight: 700;
  letter-spacing: 0.05em;
  border: 1px solid #2b333c;
  border-bottom: 2px solid var(--accent);
  color: var(--text-strong);
}
.timer {
  margin-left: auto;
  color: var(--text);
  font-size: 18px;
}
.timer b {
  font-size: 24px;
  color: var(--text-strong);
  margin-left: 6px;
  font-variant-numeric: tabular-nums;
}
.timer.danger b {
  color: var(--danger);
  animation: blink 0.5s steps(2) infinite;
}

.btn {
  font: inherit;
  font-weight: 700;
  padding: 6px 14px;
  color: var(--text-strong);
  background: #232b33;
  border: 1px solid #3a434d;
  cursor: pointer;
}
.btn:hover {
  background: #2c3640;
}

.columns {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: center;
  flex-wrap: wrap;
}
.panel {
  background: var(--panel);
  border: 1px solid #222a32;
  padding: 10px;
}

.character {
  width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.avatar {
  font-size: 96px;
  line-height: 1;
  padding: 12px 0;
}
.gear {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  width: 100%;
}
.slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
  padding: 6px;
  background: var(--cell-bg);
  border: 1px solid var(--cell-line);
}
.slot span {
  font-size: 26px;
}
.slot.wide {
  grid-column: span 2;
}
.stat {
  font-size: 14px;
}

.earnings {
  font-size: 17px;
  color: var(--text-strong);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.coin {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fff, #9aa0a6);
}
.section {
  margin-bottom: 10px;
}
.section-head {
  background: var(--header);
  padding: 3px 8px;
  margin-bottom: 4px;
  color: var(--text-strong);
  font-weight: 600;
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.section-head small {
  color: var(--muted);
}
.section-head em {
  margin-left: auto;
  font-style: normal;
  font-size: 12px;
  color: var(--muted);
  font-weight: 500;
}

.loot-head {
  background: linear-gradient(90deg, var(--loot), #3a1416);
  color: #fff;
  font-weight: 700;
  font-size: 20px;
  letter-spacing: 0.05em;
  padding: 6px 12px;
  margin-bottom: 8px;
}
.next {
  display: block;
  width: 100%;
  margin-top: 10px;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 32px;
  transform: translateX(-50%);
  background: #2a1517;
  border: 1px solid var(--danger);
  color: #ffd7d9;
  padding: 8px 18px;
  font-weight: 600;
}

@keyframes blink {
  50% { opacity: 0.4; }
}

@media (max-width: 700px) {
  .raid {
    padding: 10px 16px 24px;
  }
  .character {
    display: none;
  }
  .loot {
    order: -1;
  }
  .timer {
    margin-left: 0;
  }
}
</style>
