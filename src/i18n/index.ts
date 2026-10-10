import { ref, watchEffect } from 'vue'
import en from './en.ts'
import zhTW from './zh-TW.ts'

// English is the reference locale: it defines every UI key.
export type UiKey = keyof typeof en.ui

export interface Messages {
  ui: Partial<Record<UiKey, string>>
  names?: Record<string, string>
}

export type Locale = 'en' | 'zh-TW'

const MESSAGES: Record<Locale, Messages> = { en, 'zh-TW': zhTW }
export const LOCALES: { id: Locale; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'zh-TW', label: '繁中' },
]

const STORAGE_KEY = 'locale'

const isLocale = (id: unknown): id is Locale => typeof id === 'string' && id in MESSAGES

function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLocale(saved)) return saved
  } catch {}
  return /^zh/i.test(navigator.language) ? 'zh-TW' : 'en'
}

export const locale = ref(initialLocale())

export function setLocale(id: string) {
  if (isLocale(id)) locale.value = id
}

watchEffect(() => {
  document.documentElement.lang = locale.value
  try {
    localStorage.setItem(STORAGE_KEY, locale.value)
  } catch {}
})

// UI string by key, with {name} placeholders filled from params. Falls back to English.
export function t(key: UiKey, params: Record<string, string | number> = {}): string {
  const msg = MESSAGES[locale.value].ui[key] ?? en.ui[key]
  return msg.replace(/\{(\w+)\}/g, (m, p: string) => (p in params ? String(params[p]) : m))
}

// Game data (items, slots, containers, rarities) is keyed by its English name.
export function tn(name: string): string {
  return MESSAGES[locale.value].names?.[name] ?? name
}
