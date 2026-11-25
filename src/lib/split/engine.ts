/**
 * Splits amountCents by weights, rounding every share up to a whole cent.
 * Equal weights always get equal shares: when the amount does not divide, everyone
 * pays the extra cent rather than some housemates owing a cent more than others
 * for the same share. The shares can therefore add up to slightly more than the
 * amount, by less than one cent per person.
 */
export function allocate(amountCents: number, weights: number[]): number[] {
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  if (totalWeight === 0) return weights.map(() => 0)
  return weights.map(w => {
    // Integer maths, so a share that divides exactly is never nudged up by float error.
    const scaled = amountCents * w
    const whole = Math.floor(scaled / totalWeight)
    return scaled % totalWeight === 0 ? whole : whole + 1
  })
}

export type EngineHousemate = { id: number }
export type EngineAbsence = { housemateId: number; startDate: string; endDate: string }
export type EngineBill = {
  id: number; utilityId: number; amountCents: number
  usageStart: string | null; usageEnd: string | null
  splitMethod: 'even' | 'person_day'
  ownerId: number | null; deductFromUtilityId: number | null
}
export type BillSplit = { billId: number; housemateId: number; daysPresent: number | null; amountCents: number }

const DAY = 86_400_000
const toUtc = (d: string) => Date.parse(`${d}T00:00:00Z`)

export function inclusiveDays(start: string, end: string): number {
  return Math.round((toUtc(end) - toUtc(start)) / DAY) + 1
}

/** Days housemate was home during the usage period; overlapping absences merged, clipped to period. */
function presentDays(hid: number, start: string, end: string, absences: EngineAbsence[]): number {
  const total = inclusiveDays(start, end)
  const ranges = absences
    .filter(a => a.housemateId === hid)
    .map(a => [Math.max(toUtc(a.startDate), toUtc(start)), Math.min(toUtc(a.endDate), toUtc(end))] as [number, number])
    .filter(([s, e]) => e >= s)
    .sort((a, b) => a[0] - b[0])
  let away = 0
  let cursor = -Infinity
  for (const [s, e] of ranges) {
    const from = Math.max(s, cursor)
    if (e >= from) {
      away += Math.round((e - from) / DAY) + 1
      cursor = e + DAY
    }
  }
  return Math.max(0, total - away)
}

/**
 * The person-day-vs-even weight decision: the weight vector a non-owner bill
 * splits by, plus the daysPresent to report per person.
 */
function billWeights(
  bill: EngineBill, housemates: EngineHousemate[], absences: EngineAbsence[],
): { weights: number[]; daysPresent: (number | null)[] } {
  if (bill.splitMethod === 'person_day' && bill.usageStart && bill.usageEnd) {
    const days = housemates.map(h => presentDays(h.id, bill.usageStart!, bill.usageEnd!, absences))
    if (days.some(d => d !== days[0])) return { weights: days, daysPresent: days }
  }
  return { weights: housemates.map(() => 1), daysPresent: housemates.map(() => null) }
}

export function computeBillSplit(
  bill: EngineBill, housemates: EngineHousemate[], absences: EngineAbsence[],
): BillSplit[] {
  if (bill.ownerId != null) {
    return housemates.map(h => ({
      billId: bill.id, housemateId: h.id, daysPresent: null,
      amountCents: h.id === bill.ownerId ? bill.amountCents : 0,
    }))
  }
  const { weights, daysPresent } = billWeights(bill, housemates, absences)
  const parts = allocate(bill.amountCents, weights)
  return housemates.map((h, i) => ({
    billId: bill.id, housemateId: h.id, daysPresent: daysPresent[i], amountCents: parts[i],
  }))
}

export type CycleResult = {
  splits: BillSplit[]
  dues: { housemateId: number; amountDueCents: number }[]
}

/**
 * Splits every bill in a cycle. Owner bills (personal charging) are owed entirely
 * by their owner AND deducted from the largest bill of their target utility
 * before that bill is split — the metered total includes the personal usage.
 *
 * Each shared bill is split on its own and every share is rounded up (see
 * allocate), so the dues can come to a few cents more than the bills: less than
 * one cent over per housemate per shared bill.
 */
export function computeCycleSplits(
  bills: EngineBill[], housemates: EngineHousemate[], absences: EngineAbsence[],
): CycleResult {
  const deduction = new Map<number, number>() // billId → cents to subtract
  for (const owned of bills.filter(b => b.ownerId != null && b.deductFromUtilityId != null)) {
    const targets = bills.filter(b => b.utilityId === owned.deductFromUtilityId && b.ownerId == null)
    if (targets.length === 0) continue
    const largest = targets.reduce((a, b) => (b.amountCents > a.amountCents ? b : a))
    deduction.set(largest.id, (deduction.get(largest.id) ?? 0) + owned.amountCents)
  }

  const splits: BillSplit[] = []

  // Owner bills: entire (undeducted) amount to the owner.
  for (const b of bills.filter(b => b.ownerId != null)) {
    splits.push(...computeBillSplit(b, housemates, absences))
  }

  // Shared bills: split what is left after any personal usage is taken out.
  for (const b of bills.filter(b => b.ownerId == null)) {
    const effective = { ...b, amountCents: b.amountCents - (deduction.get(b.id) ?? 0) }
    splits.push(...computeBillSplit(effective, housemates, absences))
  }

  const dues = housemates.map(h => ({
    housemateId: h.id,
    amountDueCents: splits.filter(s => s.housemateId === h.id).reduce((a, s) => a + s.amountCents, 0),
  }))
  return { splits, dues }
}
