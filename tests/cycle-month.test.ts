import { describe, expect, it } from 'vitest'
import {
  cycleUsageDefaults, daysLeftInMonth, defaultNewCycleMonth, labelToMonth, monthToLabel, nextMonth,
} from '@/lib/cycle-month'

describe('labelToMonth', () => {
  it('parses "July 2026" style labels', () => {
    expect(labelToMonth('July 2026')).toBe('2026-07')
    expect(labelToMonth('january 2025')).toBe('2025-01')
  })
  it('parses abbreviated month labels like "Jul 2026"', () => {
    expect(labelToMonth('Jul 2026')).toBe('2026-07')
    expect(labelToMonth('sep 2025')).toBe('2025-09')
    expect(labelToMonth('Dec 2026')).toBe('2026-12')
  })
  it('parses the "Sept" spelling used by older hand-typed labels', () => {
    expect(labelToMonth('Sept 2026')).toBe('2026-09')
  })
  it('takes the last month of a range label like "Jun–Jul 2025"', () => {
    expect(labelToMonth('Jun–Jul 2025')).toBe('2025-07')
  })
  it('returns null for unparseable labels', () => {
    expect(labelToMonth('Cycle 14')).toBeNull()
    expect(labelToMonth('Notamonth 2026')).toBeNull()
    expect(labelToMonth('2026')).toBeNull()
    expect(labelToMonth('')).toBeNull()
  })
})

describe('monthToLabel', () => {
  it('formats a month as "<Mon> <Year>"', () => {
    expect(monthToLabel('2026-11')).toBe('Nov 2026')
    expect(monthToLabel('2026-09')).toBe('Sep 2026')
    expect(monthToLabel('2027-01')).toBe('Jan 2027')
  })
  it('produces labels that parse back to the same month', () => {
    for (let m = 1; m <= 12; m++) {
      const month = `2026-${String(m).padStart(2, '0')}`
      expect(labelToMonth(monthToLabel(month))).toBe(month)
    }
  })
  it('throws on a malformed month', () => {
    expect(() => monthToLabel('2026-13')).toThrow()
    expect(() => monthToLabel('Nov 2026')).toThrow()
  })
})

describe('nextMonth', () => {
  it('steps to the following month', () => {
    expect(nextMonth('2026-10')).toBe('2026-11')
  })
  it('rolls over the year after December', () => {
    expect(nextMonth('2026-12')).toBe('2027-01')
  })
})

describe('defaultNewCycleMonth', () => {
  const today = '2026-11-24'
  it('is the month after the latest cycle', () => {
    expect(defaultNewCycleMonth('Oct 2026', today)).toBe('2026-11')
    expect(defaultNewCycleMonth('Sept 2026', today)).toBe('2026-10')
    expect(defaultNewCycleMonth('December 2026', today)).toBe('2027-01')
  })
  it('follows the last month of a range label', () => {
    expect(defaultNewCycleMonth('Jun–Jul 2025', today)).toBe('2025-08')
  })
  it('falls back to the current calendar month when the latest label cannot be parsed', () => {
    expect(defaultNewCycleMonth('Cycle 14', today)).toBe('2026-11')
  })
  it('falls back to the current calendar month when there are no cycles', () => {
    expect(defaultNewCycleMonth(undefined, today)).toBe('2026-11')
    expect(defaultNewCycleMonth(null, '2027-01-03')).toBe('2027-01')
  })
})

describe('cycleUsageDefaults', () => {
  it("gives the cycle's whole calendar month", () => {
    expect(cycleUsageDefaults('Nov 2026')).toEqual({ month: '2026-11', start: '2026-11-01', end: '2026-11-30' })
    expect(cycleUsageDefaults('Sept 2026')).toEqual({ month: '2026-09', start: '2026-09-01', end: '2026-09-30' })
  })
  it('is leap-year aware', () => {
    expect(cycleUsageDefaults('Feb 2028')).toEqual({ month: '2028-02', start: '2028-02-01', end: '2028-02-29' })
  })
  it('is null when the label has no month', () => {
    expect(cycleUsageDefaults('Cycle 14')).toBeNull()
  })
})

describe('daysLeftInMonth', () => {
  it('counts days remaining after today', () => {
    expect(daysLeftInMonth('2026-07', '2026-07-19')).toBe(12)
    expect(daysLeftInMonth('2026-07', '2026-07-31')).toBe(0)
  })
  it('returns null when today is outside the month', () => {
    expect(daysLeftInMonth('2026-07', '2026-08-02')).toBeNull()
  })
})
