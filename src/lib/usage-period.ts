// Pure string/UTC helpers for deriving billing usage periods from free-text
// sheet fixtures. No DB, no framework imports.

const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
}

/** Splits a cycle label into tokens, breaking on whitespace and any dash-like separator. */
function splitLabelTokens(label: string): string[] {
  return label.split(/[\s‐‑‒–—―-]+/).filter(Boolean)
}

/** Maps a single trimmed, digit-free token to a month number (1-12), else null. */
function monthNameToNumber(token: string): number | null {
  const t = token.trim().toLowerCase()
  if (!t || /\d/.test(t)) return null
  return MONTH_NAMES[t] ?? null
}

/**
 * Extracts the last 4-digit year in the cycle label and the month token
 * immediately adjacent to it (e.g. 'Jun–Jul 2025' -> month Jul, year 2025).
 */
function parseCycleLabel(cycleLabel: string): { year: number; month: number } | null {
  const tokens = splitLabelTokens(cycleLabel)
  let yearIdx = -1
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (/^\d{4}$/.test(tokens[i])) {
      yearIdx = i
      break
    }
  }
  if (yearIdx === -1) return null
  const year = Number(tokens[yearIdx])
  const monthToken = tokens[yearIdx - 1]
  if (!monthToken) return null
  const month = monthNameToNumber(monthToken)
  if (month === null) return null
  return { year, month }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Leap-aware day count for a given year/month (1-12), via UTC math. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function buildDate(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year)) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > daysInMonth(year, month)) return null
  return `${year}-${pad2(month)}-${pad2(day)}`
}

/**
 * Converts a 'YYYY-MM' month string into its calendar-day range.
 * Leap-aware. Throws on malformed input or an out-of-range month.
 */
export function monthToRange(month: string): { start: string; end: string } {
  const match = /^(\d{4})-(\d{2})$/.exec(month)
  if (!match) throw new Error(`Invalid month: ${month}`)
  const year = Number(match[1])
  const mo = Number(match[2])
  if (mo < 1 || mo > 12) throw new Error(`Invalid month: ${month}`)
  const start = `${match[1]}-${match[2]}-01`
  const end = `${match[1]}-${match[2]}-${pad2(daysInMonth(year, mo))}`
  return { start, end }
}

/**
 * Returns the 'YYYY-MM' month if [start, end] is exactly that calendar month,
 * else null.
 */
export function rangeIsCalendarMonth(start: string, end: string): string | null {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(start)
  if (!match) return null
  const month = `${match[1]}-${match[2]}`
  let range: { start: string; end: string }
  try {
    range = monthToRange(month)
  } catch {
    return null
  }
  return range.start === start && range.end === end ? month : null
}

const EXPLICIT_YEAR_RANGE =
  /^(\d{1,2})\/(\d{1,2})\/(\d{2})\s*-\s*(\d{1,2})\/(\d{1,2})\/(\d{2})$/
const BARE_RANGE = /^(\d{1,2})\/(\d{1,2})\s*-\s*(\d{1,2})\/(\d{1,2})$/

/**
 * Derives a usage period from free-text usage description plus its cycle
 * label. Returns null for anything unparseable, multi-month, or lacking a
 * year (directly or via the cycle label).
 */
export function deriveUsagePeriod(
  text: string | null,
  cycleLabel: string,
): { start: string; end: string } | null {
  if (!text) return null
  const trimmed = text.trim()
  if (!trimmed) return null

  // MM/DD/YY - MM/DD/YY: explicit years, no cycle-label inference needed.
  const explicit = EXPLICIT_YEAR_RANGE.exec(trimmed)
  if (explicit) {
    const [, sm, sd, sy, em, ed, ey] = explicit
    const start = buildDate(2000 + Number(sy), Number(sm), Number(sd))
    const end = buildDate(2000 + Number(ey), Number(em), Number(ed))
    if (!start || !end) return null
    return { start, end }
  }

  // MM/DD - MM/DD: year comes from the cycle label. The label year anchors
  // the end date; the start date wraps back a year if its month is later
  // in the calendar than the end month (i.e. the range crosses new year's).
  const bare = BARE_RANGE.exec(trimmed)
  if (bare) {
    const [, sm, sd, em, ed] = bare
    const label = parseCycleLabel(cycleLabel)
    if (!label) return null
    const startMonth = Number(sm)
    const endMonth = Number(em)
    // Guard against blindly trusting the label year for a range it has no
    // real connection to: the label's month must match one side of the
    // range, otherwise this is a mismatched/typo'd fixture — return null
    // rather than a confidently wrong date.
    if (label.month !== startMonth && label.month !== endMonth) return null
    const endYear = label.year
    const startYear = startMonth > endMonth ? endYear - 1 : endYear
    const start = buildDate(startYear, startMonth, Number(sd))
    const end = buildDate(endYear, endMonth, Number(ed))
    if (!start || !end) return null
    return { start, end }
  }

  // Single month name/abbreviation token: year from the cycle label, with
  // the usage month wrapping to the previous year when it falls later in
  // the calendar than the label's month (e.g. December usage under a
  // January-labeled cycle).
  const monthNum = monthNameToNumber(trimmed)
  if (monthNum !== null) {
    const label = parseCycleLabel(cycleLabel)
    if (!label) return null
    const year = monthNum > label.month ? label.year - 1 : label.year
    return monthToRange(`${year}-${pad2(monthNum)}`)
  }

  return null
}
