import { describe, expect, it } from 'vitest'
import { shapeUtilityTrends } from '@/lib/trends'

const cycles = [
  { id: 10, cycleNumber: 1, label: 'May 2026' },
  { id: 12, cycleNumber: 3, label: 'July 2026' },
  { id: 11, cycleNumber: 2, label: 'June 2026' },
]

describe('shapeUtilityTrends', () => {
  it('orders cycles by cycleNumber ascending and aligns series', () => {
    const out = shapeUtilityTrends(cycles, [
      { cycleId: 10, utilityName: 'Water', amountCents: 5000, status: 'confirmed' },
      { cycleId: 12, utilityName: 'Water', amountCents: 7000, status: 'confirmed' },
    ])
    expect(out.cycles.map(c => c.cycleNumber)).toEqual([1, 2, 3])
    expect(out.series.Water).toEqual([5000, 0, 7000])
    expect(out.series.All).toEqual([5000, 0, 7000])
  })

  it('sums multiple bills per utility per cycle and ignores drafts', () => {
    const out = shapeUtilityTrends(cycles, [
      { cycleId: 11, utilityName: 'Gas', amountCents: 1000, status: 'confirmed' },
      { cycleId: 11, utilityName: 'Gas', amountCents: 250, status: 'confirmed' },
      { cycleId: 11, utilityName: 'Gas', amountCents: 9999, status: 'draft' },
      { cycleId: 11, utilityName: 'Water', amountCents: 4000, status: 'confirmed' },
    ])
    expect(out.series.Gas).toEqual([0, 1250, 0])
    expect(out.series.All).toEqual([0, 5250, 0])
  })

  it('keeps only the last `limit` cycles', () => {
    const out = shapeUtilityTrends(
      cycles,
      [{ cycleId: 10, utilityName: 'Water', amountCents: 5000, status: 'confirmed' }],
      2,
    )
    expect(out.cycles.map(c => c.cycleNumber)).toEqual([2, 3])
    expect(out.series.All).toEqual([0, 0])
    expect(out.series.Water).toBeUndefined()
  })
})
