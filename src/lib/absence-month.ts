// Pure UTC date-math helpers for reconciling a month's absence-day selection
// against existing absence ranges. No DB, no framework imports.

import { monthToRange } from '@/lib/usage-period'

export type AbsRange = { id: number; startDate: string; endDate: string; note: string | null }

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Parses an ISO 'YYYY-MM-DD' string into UTC epoch milliseconds. */
function isoToUTCms(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** Formats UTC epoch milliseconds back into an ISO 'YYYY-MM-DD' string. */
function utcMsToISO(ms: number): string {
  const dt = new Date(ms)
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`
}

/** Adds (or subtracts) whole days to an ISO date string via UTC math. */
function addDays(iso: string, n: number): string {
  return utcMsToISO(isoToUTCms(iso) + n * 86_400_000)
}

/** Lists every ISO day between start and end (inclusive), both ISO strings. */
function enumerateDays(start: string, end: string): string[] {
  const days: string[] = []
  for (let cur = start; cur <= end; cur = addDays(cur, 1)) {
    days.push(cur)
  }
  return days
}

/**
 * Returns the sorted, deduped ISO days within `month` covered by any range,
 * clipping each range to the month's bounds first.
 */
export function listMonthDays(ranges: AbsRange[], month: string): string[] {
  const { start, end } = monthToRange(month)
  const days = new Set<string>()
  for (const r of ranges) {
    const s = r.startDate > start ? r.startDate : start
    const e = r.endDate < end ? r.endDate : end
    if (s > e) continue
    for (const d of enumerateDays(s, e)) days.add(d)
  }
  return Array.from(days).sort()
}

/**
 * Reconciles a month's absent-day selection against existing ranges.
 *
 * Every range intersecting `month` is deleted. Its out-of-month fragments
 * (the parts of the range falling before or after the month) are recreated
 * as-is, inheriting the source range's note. The submitted `absentDays` are
 * filtered to those within `month`, deduped, sorted, and merged into
 * consecutive-day runs, which are also added to `create`; each such run
 * inherits the note of the first deleted range it overlaps by day (in the
 * order `ranges` were given), or `null` if it overlaps none — meaning it's a
 * genuinely new run, and the caller should apply whatever note the user
 * submitted for this save. Ranges that don't touch `month` are left
 * untouched.
 */
export function reconcileMonth(
  ranges: AbsRange[],
  month: string,
  absentDays: string[],
): { deleteIds: number[]; create: { startDate: string; endDate: string; note: string | null }[] } {
  const { start, end } = monthToRange(month)

  const deleteIds: number[] = []
  const fragments: { startDate: string; endDate: string; note: string | null }[] = []
  const deletedRanges: { startDate: string; endDate: string; note: string | null }[] = []

  for (const r of ranges) {
    const overlapStart = r.startDate > start ? r.startDate : start
    const overlapEnd = r.endDate < end ? r.endDate : end
    if (overlapStart > overlapEnd) continue // no intersection with month; untouched

    deleteIds.push(r.id)
    deletedRanges.push({ startDate: r.startDate, endDate: r.endDate, note: r.note })
    if (r.startDate < start) {
      fragments.push({ startDate: r.startDate, endDate: addDays(start, -1), note: r.note })
    }
    if (r.endDate > end) {
      fragments.push({ startDate: addDays(end, 1), endDate: r.endDate, note: r.note })
    }
  }

  const daysInMonth = Array.from(new Set(absentDays.filter((d) => d >= start && d <= end))).sort()

  const runs: { startDate: string; endDate: string; note: string | null }[] = []
  for (const d of daysInMonth) {
    const last = runs[runs.length - 1]
    if (last && addDays(last.endDate, 1) === d) {
      last.endDate = d
    } else {
      runs.push({ startDate: d, endDate: d, note: null })
    }
  }

  // A run inherits the note of the first deleted range it overlaps by day
  // (day-range overlap against that range's original, unclipped span).
  for (const run of runs) {
    const source = deletedRanges.find((dr) => run.startDate <= dr.endDate && run.endDate >= dr.startDate)
    run.note = source ? source.note : null
  }

  return { deleteIds, create: [...fragments, ...runs] }
}
