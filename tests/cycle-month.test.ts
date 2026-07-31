import { describe, expect, it } from 'vitest'
import { daysLeftInMonth, labelToMonth } from '@/lib/cycle-month'

describe('labelToMonth', () => {
  it('parses "July 2026" style labels', () => {
    expect(labelToMonth('July 2026')).toBe('2026-07')
    expect(labelToMonth('january 2025')).toBe('2025-01')
  })
  it('returns null for unparseable labels', () => {
    expect(labelToMonth('Cycle 14')).toBeNull()
    expect(labelToMonth('Notamonth 2026')).toBeNull()
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
