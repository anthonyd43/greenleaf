import { expect, test } from 'vitest'
import { computeBillSplit, inclusiveDays, type EngineBill } from '@/lib/split/engine'

const H = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]
const bill = (over: Partial<EngineBill>): EngineBill => ({
  id: 1, utilityId: 1, amountCents: 0, usageStart: null, usageEnd: null,
  splitMethod: 'even', ownerId: null, deductFromUtilityId: null, ...over,
})

test('inclusiveDays counts both endpoints', () => {
  expect(inclusiveDays('2025-08-12', '2025-09-08')).toBe(28)
  expect(inclusiveDays('2025-09-01', '2025-09-01')).toBe(1)
})

test('even split, no absences', () => {
  const s = computeBillSplit(bill({ amountCents: 6530 }), H, [])
  expect(s.map(x => x.amountCents)).toEqual([1633, 1633, 1632, 1632])
  expect(s.map(x => x.daysPresent)).toEqual([null, null, null, null])
})

test('owner bill goes entirely to owner', () => {
  const s = computeBillSplit(bill({ amountCents: 6300, ownerId: 4 }), H, [])
  expect(s.map(x => x.amountCents)).toEqual([0, 0, 0, 6300])
})

// Reference fixture: electricity $295.22, usage 08/12–09/08 (28 days),
// housemates 1&2 away 6 days → person-days 22/22/28/28 → $64.95/$64.95/$82.66/$82.66
test('person-day proration matches reference vacation electricity', () => {
  const s = computeBillSplit(
    bill({ amountCents: 29522, splitMethod: 'person_day', usageStart: '2025-08-12', usageEnd: '2025-09-08' }),
    H,
    [
      { housemateId: 1, startDate: '2025-08-15', endDate: '2025-08-20' },
      { housemateId: 2, startDate: '2025-08-15', endDate: '2025-08-20' },
    ],
  )
  expect(s.map(x => x.daysPresent)).toEqual([22, 22, 28, 28])
  expect(s.map(x => x.amountCents)).toEqual([6495, 6495, 8266, 8266])
})

// Reference fixture: gas $15.19, 31-day period, days 10/16/31/31 → $1.73/$2.76/$5.35/$5.35
test('person-day proration matches reference vacation gas', () => {
  const s = computeBillSplit(
    bill({ amountCents: 1519, splitMethod: 'person_day', usageStart: '2025-08-05', usageEnd: '2025-09-04' }),
    H,
    [
      { housemateId: 1, startDate: '2025-08-05', endDate: '2025-08-25' },
      { housemateId: 2, startDate: '2025-08-05', endDate: '2025-08-19' },
    ],
  )
  expect(s.map(x => x.daysPresent)).toEqual([10, 16, 31, 31])
  expect(s.map(x => x.amountCents)).toEqual([173, 276, 535, 535])
})

test('person-day with nobody absent falls back to even', () => {
  const s = computeBillSplit(
    bill({ amountCents: 10000, splitMethod: 'person_day', usageStart: '2026-06-01', usageEnd: '2026-06-30' }),
    H, [],
  )
  expect(s.map(x => x.amountCents)).toEqual([2500, 2500, 2500, 2500])
})

test('overlapping absences do not double-count', () => {
  const s = computeBillSplit(
    bill({ amountCents: 3000, splitMethod: 'person_day', usageStart: '2026-06-01', usageEnd: '2026-06-30' }),
    H,
    [
      { housemateId: 1, startDate: '2026-06-01', endDate: '2026-06-10' },
      { housemateId: 1, startDate: '2026-06-05', endDate: '2026-06-15' }, // overlaps → 15 days away total
    ],
  )
  expect(s[0].daysPresent).toBe(15)
})

test('absence clipped to usage period', () => {
  const s = computeBillSplit(
    bill({ amountCents: 3000, splitMethod: 'person_day', usageStart: '2026-06-01', usageEnd: '2026-06-30' }),
    H,
    [{ housemateId: 2, startDate: '2026-05-20', endDate: '2026-06-05' }], // only 5 days inside
  )
  expect(s[1].daysPresent).toBe(25)
})
