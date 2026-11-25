import { describe, expect, it } from 'vitest'
import { fixedBillsDue } from '@/lib/fixed-bills'

const INTERNET = 1, WATER = 2, GARBAGE = 3, GAS = 4
const cycles = [
  { id: 10, cycleNumber: 1, label: 'Aug 2026' },
  { id: 11, cycleNumber: 2, label: 'Sept 2026' },
  { id: 12, cycleNumber: 3, label: 'Oct 2026' },
]
const nov = { cycleNumber: 4, month: '2026-11' }
const util = (id: number, fixedAmountCents: number | null, intervalMonths = 1) => ({ id, fixedAmountCents, intervalMonths })
const bill = (utilityId: number, cycleId: number) => ({ utilityId, cycleId })

describe('fixedBillsDue', () => {
  it('adds a monthly fixed bill to every new cycle, for the cycle month', () => {
    const due = fixedBillsDue([util(INTERNET, 6530)], [bill(INTERNET, 12)], cycles, nov)
    expect(due).toEqual([{ utilityId: INTERNET, amountCents: 6530, usageStart: '2026-11-01', usageEnd: '2026-11-30' }])
  })

  it('leaves out utilities without a fixed amount', () => {
    expect(fixedBillsDue([util(GAS, null), util(WATER, 0, 2)], [], cycles, nov)).toEqual([])
  })

  it('waits out the interval for a bill that is not monthly', () => {
    const everyTwo = [util(WATER, 16896, 2)]
    // billed in Oct → not due in Nov, due in Dec
    expect(fixedBillsDue(everyTwo, [bill(WATER, 12)], cycles, nov)).toEqual([])
    expect(fixedBillsDue(everyTwo, [bill(WATER, 12)], cycles, { cycleNumber: 5, month: '2026-12' })).toHaveLength(1)
    // billed in Sept → due in Nov
    expect(fixedBillsDue(everyTwo, [bill(WATER, 11)], cycles, nov)).toHaveLength(1)
  })

  it('covers the whole interval in the usage period', () => {
    const [two] = fixedBillsDue([util(WATER, 16896, 2)], [bill(WATER, 11)], cycles, nov)
    expect([two.usageStart, two.usageEnd]).toEqual(['2026-10-01', '2026-11-30'])
    const [three] = fixedBillsDue([util(GARBAGE, 9724, 3)], [bill(GARBAGE, 10)], cycles, { cycleNumber: 9, month: '2027-01' })
    expect([three.usageStart, three.usageEnd]).toEqual(['2026-11-01', '2027-01-31'])
  })

  it('counts from the most recent bill, whichever cycle it is in', () => {
    const garbage = [util(GARBAGE, 9724, 3)]
    expect(fixedBillsDue(garbage, [bill(GARBAGE, 10), bill(GARBAGE, 12)], cycles, nov)).toEqual([])
    expect(fixedBillsDue(garbage, [bill(GARBAGE, 10)], cycles, nov)).toHaveLength(1) // Aug → Nov
  })

  it('adds a bill for a fixed utility that has never been billed', () => {
    expect(fixedBillsDue([util(INTERNET, 6530, 3)], [], cycles, nov)).toHaveLength(1)
  })

  it('counts calendar months, so a skipped month still counts', () => {
    // Billed in Oct, no Nov cycle, next cycle is Dec: two months have passed.
    const due = fixedBillsDue([util(WATER, 16896, 2)], [bill(WATER, 12)], cycles, { cycleNumber: 4, month: '2026-12' })
    expect(due).toHaveLength(1)
  })

  it('does not add a second bill when a cycle for the same month is started again', () => {
    expect(fixedBillsDue([util(INTERNET, 6530)], [bill(INTERNET, 12)], cycles, { cycleNumber: 4, month: '2026-10' })).toEqual([])
  })

  it('counts in cycles when the last billed cycle has no month in its label', () => {
    const odd = [...cycles, { id: 13, cycleNumber: 4, label: 'Catch-up' }]
    const water = [util(WATER, 16896, 2)]
    expect(fixedBillsDue(water, [bill(WATER, 13)], odd, { cycleNumber: 5, month: '2026-12' })).toEqual([])
    expect(fixedBillsDue(water, [bill(WATER, 13)], odd, { cycleNumber: 6, month: '2027-01' })).toHaveLength(1)
  })

  it('treats a nonsense interval as monthly', () => {
    expect(fixedBillsDue([util(INTERNET, 6530, 0)], [bill(INTERNET, 12)], cycles, nov)).toHaveLength(1)
  })
})
