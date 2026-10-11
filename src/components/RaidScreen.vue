<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watchEffect } from 'vue'
import OperatorFigure from './OperatorFigure.vue'
import SlotBox from './SlotBox.vue'
import StorageSection from './StorageSection.vue'
import ItemDialog from './ItemDialog.vue'
import { lootGenerator } from '../di.ts'
import { findSlot, findSpot, fits } from '../domain/grid.ts'
import { carryWeight, itemActionTargets, lootValue, quickMoveTargets, raidResult, storageOf } from '../domain/raid.ts'
import type { ItemAction } from '../domain/raid.ts'
import { RARITIES, SEARCH_TIME } from '../domain/rarity.ts'
import { formatClock, formatValue } from '../lib/format.ts'
import { hideTooltip, tooltip } from '../lib/tooltip.ts'
import { t, tn } from '../i18n/index.ts'
import LangToggle from './LangToggle.vue'
import type { Item, LootMode, RaidResult, SlotStorage, Storage } from '../domain/models.ts'

interface Props {
  duration: number
  mode?: LootMode
}

interface Emits {
  finish: [result: RaidResult]
}

const props = withDefaults(defineProps<Props>(), { mode: 'both' })
const emit = defineEmits<Emits>()

const player = reactive(lootGenerator.createPlayer())
const loot = ref(lootGenerator.createLootContainer(props.mode))
const containersOpened = ref(1)
const remaining = ref(props.duration)
const toast = ref('')

const playerStorages = computed<Storage[]>(() => [...player.slots, ...player.grids])
const allStorages = computed<Storage[]>(() => [...playerStorages.value, ...loot.value.slots, ...loot.value.grids])
const playerSlot = (id: string) => findSlot(player.slots, id)
const lootSlot = (id: string) => findSlot(loot.value.slots, id)

const earnings = computed(() => lootValue(playerStorages.value))
const weight = computed(() => carryWeight(playerStorages.value))
const searching = computed(() => loot.value.grids.some((g) => g.items.some((it) => !it.revealed)))

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
  hideTooltip()
  emit('finish', raidResult(playerStorages.value, containersOpened.value))
}

function onKey(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (inspecting.value) closeDetails()
  else finish()
}

onMounted(() => {
  endAt = performance.now() + props.duration * 1000
  timerId = setInterval(tick, 100)
  window.addEventListener('keydown', onKey)
  runSearch()
})
onBeforeUnmount(() => {
  clearInterval(timerId)
  window.removeEventListener('keydown', onKey)
  searchToken++
  hideTooltip()
})

// --- searching: reveal loot one item at a time ------------------------------

let searchToken = 0
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function runSearch() {
  const token = ++searchToken
  const queue = loot.value.grids.flatMap((g) => [...g.items].sort((a, b) => a.y - b.y || a.x - b.x))
  for (const item of queue) {
    item.searching = true
    await sleep(SEARCH_TIME[item.def.rarity] * 1000)
    if (token !== searchToken) return
    item.searching = false
    item.revealed = true
  }
}

function nextContainer() {
  hideTooltip()
  loot.value = lootGenerator.createLootContainer(props.mode)
  containersOpened.value++
  runSearch()
}

// --- moving items --------------------------------------------------------------

let toastTimer = 0
function flash(msg: string) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 1200)
}

function moveItem(item: Item, from: Storage, to: Storage, x: number, y: number) {
  hideTooltip()
  from.items.splice(from.items.indexOf(item), 1)
  item.x = x
  item.y = y
  to.items.push(item)
}

// --- item details ----------------------------------------------------------------

// The item whose detail dialog is open, floating beside it.
const inspecting = ref<Item | null>(null)
const inspectingFrom = computed(() => (inspecting.value ? storageOf(inspecting.value, allStorages.value) : null))

// Close when the item goes away, e.g. the container it was in is swapped for the next one.
watchEffect(() => {
  if (inspecting.value && !inspectingFrom.value) inspecting.value = null
})

function closeDetails() {
  hideTooltip()
  inspecting.value = null
}

function showDetails(item: Item) {
  if (!item.revealed) return
  hideTooltip()
  inspecting.value = item
}

