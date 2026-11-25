import { describe, expect, it } from 'vitest'
import { lastAmountsByUtility } from '@/lib/last-bill'

const cycles = [
  { id: 10, cycleNumber: 1, label: 'Jul 2026' },
  { id: 11, cycleNumber: 2, label: 'Aug 2026' },
  { id: 12, cycleNumber: 3, label: 'Sept 2026' },
  { id: 13, cycleNumber: 4, label: 'Oct 2026' },
]
const GAS = 1, WATER = 2, GARBAGE = 3, INTERNET = 4
const bill = (utilityId: number, cycleId: number, amountCents: number) => ({ utilityId, cycleId, amountCents })

describe('lastAmountsByUtility', () => {
  it('gives the amount from the cycle just before the current one for a monthly utility', () => {
    const bills = [bill(GAS, 11, 3100), bill(GAS, 12, 3986)]
    expect(lastAmountsByUtility(bills, cycles, 13)[GAS]).toEqual({ amountCents: 3986, cycleLabel: 'Sept 2026' })
  })

  it('reaches back past cycles the utility skipped', () => {
    // Water is billed every other month, garbage less often still.
    const bills = [bill(WATER, 11, 9050), bill(GARBAGE, 10, 14806), bill(GAS, 12, 3986)]
    const last = lastAmountsByUtility(bills, cycles, 13)
    expect(last[WATER]).toEqual({ amountCents: 9050, cycleLabel: 'Aug 2026' })
    expect(last[GARBAGE]).toEqual({ amountCents: 14806, cycleLabel: 'Jul 2026' })
  })

  it('leaves out the cycle the new bill is going into', () => {
    const bills = [bill(GAS, 12, 3986), bill(GAS, 13, 4500)]
    expect(lastAmountsByUtility(bills, cycles, 13)[GAS]).toEqual({ amountCents: 3986, cycleLabel: 'Sept 2026' })
  })

  it('has no entry for a utility that was never billed before', () => {
    const last = lastAmountsByUtility([bill(GAS, 12, 3986), bill(INTERNET, 13, 6530)], cycles, 13)
    expect(last[INTERNET]).toBeUndefined()
    expect(last[WATER]).toBeUndefined()
  })

  it('adds up several bills for the same utility in that cycle', () => {
    const bills = [bill(GAS, 12, 3000), bill(GAS, 12, 986), bill(GAS, 11, 9999)]
    expect(lastAmountsByUtility(bills, cycles, 13)[GAS]).toEqual({ amountCents: 3986, cycleLabel: 'Sept 2026' })
  })

  it('orders cycles by cycle number, not by id or list order', () => {
    const shuffled = [
      { id: 5, cycleNumber: 3, label: 'Sept 2026' },
      { id: 99, cycleNumber: 4, label: 'Oct 2026' },
      { id: 50, cycleNumber: 2, label: 'Aug 2026' },
    ]
    const bills = [bill(GAS, 50, 1111), bill(GAS, 5, 2222)]
    expect(lastAmountsByUtility(bills, shuffled, 99)[GAS]).toEqual({ amountCents: 2222, cycleLabel: 'Sept 2026' })
  })

  it('ignores bills whose cycle is unknown', () => {
    expect(lastAmountsByUtility([bill(GAS, 777, 1234)], cycles, 13)).toEqual({})
  })
})
