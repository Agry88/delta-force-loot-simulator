<script setup>
import { ref } from 'vue'
import StartScreen from './components/StartScreen.vue'
import RaidScreen from './components/RaidScreen.vue'
import ResultScreen from './components/ResultScreen.vue'

const RAID_SECONDS = 30

const phase = ref('start') // 'start' | 'raid' | 'result'
const result = ref(null)

function onFinish(r) {
  result.value = r
  phase.value = 'result'
}
</script>

<template>
  <StartScreen v-if="phase === 'start'" :duration="RAID_SECONDS" @start="phase = 'raid'" />
  <RaidScreen v-else-if="phase === 'raid'" :duration="RAID_SECONDS" @finish="onFinish" />
  <ResultScreen v-else :result="result" @restart="phase = 'raid'" />
</template>
