import { describe, expect, it } from 'vitest'
import { cycleTotalCents, isPersonalUtility, type CycleTotalRow } from '@/lib/cycle-total'
import { computeCycleSplits, type EngineBill } from '@/lib/split/engine'

const row = (amountCents: number, ownerId: number | null = null, status = 'confirmed'): CycleTotalRow => ({
  bill: { amountCents, status },
  utility: { ownerId },
})

describe('isPersonalUtility', () => {
  it('is true only when the utility has an owner', () => {
    expect(isPersonalUtility({ ownerId: 4 })).toBe(true)
    expect(isPersonalUtility({ ownerId: null })).toBe(false)
  })
})

describe('cycleTotalCents', () => {
  it('sums every confirmed bill when there are no charging bills', () => {
    expect(cycleTotalCents([row(4349), row(30184), row(9724)])).toBe(44257)
  })

  it('leaves personal charging bills out of the total', () => {
    const shared = [row(4349), row(30184), row(9724), row(14806), row(6530)]
    const charging = [row(6300, 4), row(700, 1)]
    expect(cycleTotalCents([...shared, ...charging])).toBe(65593)
    expect(cycleTotalCents([...shared, ...charging])).toBe(cycleTotalCents(shared))
  })

  it('ignores draft bills', () => {
    expect(cycleTotalCents([row(5000), row(9999, null, 'draft')])).toBe(5000)
  })

  it('is zero for a cycle holding only charging bills, or no bills', () => {
    expect(cycleTotalCents([row(6300, 4), row(700, 1)])).toBe(0)
    expect(cycleTotalCents([])).toBe(0)
  })

  // Charging is carved out of the electricity bill before it is split, so what
  // the housemates owe between them already equals the total without charging.
  it('matches the sum of dues when charging is deducted from electricity', () => {
    const ELEC = 2
    const bills: (EngineBill & { status: string })[] = [
      { id: 1, utilityId: 1, amountCents: 4349, ownerId: null, deductFromUtilityId: null },
      { id: 2, utilityId: ELEC, amountCents: 30184, ownerId: null, deductFromUtilityId: null },
      { id: 3, utilityId: 6, amountCents: 6300, ownerId: 4, deductFromUtilityId: ELEC },
      { id: 4, utilityId: 7, amountCents: 700, ownerId: 1, deductFromUtilityId: ELEC },
    ].map(b => ({ ...b, usageStart: null, usageEnd: null, splitMethod: 'even' as const, status: 'confirmed' }))

    const { dues } = computeCycleSplits(bills, [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }], [])
    const duesSum = dues.reduce((a, d) => a + d.amountDueCents, 0)
    const total = cycleTotalCents(bills.map(b => ({ bill: b, utility: b })))

    expect(total).toBe(4349 + 30184)
    expect(duesSum).toBe(total)
  })
})
