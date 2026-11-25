export type LastAmount = { amountCents: number; cycleLabel: string }

/**
 * For each utility, what it came to in the most recent earlier cycle that has a bill for it.
 * Utilities are not all monthly (water is every other month, garbage less often), so this
 * walks back to whichever cycle last billed the utility rather than just the previous one.
 * The current cycle is left out: it is the one the new bill is being added to. Several
 * bills for one utility in that cycle are added together. Keyed by utility id.
 */
export function lastAmountsByUtility(
  bills: { utilityId: number; cycleId: number; amountCents: number }[],
  cycles: { id: number; cycleNumber: number; label: string }[],
  currentCycleId: number,
): Record<number, LastAmount> {
  const cycleById = new Map(cycles.map(c => [c.id, c]))
  const latest = new Map<number, { cycleNumber: number; amountCents: number; cycleLabel: string }>()
  for (const bill of bills) {
    if (bill.cycleId === currentCycleId) continue
    const cycle = cycleById.get(bill.cycleId)
    if (!cycle) continue
    const seen = latest.get(bill.utilityId)
    if (!seen || cycle.cycleNumber > seen.cycleNumber) {
      latest.set(bill.utilityId, {
        cycleNumber: cycle.cycleNumber, amountCents: bill.amountCents, cycleLabel: cycle.label,
      })
    } else if (cycle.cycleNumber === seen.cycleNumber) {
      seen.amountCents += bill.amountCents
    }
  }
  const out: Record<number, LastAmount> = {}
  for (const [utilityId, { amountCents, cycleLabel }] of latest) out[utilityId] = { amountCents, cycleLabel }
  return out
}
