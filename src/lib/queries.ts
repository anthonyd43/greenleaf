import { desc, eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { absences, billCycles, bills, housemates, splits, payments, utilities } from '@/db/schema'
import { computeCycleSplits, type EngineBill } from '@/lib/split/engine'
import { deriveUsagePeriod } from '@/lib/usage-period'

export async function listHousemates() {
  return db.select().from(housemates).where(eq(housemates.isActive, true)).orderBy(housemates.id)
}
export async function listUtilities() {
  return db.select().from(utilities).orderBy(utilities.id)
}
export async function listCycles() {
  return db.select().from(billCycles).orderBy(desc(billCycles.cycleNumber))
}
export async function getOpenCycle() {
  const rows = await db.select().from(billCycles).where(eq(billCycles.status, 'open')).orderBy(desc(billCycles.cycleNumber))
  return rows[0] ?? null
}
export async function listBills(cycleId?: number) {
  const q = db.select({ bill: bills, utility: utilities }).from(bills)
    .innerJoin(utilities, eq(bills.utilityId, utilities.id))
  const rows = cycleId ? await q.where(eq(bills.cycleId, cycleId)) : await q
  return rows.sort((a, b) => b.bill.id - a.bill.id)
}
export async function listAbsences() {
  return db.select({ absence: absences, housemate: housemates }).from(absences)
    .innerJoin(housemates, eq(absences.housemateId, housemates.id))
    .orderBy(desc(absences.startDate))
}
export async function getCycle(cycleId: number) {
  const rows = await db.select().from(billCycles).where(eq(billCycles.id, cycleId))
  return rows[0] ?? null
}
export async function getBill(billId: number) {
  const rows = await db.select({ bill: bills, utility: utilities }).from(bills)
    .innerJoin(utilities, eq(bills.utilityId, utilities.id))
    .where(eq(bills.id, billId))
  return rows[0] ?? null
}
export async function listSplits(billIds: number[]) {
  if (billIds.length === 0) return []
  return db.select().from(splits).where(inArray(splits.billId, billIds))
}
export async function listPayments(cycleId: number) {
  return db.select().from(payments).where(eq(payments.cycleId, cycleId)).orderBy(payments.housemateId)
}

export async function getCycleTotals() {
  const cycles = await db.select().from(billCycles).orderBy(billCycles.cycleNumber)
  const confirmed = await db.select().from(bills).where(eq(bills.status, 'confirmed'))
  return cycles.map(c => ({
    cycleId: c.id, cycleNumber: c.cycleNumber, label: c.label, status: c.status,
    totalCents: confirmed.filter(b => b.cycleId === c.id).reduce((a, b) => a + b.amountCents, 0),
  }))
}

export async function getCycleBreakdown(cycleId: number) {
  const cycle = await getCycle(cycleId)
  if (!cycle) return null
  const billRows = await listBills(cycleId)
  const mates = await listHousemates()
  const ebs: EngineBill[] = billRows
    .filter(r => r.bill.status === 'confirmed')
    .map(r => ({
      id: r.bill.id, utilityId: r.bill.utilityId, amountCents: r.bill.amountCents,
      usageStart: r.bill.usageStart, usageEnd: r.bill.usageEnd,
      splitMethod: r.bill.splitOverride ?? r.utility.splitMethod,
      ownerId: r.utility.ownerId, deductFromUtilityId: r.utility.deductFromUtilityId,
    }))

  if (cycle.status === 'open') {
    const allAbsences = await db.select().from(absences)
    const preview = computeCycleSplits(ebs, mates, allAbsences.map(a => ({
      housemateId: a.housemateId, startDate: a.startDate, endDate: a.endDate,
    })))
    return {
      cycle, billRows, housemates: mates, splits: preview.splits, dues: preview.dues,
      payments: [], frozen: false as const, estimated: false as const,
    }
  }

  const frozenSplits = await listSplits(billRows.map(r => r.bill.id))
  const pay = await listPayments(cycleId)
  if (frozenSplits.length > 0 || pay.length > 0) {
    return {
      cycle, billRows, housemates: mates,
      splits: frozenSplits.map(s => ({ billId: s.billId, housemateId: s.housemateId, daysPresent: s.daysPresent, amountCents: s.amountCents })),
      dues: pay.map(p => ({ housemateId: p.housemateId, amountDueCents: p.amountDueCents })),
      payments: pay, frozen: true as const, estimated: false as const,
    }
  }

  // Imported historical cycle: no stored splits/payments at all. Live-compute
  // dues like the open path, deriving missing usage dates from each bill's
  // free-text usage period.
  const billTextById = new Map(billRows.map(r => [r.bill.id, r.bill.usagePeriodText]))
  const estimatedEbs: EngineBill[] = ebs.map(b => {
    if (b.usageStart != null && b.usageEnd != null) return b
    const derived = deriveUsagePeriod(billTextById.get(b.id) ?? null, cycle.label)
    if (!derived) return b
    return { ...b, usageStart: b.usageStart ?? derived.start, usageEnd: b.usageEnd ?? derived.end }
  })
  const allAbsences = await db.select().from(absences)
  const estimate = computeCycleSplits(estimatedEbs, mates, allAbsences.map(a => ({
    housemateId: a.housemateId, startDate: a.startDate, endDate: a.endDate,
  })))
  return {
    cycle, billRows, housemates: mates, splits: estimate.splits, dues: estimate.dues,
    payments: [], frozen: false as const, estimated: true as const,
  }
}
