import { ref, watchEffect } from 'vue'
import en from './en.js'
import zhTW from './zh-TW.js'

const MESSAGES = { en, 'zh-TW': zhTW }
export const LOCALES = [
  { id: 'en', label: 'EN' },
  { id: 'zh-TW', label: '繁中' },
]

const STORAGE_KEY = 'locale'

function initialLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved in MESSAGES) return saved
  } catch {}
  return /^zh/i.test(navigator.language) ? 'zh-TW' : 'en'
}

export const locale = ref(initialLocale())

export function setLocale(id) {
  if (id in MESSAGES) locale.value = id
}

watchEffect(() => {
  document.documentElement.lang = locale.value
  try {
    localStorage.setItem(STORAGE_KEY, locale.value)
  } catch {}
})

// UI string by key, with {name} placeholders filled from params. Falls back to English, then the key.
export function t(key, params = {}) {
  const msg = MESSAGES[locale.value].ui[key] ?? en.ui[key] ?? key
  return msg.replace(/\{(\w+)\}/g, (m, p) => (p in params ? params[p] : m))
}

// Game data (items, slots, containers, rarities) is keyed by its English name.
export function tn(name) {
  return MESSAGES[locale.value].names?.[name] ?? name
}
