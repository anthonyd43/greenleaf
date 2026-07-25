import { expect, test } from 'vitest'
import { listMonthDays, reconcileMonth, type AbsRange } from '@/lib/absence-month'

const r = (id: number, startDate: string, endDate: string, note: string | null = null): AbsRange => ({
  id,
  startDate,
  endDate,
  note,
})

test('listMonthDays clips ranges to the month', () => {
  expect(listMonthDays([r(1, '2026-05-30', '2026-06-02')], '2026-06')).toEqual(['2026-06-01', '2026-06-02'])
  expect(listMonthDays([r(1, '2026-06-06', '2026-06-07')], '2026-06')).toEqual(['2026-06-06', '2026-06-07'])
  expect(listMonthDays([r(1, '2026-05-01', '2026-05-31')], '2026-06')).toEqual([])
})

test('adding weekend days creates merged runs', () => {
  const out = reconcileMonth([], '2026-06', ['2026-06-06', '2026-06-07', '2026-06-13', '2026-06-14'])
  expect(out.deleteIds).toEqual([])
  expect(out.create).toEqual([
    { startDate: '2026-06-06', endDate: '2026-06-07', note: null },
    { startDate: '2026-06-13', endDate: '2026-06-14', note: null },
  ])
})

test('removing a mid-range day splits the range', () => {
  const out = reconcileMonth([r(5, '2026-06-10', '2026-06-12')], '2026-06', ['2026-06-10', '2026-06-12'])
  expect(out.deleteIds).toEqual([5])
  expect(out.create).toEqual([
    { startDate: '2026-06-10', endDate: '2026-06-10', note: null },
    { startDate: '2026-06-12', endDate: '2026-06-12', note: null },
  ])
})

test('month-boundary-crossing range keeps its out-of-month fragments', () => {
  const out = reconcileMonth([r(9, '2026-05-28', '2026-06-03')], '2026-06', [])
  expect(out.deleteIds).toEqual([9])
  expect(out.create).toEqual([{ startDate: '2026-05-28', endDate: '2026-05-31', note: null }])
})

test('untouched month is a no-op', () => {
  const existing = [r(1, '2026-06-06', '2026-06-07')]
  const out = reconcileMonth(existing, '2026-06', ['2026-06-06', '2026-06-07'])
  // deleting and recreating the identical run is acceptable; assert net effect
  expect(out.create).toEqual([{ startDate: '2026-06-06', endDate: '2026-06-07', note: null }])
})

test('days outside the month are ignored; ranges not touching the month are untouched', () => {
  const out = reconcileMonth([r(2, '2026-07-01', '2026-07-04')], '2026-06', ['2026-07-01', '2026-06-20'])
  expect(out.deleteIds).toEqual([])
  expect(out.create).toEqual([{ startDate: '2026-06-20', endDate: '2026-06-20', note: null }])
})

test('an out-of-month fragment inherits its source range note', () => {
  const out = reconcileMonth([r(9, '2026-05-28', '2026-06-03', 'holiday')], '2026-06', [])
  expect(out.deleteIds).toEqual([9])
  expect(out.create).toEqual([{ startDate: '2026-05-28', endDate: '2026-05-31', note: 'holiday' }])
})

test('a re-created run overlapping a deleted noted range inherits that note; an unrelated new run gets null', () => {
  const existing = [r(5, '2026-06-10', '2026-06-12', 'Bali')]
  // Middle day (11) removed, splitting the noted range into two runs that still overlap it by day.
  // Day 20 is a brand-new, unrelated run in the same save.
  const out = reconcileMonth(existing, '2026-06', ['2026-06-10', '2026-06-12', '2026-06-20'])
  expect(out.deleteIds).toEqual([5])
  expect(out.create).toEqual([
    { startDate: '2026-06-10', endDate: '2026-06-10', note: 'Bali' },
    { startDate: '2026-06-12', endDate: '2026-06-12', note: 'Bali' },
    { startDate: '2026-06-20', endDate: '2026-06-20', note: null },
  ])
})
