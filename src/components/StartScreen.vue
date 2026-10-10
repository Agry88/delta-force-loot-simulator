<script setup>
defineProps({ duration: { type: Number, required: true } })
const emit = defineEmits(['start'])
</script>

<template>
  <div class="start">
    <h1>LOOT SIMULATOR</h1>
    <p class="sub">You have {{ duration }} seconds. Search containers, grab the best loot, extract.</p>
    <button class="btn-start" @click="emit('start')">START</button>
    <p class="hint">Click an item to quick-move it · Drag to place it exactly · Safebox is yours</p>
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
