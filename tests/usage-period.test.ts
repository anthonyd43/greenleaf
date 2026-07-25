import { expect, test } from 'vitest'
import { deriveUsagePeriod, monthToRange, rangeIsCalendarMonth } from '@/lib/usage-period'

test('monthToRange handles month lengths and leap years', () => {
  expect(monthToRange('2026-06')).toEqual({ start: '2026-06-01', end: '2026-06-30' })
  expect(monthToRange('2026-07')).toEqual({ start: '2026-07-01', end: '2026-07-31' })
  expect(monthToRange('2024-02')).toEqual({ start: '2024-02-01', end: '2024-02-29' })
  expect(monthToRange('2026-02')).toEqual({ start: '2026-02-01', end: '2026-02-28' })
  expect(() => monthToRange('2026-13')).toThrow()
  expect(() => monthToRange('junk')).toThrow()
})

test('rangeIsCalendarMonth round-trips monthToRange', () => {
  expect(rangeIsCalendarMonth('2026-06-01', '2026-06-30')).toBe('2026-06')
  expect(rangeIsCalendarMonth('2026-06-01', '2026-06-29')).toBeNull()
  expect(rangeIsCalendarMonth('2026-06-02', '2026-06-30')).toBeNull()
})

// real-world formats seen in spreadsheet exports
test('derives full month names and abbreviations using the cycle label year', () => {
  expect(deriveUsagePeriod('June', 'Jun 2026')).toEqual({ start: '2026-06-01', end: '2026-06-30' })
  expect(deriveUsagePeriod('Jan', 'Jan 2026')).toEqual({ start: '2026-01-01', end: '2026-01-31' })
  expect(deriveUsagePeriod('Sept', 'Sep 2025')).toEqual({ start: '2025-09-01', end: '2025-09-30' })
  expect(deriveUsagePeriod('March', 'Mar 2026')).toEqual({ start: '2026-03-01', end: '2026-03-31' })
})

test('usage month earlier than cycle label month stays in the same year; later wraps back a year', () => {
  // cycle labeled Jan 2026 billing December usage → December 2025
  expect(deriveUsagePeriod('December', 'Jan 2026')).toEqual({ start: '2025-12-01', end: '2025-12-31' })
  expect(deriveUsagePeriod('Dec', 'Dec 2025')).toEqual({ start: '2025-12-01', end: '2025-12-31' })
})

test('derives MM/DD - MM/DD ranges with cycle-label year and cross-year wrap', () => {
  expect(deriveUsagePeriod('06/13 - 07/07', 'Jun–Jul 2025')).toEqual({ start: '2025-06-13', end: '2025-07-07' })
  expect(deriveUsagePeriod('12/20 - 01/05', 'Jan 2026')).toEqual({ start: '2025-12-20', end: '2026-01-05' })
})

test('derives MM/DD/YY ranges with explicit years', () => {
  expect(deriveUsagePeriod('07/22/25 - 09/23/25', 'Sep 2025')).toEqual({ start: '2025-07-22', end: '2025-09-23' })
  expect(deriveUsagePeriod('11/18/25 - 01/28/26', 'Jan 2026')).toEqual({ start: '2025-11-18', end: '2026-01-28' })
})

test('unparseable or multi-month texts return null', () => {
  expect(deriveUsagePeriod('June & July', 'Jul 2025')).toBeNull()
  expect(deriveUsagePeriod('Sept - Nov', 'Sep 2025')).toBeNull()
  expect(deriveUsagePeriod('Due in April', 'Jan 2026')).toBeNull()
  expect(deriveUsagePeriod(null, 'Jun 2026')).toBeNull()
  expect(deriveUsagePeriod('', 'Jun 2026')).toBeNull()
  expect(deriveUsagePeriod('June', 'Cycle 3')).toBeNull() // no year in label
})

test('bare MM/DD - MM/DD range returns null when the label month matches neither side', () => {
  // label's month (May) has no real connection to a Dec-Feb range — reject
  // rather than confidently return a wrong year.
  expect(deriveUsagePeriod('12/01 - 02/28', 'May 2026')).toBeNull()
})

test('bare MM/DD - MM/DD range returns null for a calendar-impossible day', () => {
  // Feb 30 doesn't exist, even though the label month (Mar) matches the end side.
  expect(deriveUsagePeriod('02/30 - 03/05', 'Mar 2026')).toBeNull()
})
