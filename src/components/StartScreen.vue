<script setup lang="ts">
import { LOOT_MODES } from '../domain/loot.ts'
import { t } from '../i18n/index.ts'
import type { LootMode } from '../domain/models.ts'

defineProps<{ duration: number }>()
const mode = defineModel<LootMode>('mode', { default: 'both' })
const emit = defineEmits<{ start: [] }>()
</script>

<template>
  <div class="start">
    <h1>{{ t('start.title') }}</h1>
    <p class="sub">{{ t('start.sub', { seconds: duration }) }}</p>
    <div class="modes" role="radiogroup" :aria-label="t('start.modeLabel')">
      <span class="modes-label">{{ t('start.modeLabel') }}</span>
      <button
        v-for="m in LOOT_MODES"
        :key="m"
        role="radio"
        :aria-checked="mode === m"
        :class="{ active: mode === m }"
        @click="mode = m"
      >
        {{ t(`start.mode.${m}`) }}
      </button>
    </div>
    <button class="btn-start" @click="emit('start')">{{ t('start.button') }}</button>
    <p class="hint">{{ t('start.hint') }}</p>
  </div>
</template>

<style scoped>
.start {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 16px;
  text-align: center;
  background: radial-gradient(ellipse at center, #1a222a 0%, var(--bg) 70%);
}
h1 {
  margin: 0;
  font-size: clamp(36px, 8vw, 72px);
  letter-spacing: 0.12em;
  color: var(--text-strong);
}
.sub {
  margin: 0;
  color: var(--text);
  font-size: 18px;
}
.modes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}
.modes-label {
  width: 100%;
  font-size: 13px;
  color: var(--muted);
  letter-spacing: 0.08em;
}
.modes button {
  min-width: 120px;
  padding: 8px 18px;
  font: inherit;
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
  background: var(--panel);
  border: 1px solid #2c353e;
  cursor: pointer;
}
.modes button:hover {
  color: var(--text-strong);
  border-color: #4a5560;
}
.modes button.active {
  color: var(--text-strong);
  background: linear-gradient(180deg, transparent, rgb(58 214 176 / 0.14));
  border-color: var(--accent);
}
.btn-start {
  margin-top: 16px;
  padding: 18px 72px;
  font: inherit;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #0b0f12;
  background: var(--accent);
  border: none;
  cursor: pointer;
  clip-path: polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
  transition: transform 0.1s, filter 0.1s;
}
.btn-start:hover {
  filter: brightness(1.15);
  transform: scale(1.04);
}
.hint {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}
</style>