// Detaching a part hands it to the player, or drops it in the container when they're full.
function detach(part: Item, from: SlotStorage) {
  for (const target of [...player.grids, ...loot.value.grids]) {
    const spot = findSpot(target, part.def)
    if (spot) return moveItem(part, from, target, spot.x, spot.y)
  }
  flash(t('raid.noSpace'))
}

// Equip / pick up / put back the open item. The dialog stays open and follows it.
function itemAction(action: ItemAction) {
  const item = inspecting.value
  const from = inspectingFrom.value
  if (!item || !from) return
  for (const target of itemActionTargets(action, player, loot.value)) {
    if (target === from) continue
    const spot = findSpot(target, item.def)
    if (spot) return moveItem(item, from, target, spot.x, spot.y)
  }
  flash(t(action === 'equip' ? 'raid.cantEquip' : 'raid.noSpace'))
}

function quickMove(item: Item, from: Storage) {
  if (!item.revealed || (from.kind === 'slot' && from.locked)) return
  for (const target of quickMoveTargets(item, from, player, loot.value)) {
    const spot = findSpot(target, item.def)
    if (spot) return moveItem(item, from, target, spot.x, spot.y)
  }
  flash(t('raid.noSpace'))
}

interface Drag {
  item: Item
  from: Storage
  // Which cell of the item was grabbed.
  gx: number
  gy: number
}

let drag: Drag | null = null
function onDrop(target: Storage, cx: number, cy: number) {
  if (!drag) return
  const { item, from, gx, gy } = drag
  drag = null
  const x = target.kind === 'slot' ? 0 : cx - gx
  const y = target.kind === 'slot' ? 0 : cy - gy
  if (target === from && target.kind === 'slot') return
  if (fits(target, item.def, x, y, item)) moveItem(item, from, target, x, y)
  else flash(t(target.kind === 'slot' ? 'raid.cantEquip' : 'raid.doesntFit'))
}

// Event handlers for one storage (grid or slot), spread onto its component.
function on(storage: Storage) {
  return {
    'item-click': showDetails,
    'item-dblclick': (item: Item) => {
      closeDetails()
      quickMove(item, storage)
    },
    'drag-start': (item: Item, gx: number, gy: number) => (drag = { item, from: storage, gx, gy }),
    'drop-at': (cx: number, cy: number) => onDrop(storage, cx, cy),
  }
}

const tipStyle = computed(() => ({
  left: `${Math.min(tooltip.x + 16, window.innerWidth - 230)}px`,
  top: `${tooltip.y + 16}px`,
}))
</script>

