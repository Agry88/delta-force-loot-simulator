export function formatValue(n) {
  return n.toLocaleString('en-US')
}

export function formatShort(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1)}K`
  return String(n)
}

export function formatClock(seconds) {
  const s = Math.ceil(seconds)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
