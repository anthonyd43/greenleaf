/** Largest-remainder allocation: splits amountCents by weights, exact-sum, ties to lower index. */
export function allocate(amountCents: number, weights: number[]): number[] {
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  if (totalWeight === 0) return weights.map(() => 0)
  const raw = weights.map(w => (amountCents * w) / totalWeight)
  const parts = raw.map(Math.floor)
  const remainder = amountCents - parts.reduce((a, b) => a + b, 0)
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i)
  for (let k = 0; k < remainder; k++) parts[order[k].i] += 1
  return parts
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
 * Single source of truth for the person-day-vs-even weight decision: the weight
 * vector a non-owner bill splits by, plus the daysPresent to report per person.
 * Both computeBillSplit and computeCycleSplits' bill-grouping defer to this.
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
 * Non-owner bills that share an identical weight vector (e.g. every plain 'even'
 * bill, regardless of utility) are pooled for rounding purposes: each bill still
 * sums to its own effective amount, but the leftover cents from largest-remainder
 * division are handed out across the whole group so no housemate's cycle-wide
 * total drifts more than a cent from a single cycle-wide split would have given
 * them. Splitting every bill independently would otherwise let the same low-index
 * housemate collect the rounding remainder bill after bill.
 */
export function computeCycleSplits(
  bills: EngineBill[], housemates: EngineHousemate[], absences: EngineAbsence[],
): CycleResult {
  const n = housemates.length

  const deduction = new Map<number, number>() // billId → cents to subtract
  for (const owned of bills.filter(b => b.ownerId != null && b.deductFromUtilityId != null)) {
    const targets = bills.filter(b => b.utilityId === owned.deductFromUtilityId && b.ownerId == null)
    if (targets.length === 0) continue
    const largest = targets.reduce((a, b) => (b.amountCents > a.amountCents ? b : a))
    deduction.set(largest.id, (deduction.get(largest.id) ?? 0) + owned.amountCents)
  }
  const effectiveAmount = (b: EngineBill) => b.amountCents - (deduction.get(b.id) ?? 0)

  const splits: BillSplit[] = []

  // Owner bills: entire (undeducted) amount to the owner — no rounding to share out.
  for (const b of bills.filter(b => b.ownerId != null)) {
    splits.push(...computeBillSplit(b, housemates, absences))
  }

  // Non-owner bills: group by identical weight vector so rounding remainder is pooled fairly.
  const groups = new Map<string, { bills: EngineBill[]; weights: number[]; daysPresent: (number | null)[] }>()
  for (const b of bills.filter(b => b.ownerId == null)) {
    const { weights, daysPresent } = billWeights(b, housemates, absences)
    const key = JSON.stringify(weights)
    const g = groups.get(key)
    if (g) g.bills.push(b)
    else groups.set(key, { bills: [b], weights, daysPresent })
  }

  for (const { bills: groupBills, weights, daysPresent } of groups.values()) {
    const totalWeight = weights.reduce((a, w) => a + w, 0)
    const amounts = groupBills.map(effectiveAmount)
    const targets = allocate(amounts.reduce((a, c) => a + c, 0), weights) // cycle-wide ideal per person

    const bases = amounts.map(amt => {
      const raw = weights.map(w => (totalWeight === 0 ? 0 : (amt * w) / totalWeight))
      return raw.map(Math.floor)
    })
    const remainders = amounts.map((amt, gi) => amt - bases[gi].reduce((a, v) => a + v, 0))
    const floorTotal = new Array(n).fill(0) as number[]
    for (const base of bases) base.forEach((v, j) => { floorTotal[j] += v })
    const extra = targets.map((t, j) => t - floorTotal[j]) // leftover cents owed to each person, mutated below

    const bumps = groupBills.map(() => new Array(n).fill(0) as number[])
    remainders.forEach((need, gi) => {
      const order = extra.map((e, j) => ({ j, e })).sort((a, b) => b.e - a.e || a.j - b.j)
      for (let k = 0; k < need; k++) {
        const { j } = order[k]
        bumps[gi][j] += 1
        extra[j] -= 1
      }
    })

    groupBills.forEach((b, gi) => {
      housemates.forEach((h, j) => {
        splits.push({
          billId: b.id, housemateId: h.id, daysPresent: daysPresent[j],
          amountCents: bases[gi][j] + bumps[gi][j],
        })
      })
    })
  }

  const dues = housemates.map(h => ({
    housemateId: h.id,
    amountDueCents: splits.filter(s => s.housemateId === h.id).reduce((a, s) => a + s.amountCents, 0),
  }))
  return { splits, dues }
}
