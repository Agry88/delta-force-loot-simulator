<script setup lang="ts">
import { ref } from 'vue'
import StartScreen from './components/StartScreen.vue'
import RaidScreen from './components/RaidScreen.vue'
import ResultScreen from './components/ResultScreen.vue'
import LangToggle from './components/LangToggle.vue'
import type { LootMode, RaidResult } from './types.ts'

const RAID_SECONDS = 30

const mode = ref<LootMode>('both')
const phase = ref<'start' | 'raid' | 'result'>('start')
const result = ref<RaidResult | null>(null)

function onFinish(r: RaidResult) {
  result.value = r
  phase.value = 'result'
}
</script>

<template>
  <StartScreen v-if="phase === 'start'" v-model:mode="mode" :duration="RAID_SECONDS" @start="phase = 'raid'" />
  <RaidScreen v-else-if="phase === 'raid'" :duration="RAID_SECONDS" :mode="mode" @finish="onFinish" />
  <ResultScreen v-else-if="result" :result="result" @restart="phase = 'raid'" />
  <LangToggle v-if="phase !== 'raid'" class="corner-lang" />
</template>

<style scoped>
.corner-lang {
  position: fixed;
  top: 14px;
  right: 16px;
}
</style>
