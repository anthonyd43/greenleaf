const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]

/** '"July 2026"' or '"Jul 2026"' → '2026-07'; null when the label is not a "<Month> <Year>" string. */
export function labelToMonth(label: string): string | null {
  const m = /^([A-Za-z]+)\s+(\d{4})$/.exec(label.trim())
  if (!m) return null
  const name = m[1].toLowerCase()
  const idx = MONTHS.findIndex(full => full === name || full.slice(0, 3) === name)
  if (idx === -1) return null
  return `${m[2]}-${String(idx + 1).padStart(2, '0')}`
}

/** Days of `month` strictly after `todayIso`; null when today is outside the month. */
export function daysLeftInMonth(month: string, todayIso: string): number | null {
  if (!todayIso.startsWith(`${month}-`)) return null
  const [y, mo] = month.split('-').map(Number)
  const total = new Date(Date.UTC(y, mo, 0)).getUTCDate()
  return total - Number(todayIso.slice(8, 10))
}
