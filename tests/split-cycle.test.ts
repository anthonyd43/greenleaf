import { expect, test } from 'vitest'
import { computeCycleSplits, type EngineBill } from '@/lib/split/engine'

const H = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] // four housemates
const UTIL = { GAS: 1, ELEC: 2, WATER: 3, GARB: 4, NET: 5, CHG_A: 6, CHG_B: 7 }
let nextId = 1
const bill = (over: Partial<EngineBill>): EngineBill => ({
  id: nextId++, utilityId: 0, amountCents: 0, usageStart: null, usageEnd: null,
  splitMethod: 'even', ownerId: null, deductFromUtilityId: null, ...over,
})

// Reference fixture: a real cycle, even split variant.
// Gas 43.49 + Elec 301.84 + Garb 97.24 + Water 148.06 + Net 65.30 = 655.93 total.
// Elec includes charging A 63.00 + charging B 7.00 → 231.84 of electricity is shared.
// Per person: gas 10.88 (10.8725) + elec 57.96 + garb 24.31 + water 37.02 (37.015)
// + net 16.33 (16.325) = 146.50.
test('cycle 13 even: charging carved out of electricity, everyone owes the same shared amount', () => {
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
  expect(by[2]).toBe(14650)
  expect(by[3]).toBe(14650)
  expect(by[4]).toBe(14650 + 6300) // shared amount plus their own charging
  expect(by[1]).toBe(14650 + 700)
  // Gas, water and internet do not divide by four; rounding up collects 3 + 2 + 2 cents extra.
  const total = dues.reduce((a, d) => a + d.amountDueCents, 0)
  expect(total - 65593).toBe(7)
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
  // Housemate 3 was away for part of the gas period; the other three owe the same.
  expect(dues[0].amountDueCents).toBe(dues[1].amountDueCents)
  expect(dues[0].amountDueCents).toBe(dues[3].amountDueCents)
  expect(dues[2].amountDueCents).toBeLessThan(dues[0].amountDueCents)
  // Never under-collects; over by less than a cent per person per bill.
  const over = dues.reduce((a, d) => a + d.amountDueCents, 0) - (1519 + 6530)
  expect(over).toBeGreaterThanOrEqual(0)
  expect(over).toBeLessThan(2 * H.length)
})

// The October 2026 case that prompted rounding up: three shared bills that each
// leave 2 odd cents. Handing those cents to only some housemates left two of them
// a cent above the other two for the same share.
test('several odd-cent even bills: every housemate owes the same on each bill and in total', () => {
  const amounts = [26218, 6530, 3986]
  const bills = amounts.map(amountCents => bill({ utilityId: UTIL.GAS, amountCents }))
  const { splits, dues } = computeCycleSplits(bills, H, [])
  for (const b of bills) {
    const parts = splits.filter(s => s.billId === b.id).map(s => s.amountCents)
    expect(new Set(parts).size).toBe(1)
  }
  expect(dues.map(d => d.amountDueCents)).toEqual([9185, 9185, 9185, 9185]) // 65.55 + 16.33 + 9.97
})