<template>
  <div class="raid">
    <header class="topbar">
      <nav class="tabs">
        <kbd>Q</kbd>
        <span class="tab active">{{ t('raid.tabCharacter') }}</span>
        <span class="tab">{{ t('raid.tabHealth') }}</span>
        <kbd>E</kbd>
      </nav>
      <div class="timer" :class="{ danger: remaining <= 10 }">
        <span>{{ t('raid.timeToExtraction') }}</span>
        <span class="clock">◷</span>
        <b>{{ formatClock(remaining) }}</b>
      </div>
      <LangToggle />
    </header>

    <main class="columns">
      <section class="character">
        <div class="figure"><OperatorFigure /></div>
        <div class="equipment">
          <SlotBox v-for="id in ['helmet', 'armor', 'pistol', 'melee']" :key="id" :slot="playerSlot(id)" v-on="on(playerSlot(id))" />
          <SlotBox v-for="id in ['weapon1', 'weapon2']" :key="id" :slot="playerSlot(id)" v-on="on(playerSlot(id))" />
        </div>
        <div class="vitals">
          <div class="weight">
            <span class="lock">🔒</span>
            <b>{{ weight.toFixed(1) }}</b><small>/72kg</small>
          </div>
          <div class="hp">
            <b>80</b><small>/80</small>
            <span class="hp-bar"><span /></span>
          </div>
          <div class="callsign">{{ t('raid.callsign') }}</div>
        </div>
      </section>

      <section class="panel inventory">
        <div class="earnings">
          <span class="menu">☰</span>
          {{ t('raid.earnings') }}
          <span class="coin" />
          <b>{{ formatValue(earnings) }}</b>
        </div>
        <div class="scroll">
          <StorageSection
            v-for="g in player.grids"
            :key="g.id"
            :grid="g"
            :note="g.id === 'safebox' ? t('raid.protected') : ''"
            v-on="on(g)"
          />
        </div>
      </section>

      <section class="panel loot">
        <div class="loot-head">
          {{ t('raid.loot') }}
          <span class="loot-name">{{ tn(loot.name) }}</span>
          <em>{{ t(searching ? 'raid.searching' : 'raid.searched') }}</em>
        </div>
        <div :key="containersOpened" class="scroll">
          <div v-if="loot.slots.length" class="loot-gear">
            <SlotBox v-for="id in ['weapon1', 'weapon2']" :key="id" :slot="lootSlot(id)" v-on="on(lootSlot(id))" />
            <SlotBox
              v-for="id in ['helmet', 'armor', 'pistol', 'melee']"
              :key="id"
              :slot="lootSlot(id)"
              v-on="on(lootSlot(id))"
            />
          </div>
          <StorageSection v-for="g in loot.grids" :key="g.id" :grid="g" v-on="on(g)" />
          <button class="next" @click="nextContainer">{{ t('raid.next') }}</button>
        </div>
      </section>
    </main>

    <footer class="hints">
      <span><kbd>LMB</kbd> {{ t('raid.hintDetails') }}</span>
      <span><kbd>LMB×2</kbd> {{ t('raid.hintQuickMove') }}</span>
      <span class="desktop-only"><kbd>Drag</kbd> {{ t('raid.hintCarry') }}</span>
      <span class="desktop-only"><kbd>Drag</kbd> {{ t('raid.hintEquip') }}</span>
      <button class="extract" @click="finish"><kbd>Esc</kbd> {{ t('raid.extract') }}</button>
    </footer>

    <div v-if="tooltip.item" class="tooltip" :style="tipStyle">
      <div class="tip-name">{{ tn(tooltip.item.def.name) }}</div>
      <div class="tip-rarity" :class="`r${tooltip.item.def.rarity}`">{{ tn(RARITIES[tooltip.item.def.rarity]) }}</div>
      <div class="tip-value"><span class="coin" /> {{ formatValue(tooltip.item.value) }}</div>
    </div>

    <ItemDialog
      v-if="inspecting && inspectingFrom"
      :key="inspecting.uid"
      :item="inspecting"
      :from="inspectingFrom"
      @close="closeDetails"
      @action="itemAction"
      @part-dblclick="(slot, part) => detach(part, slot)"
      @drag-start="(slot, item, gx, gy) => on(slot)['drag-start'](item, gx, gy)"
      @drop-at="(slot) => onDrop(slot, 0, 0)"
    />

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<style scoped>
.raid {
  --slot: 104px;
  height: 100vh;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  padding: 0 24px;
  background:
    radial-gradient(ellipse at 22% 45%, #1c242c 0%, transparent 55%),
    linear-gradient(180deg, #0f1317, #0a0d10);
  overflow: hidden;
}

/* --- top bar --- */
.topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 0 10px;
}
.tabs {
  display: flex;
  align-items: center;
  gap: 2px;
}
kbd {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  color: #0b0f12;
  background: #59636d;
  border-radius: 2px;
}
.tabs kbd {
  margin: 0 8px;
}
.tab {
  padding: 7px 18px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--muted);
  border-bottom: 2px solid transparent;
}
.tab.active {
  color: var(--text-strong);
  background: linear-gradient(180deg, transparent, rgb(58 214 176 / 0.12));
  border: 1px solid #2c353e;
  border-bottom: 2px solid var(--accent);
}
.timer {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 16px;
}
.timer b {
  font-size: 22px;
  color: var(--text-strong);
  font-variant-numeric: tabular-nums;
}
.clock {
  font-size: 18px;
  color: var(--text-strong);
}
.timer.danger b,
.timer.danger .clock {
  color: var(--danger);
  animation: blink 0.5s steps(2) infinite;
}

/* --- columns --- */
.columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 22px;
  min-height: 0;
}
.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: calc(9 * var(--cell) + 5px + 40px);
  padding: 10px 12px;
  background: rgb(20 26 32 / 0.85);
  border: 1px solid #1f262d;
}
.scroll {
  overflow-y: auto;
  min-height: 0;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: #3a444e transparent;
}

