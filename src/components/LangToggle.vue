<script setup lang="ts">
import { LOCALES, locale, setLocale } from '../i18n/index.ts'
</script>

<template>
  <div class="lang" role="group" aria-label="Language">
    <button
      v-for="l in LOCALES"
      :key="l.id"
      :class="{ active: locale === l.id }"
      :aria-pressed="locale === l.id"
      @click="setLocale(l.id)"
    >
      {{ l.label }}
    </button>
  </div>
</template>

<style scoped>
.lang {
  display: flex;
  border: 1px solid #2c353e;
}
button {
  padding: 3px 10px;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  background: none;
  border: none;
  cursor: pointer;
}
button:hover {
  color: var(--text-strong);
}
button.active {
  color: #0b0f12;
  background: var(--accent);
}
</style>
