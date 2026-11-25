import { addMonths, labelToMonth, monthsBetween } from '@/lib/cycle-month'
import { monthToRange } from '@/lib/usage-period'

/** Longest interval a fixed bill can be set to. */
export const MAX_INTERVAL_MONTHS = 12

/** Note put on a bill that was added automatically, so it can be told apart from typed-in ones. */
export const FIXED_BILL_NOTE = 'Fixed amount — added automatically'

export type FixedBillDue = { utilityId: number; amountCents: number; usageStart: string; usageEnd: string }

/**
 * The fixed-amount bills to add to a cycle that is being started.
 *
 * A utility with a fixed amount is due when its interval has passed since the last
 * cycle it was billed in (any bill counts, typed-in ones too), or when it has never
 * been billed. The gap is counted in calendar months from the cycle labels; if the
 * last billed cycle's label has no month in it, it is counted in cycles instead.
 *
 * The bill's usage period is the whole interval ending with the new cycle's month,
 * e.g. a 2-month bill in a Nov 2026 cycle covers Oct 1 – Nov 30.
 */
export function fixedBillsDue(
  utilities: { id: number; fixedAmountCents: number | null; intervalMonths: number }[],
  bills: { utilityId: number; cycleId: number }[],
  /** Cycles that already exist, not including the one being started. */
  cycles: { id: number; cycleNumber: number; label: string }[],
  newCycle: { cycleNumber: number; month: string },
): FixedBillDue[] {
  const cycleById = new Map(cycles.map(c => [c.id, c]))
  const due: FixedBillDue[] = []
  for (const u of utilities) {
    if (u.fixedAmountCents == null || u.fixedAmountCents <= 0) continue
    const interval = Math.max(1, u.intervalMonths)

    let last: { cycleNumber: number; label: string } | undefined
    for (const bill of bills) {
      if (bill.utilityId !== u.id) continue
      const cycle = cycleById.get(bill.cycleId)
      if (cycle && (!last || cycle.cycleNumber > last.cycleNumber)) last = cycle
    }
    if (last) {
      const lastMonth = labelToMonth(last.label)
      const gap = lastMonth
        ? monthsBetween(lastMonth, newCycle.month)
        : newCycle.cycleNumber - last.cycleNumber
      if (gap < interval) continue
    }

    const start = monthToRange(addMonths(newCycle.month, -(interval - 1))).start
    const end = monthToRange(newCycle.month).end
    due.push({ utilityId: u.id, amountCents: u.fixedAmountCents, usageStart: start, usageEnd: end })
  }
  return due
}