/* --- character --- */
.character {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  min-height: 0;
}
.figure {
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 60px;
}
.equipment {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  width: calc(var(--slot) * 2 + 6px);
  overflow-y: auto;
  scrollbar-width: none;
}
.vitals {
  position: absolute;
  left: 0;
  bottom: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: var(--text-strong);
}
.vitals small {
  color: var(--muted);
}
.weight {
  font-size: 20px;
}
.weight .lock {
  font-size: 13px;
  margin-right: 4px;
}
.hp {
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-size: 18px;
}
.hp-bar {
  width: 110px;
  height: 4px;
  margin-left: 8px;
  background: #2a3138;
  align-self: center;
}
.hp-bar span {
  display: block;
  height: 100%;
  width: 100%;
  background: #d9dee3;
}
.callsign {
  color: var(--muted);
  font-size: 14px;
}

/* --- inventory --- */
.earnings {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 4px 10px;
  font-size: 17px;
  font-weight: 600;
  color: var(--text-strong);
}
.menu {
  color: var(--muted);
}
.coin {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fff, #8a939b);
}

/* --- loot --- */
.loot-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 8px 14px;
  margin-bottom: 10px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #fff;
  background: linear-gradient(90deg, #8a2228, #4a1418 70%, #2a1214);
  border-left: 3px solid #e5484d;
}
.loot-name {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
  color: #f2c9cb;
}
.loot-head em {
  margin-left: auto;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  letter-spacing: 0;
  color: #d9a3a6;
}
.loot-gear {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.next {
  display: block;
  width: 100%;
  margin-top: 14px;
  padding: 8px;
  font: inherit;
  font-weight: 700;
  color: var(--text-strong);
  background: #1e262e;
  border: 1px solid #343e48;
  cursor: pointer;
}
.next:hover {
  background: #27313a;
}

/* --- footer hints --- */
.hints {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 26px;
  padding: 10px 0 14px;
  font-size: 14px;
  color: var(--muted);
}
.hints span,
.extract {
  display: flex;
  align-items: center;
  gap: 6px;
}
.extract {
  padding: 0;
  font: inherit;
  color: var(--text-strong);
  background: none;
  border: none;
  cursor: pointer;
}
.extract:hover {
  color: var(--accent);
}

/* --- floating bits --- */
.tooltip {
  position: fixed;
  z-index: 10;
  min-width: 150px;
  padding: 6px 10px;
  pointer-events: none;
  background: rgb(14 18 22 / 0.96);
  border: 1px solid #333d47;
  color: var(--text-strong);
}
.tip-name {
  font-weight: 600;
}
.tip-rarity {
  font-size: 12px;
  color: var(--rc);
}
.tip-value {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text);
}
.toast {
  position: fixed;
  left: 50%;
  bottom: 56px;
  transform: translateX(-50%);
  z-index: 11;
  padding: 8px 18px;
  font-weight: 600;
  color: #ffd7d9;
  background: #2a1517;
  border: 1px solid var(--danger);
}

@keyframes blink {
  50% { opacity: 0.4; }
}

/* Narrower desktops: drop the figure, keep the gear column. */
@media (max-width: 1340px) {
  .raid {
    --slot: 92px;
  }
  .figure,
  .vitals {
    display: none;
  }
  .character {
    grid-template-columns: auto;
  }
}

/* Tablets and phones: stack everything and scroll the page. */
@media (max-width: 1100px) {
  .raid {
    height: auto;
    min-height: 100vh;
    overflow: visible;
    padding: 0 16px;
  }
  .columns {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .loot {
    order: -1;
  }
  .character {
    order: 1;
  }
  .equipment {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    width: auto;
    max-width: calc(var(--slot) * 4 + 18px);
  }
  .scroll {
    overflow: visible;
  }
  .hints {
    position: sticky;
    bottom: 0;
    background: #0a0d10;
  }
}

@media (max-width: 700px) {
  .raid {
    --slot: 72px;
  }
  .panel {
    width: 100%;
    max-width: calc(7 * var(--cell) + 26px);
  }
  .tab:not(.active),
  .tabs kbd,
  .hints .desktop-only {
    display: none;
  }
  .timer > span:first-child {
    display: none;
  }
}
</style>
