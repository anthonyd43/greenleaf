import { monthToRange, parseCycleLabel } from '@/lib/usage-period'

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function parseMonth(month: string): { year: number; month: number } {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month)
  if (!m) throw new Error(`Invalid month: ${month}`)
  return { year: Number(m[1]), month: Number(m[2]) }
}

/**
 * Cycle label → 'YYYY-MM'. Accepts full or short month names ('July 2026', 'Jul 2026',
 * 'Sept 2026'); a range like 'Jun–Jul 2025' gives its last month. null when the label has
 * no "<month> <year>" in it.
 */
export function labelToMonth(label: string): string | null {
  const parsed = parseCycleLabel(label)
  return parsed ? `${parsed.year}-${pad2(parsed.month)}` : null
}

/** 'YYYY-MM' → the label a cycle for that month gets, e.g. '2026-11' → 'Nov 2026'. */
export function monthToLabel(month: string): string {
  const { year, month: mo } = parseMonth(month)
  return `${SHORT_MONTHS[mo - 1]} ${year}`
}

/** The 'YYYY-MM' month after `month`. */
export function nextMonth(month: string): string {
  const { year, month: mo } = parseMonth(month)
  return mo === 12 ? `${year + 1}-01` : `${year}-${pad2(mo + 1)}`
}

/** 'YYYY-MM' moved by `delta` months (negative goes back). */
export function addMonths(month: string, delta: number): string {
  const { year, month: mo } = parseMonth(month)
  const index = year * 12 + (mo - 1) + delta
  return `${Math.floor(index / 12)}-${pad2((index % 12) + 1)}`
}

/** Whole months from `from` to `to` (both 'YYYY-MM'); negative when `to` is the earlier one. */
export function monthsBetween(from: string, to: string): number {
  const a = parseMonth(from)
  const b = parseMonth(to)
  return (b.year - a.year) * 12 + (b.month - a.month)
}

/**
 * Month a new cycle starts out as: the one after the latest cycle. Falls back to today's
 * calendar month when there is no cycle yet or the latest label has no month in it.
 */
export function defaultNewCycleMonth(latestLabel: string | null | undefined, todayIso: string): string {
  const latest = latestLabel ? labelToMonth(latestLabel) : null
  return latest ? nextMonth(latest) : todayIso.slice(0, 7)
}

/** Usage period a new bill starts out with: the cycle's whole month. null when the label has no month. */
export function cycleUsageDefaults(label: string): { month: string; start: string; end: string } | null {
  const month = labelToMonth(label)
  return month ? { month, ...monthToRange(month) } : null
}

/** Days of `month` strictly after `todayIso`; null when today is outside the month. */
export function daysLeftInMonth(month: string, todayIso: string): number | null {
  if (!todayIso.startsWith(`${month}-`)) return null
  const [y, mo] = month.split('-').map(Number)
  const total = new Date(Date.UTC(y, mo, 0)).getUTCDate()
  return total - Number(todayIso.slice(8, 10))
}
