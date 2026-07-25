import { expect, test } from 'vitest'
import { allocate, computeCycleSplits, type EngineBill } from '@/lib/split/engine'

const H = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] // four housemates
const UTIL = { GAS: 1, ELEC: 2, WATER: 3, GARB: 4, NET: 5, CHG_A: 6, CHG_B: 7 }
let nextId = 1
const bill = (over: Partial<EngineBill>): EngineBill => ({
  id: nextId++, utilityId: 0, amountCents: 0, usageStart: null, usageEnd: null,
  splitMethod: 'even', ownerId: null, deductFromUtilityId: null, ...over,
})

// Reference fixture: a real cycle, even split variant.
// Gas 43.49 + Elec 301.84 + Garb 97.24 + Water 148.06 + Net 65.30 = 655.93 total.
// Elec includes charging A 63.00 + charging B 7.00 → shared pool 585.93 → 146.4825/person.
test('cycle 13 even: charging carved out of electricity, dues sum to total', () => {
  const bills = [
    bill({ utilityId: UTIL.GAS, amountCents: 4349 }),
    bill({ utilityId: UTIL.ELEC, amountCents: 30184 }),
    bill({ utilityId: UTIL.GARB, amountCents: 9724 }),
    bill({ utilityId: UTIL.WATER, amountCents: 14806 }),
    bill({ utilityId: UTIL.NET, amountCents: 6530 }),
    bill({ utilityId: UTIL.CHG_A, amountCents: 6300, ownerId: 4, deductFromUtilityId: UTIL.ELEC }),
    bill({ utilityId: UTIL.CHG_B, amountCents: 700, ownerId: 1, deductFromUtilityId: UTIL.ELEC }),
  ]
  const { dues } = computeCycleSplits(bills, H, [])
  const by = Object.fromEntries(dues.map(d => [d.housemateId, d.amountDueCents]))
  const total = dues.reduce((a, d) => a + d.amountDueCents, 0)
  expect(total).toBe(65593) // exact — the old spreadsheet showed 655.92 due to display rounding
  expect(by[4]).toBeGreaterThanOrEqual(14648 + 6300) // housemate 4 ≈ $209.48
  expect(by[4]).toBeLessThanOrEqual(14649 + 6300)
  expect(by[1]).toBeGreaterThanOrEqual(14648 + 700)  // housemate 1 ≈ $153.48
  expect(by[1]).toBeLessThanOrEqual(14649 + 700)
  expect(Math.abs(by[2] - 14648)).toBeLessThanOrEqual(1) // housemate 2 ≈ $146.48
})

test('deduction applies to the largest bill of the target utility', () => {
  const bills = [
    bill({ utilityId: UTIL.ELEC, amountCents: 1028 }),   // cycle-1 style: two electricity bills
    bill({ utilityId: UTIL.ELEC, amountCents: 33680 }),
    bill({ utilityId: UTIL.CHG_A, amountCents: 6000, ownerId: 4, deductFromUtilityId: UTIL.ELEC }),
  ]
  const { splits } = computeCycleSplits(bills, H, [])
  const bigBillSplit = splits.filter(s => s.billId === bills[1].id)
  expect(bigBillSplit.reduce((a, s) => a + s.amountCents, 0)).toBe(33680 - 6000)
})

test('no charging bills → electricity splits untouched', () => {
  const bills = [bill({ utilityId: UTIL.ELEC, amountCents: 10000 })]
  const { dues } = computeCycleSplits(bills, H, [])
  expect(dues.map(d => d.amountDueCents)).toEqual([2500, 2500, 2500, 2500])
})

test('person-day bills inside a cycle use absences', () => {
  const bills = [
    bill({ utilityId: UTIL.GAS, amountCents: 1519, splitMethod: 'person_day', usageStart: '2025-08-05', usageEnd: '2025-09-04' }),
    bill({ utilityId: UTIL.NET, amountCents: 6530 }),
  ]
  const { dues } = computeCycleSplits(bills, H, [
    { housemateId: 3, startDate: '2025-08-05', endDate: '2025-08-25' },
  ])
  expect(dues.reduce((a, d) => a + d.amountDueCents, 0)).toBe(1519 + 6530)
})

// Invariant: a group of non-owner bills sharing the same weight vector must produce
// per-housemate dues identical to a single allocate() call over their combined sum —
// pooled rounding, not per-bill rounding, decides who gets the remainder cents.
test('pooling invariant: several odd-cent even bills sum to allocate(groupSum, weights)', () => {
  const amounts = [101, 103, 107, 6530]
  const bills = amounts.map(amountCents => bill({ utilityId: UTIL.GAS, amountCents }))
  const { dues } = computeCycleSplits(bills, H, [])
  const groupSum = amounts.reduce((a, c) => a + c, 0)
  const expected = allocate(groupSum, [1, 1, 1, 1])
  expect(dues.map(d => d.amountDueCents)).toEqual(expected)
})
