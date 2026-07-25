'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { absences, billCycles, bills, payments, splits, utilities } from '@/db/schema'
import { computeCycleSplits, type EngineBill } from '@/lib/split/engine'
import { listHousemates } from '@/lib/queries'
import { requireUser } from './guard'

async function engineBills(cycleId: number): Promise<EngineBill[]> {
  const rows = await db.select({ bill: bills, utility: utilities }).from(bills)
    .innerJoin(utilities, eq(bills.utilityId, utilities.id))
    .where(eq(bills.cycleId, cycleId))
  return rows
    .filter(r => r.bill.status === 'confirmed')
    .map(r => ({
      id: r.bill.id, utilityId: r.bill.utilityId, amountCents: r.bill.amountCents,
      usageStart: r.bill.usageStart, usageEnd: r.bill.usageEnd,
      splitMethod: r.bill.splitOverride ?? r.utility.splitMethod,
      ownerId: r.utility.ownerId, deductFromUtilityId: r.utility.deductFromUtilityId,
    }))
}

export async function finalizeCycle(formData: FormData) {
  await requireUser()
  const cycleId = z.coerce.number().int().positive().parse(formData.get('cycleId'))
  const cycle = (await db.select().from(billCycles).where(eq(billCycles.id, cycleId)))[0]
  if (!cycle || cycle.status !== 'open') throw new Error('cycle is not open')

  const ebs = await engineBills(cycleId)
  const bad = ebs.find(b => b.splitMethod === 'person_day' && b.ownerId == null && (!b.usageStart || !b.usageEnd))
  if (bad) throw new Error('a usage-based bill is missing its usage period — fill it in or force even split')

  const mates = await listHousemates()
  const allAbsences = await db.select().from(absences)
  const { splits: computed, dues } = computeCycleSplits(ebs, mates, allAbsences)

  const cycleBillIds = (await db.select({ id: bills.id }).from(bills).where(eq(bills.cycleId, cycleId))).map(b => b.id)

  await db.transaction(async tx => {
    // Conditional status flip FIRST: only one concurrent/double-submitted finalize can win this
    // row-locking compare-and-swap (status must still be 'open'). A second transaction blocks on
    // the row lock and then sees 0 rows affected once the first commits — it aborts here instead
    // of racing past READ COMMITTED's delete-sees-nothing-yet/insert-anyway window and duplicating
    // splits/payments.
    const advanced = await tx.update(billCycles).set({ status: 'finalized' })
      .where(and(eq(billCycles.id, cycleId), eq(billCycles.status, 'open')))
      .returning({ id: billCycles.id })
    if (advanced.length === 0) throw new Error('cycle is not open')

    if (cycleBillIds.length > 0) await tx.delete(splits).where(inArray(splits.billId, cycleBillIds))
    if (computed.length > 0) await tx.insert(splits).values(computed)
    await tx.delete(payments).where(eq(payments.cycleId, cycleId))
    await tx.insert(payments).values(dues.map(d => ({
      cycleId, housemateId: d.housemateId, amountDueCents: d.amountDueCents,
    })))
  })
  revalidatePath(`/cycles/${cycleId}`); revalidatePath('/')
}

export async function reopenCycle(formData: FormData) {
  await requireUser()
  const cycleId = z.coerce.number().int().positive().parse(formData.get('cycleId'))
  const cycleBills = await db.select().from(bills).where(eq(bills.cycleId, cycleId))
  const cycleBillIds = cycleBills.map(b => b.id)
  await db.transaction(async tx => {
    if (cycleBillIds.length > 0) await tx.delete(splits).where(inArray(splits.billId, cycleBillIds))
    await tx.delete(payments).where(eq(payments.cycleId, cycleId))
    await tx.update(billCycles).set({ status: 'open' }).where(eq(billCycles.id, cycleId))
  })
  revalidatePath(`/cycles/${cycleId}`); revalidatePath('/')
}

/** Auto-advance cycle status from the fresh payment state, but never resurrect an open cycle. */
async function advanceCycleStatusFromPayments(cycleId: number) {
  const cycle = (await db.select().from(billCycles).where(eq(billCycles.id, cycleId)))[0]
  if (cycle && cycle.status !== 'open') {
    const all = await db.select().from(payments).where(eq(payments.cycleId, cycleId))
    const status = all.every(p => p.paid) ? 'settled'
      : all.every(p => p.venmoRequested) ? 'requested'
      : 'finalized'
    await db.update(billCycles).set({ status }).where(eq(billCycles.id, cycleId))
  }
}

export async function togglePayment(formData: FormData) {
  await requireUser()
  const paymentId = z.coerce.number().int().positive().parse(formData.get('paymentId'))
  const field = z.enum(['venmoRequested', 'paid']).parse(formData.get('field'))
  const row = (await db.select().from(payments).where(eq(payments.id, paymentId)))[0]
  if (!row) throw new Error('payment not found')
  await db.update(payments).set({ [field]: !row[field] }).where(eq(payments.id, paymentId))
  await advanceCycleStatusFromPayments(row.cycleId)
  revalidatePath(`/cycles/${row.cycleId}`); revalidatePath('/')
}

/**
 * Idempotently mark a payment's venmo request as sent. Unlike togglePayment, this never flips
 * back to false — double-tapping the Request button (e.g. from a stale render before revalidation
 * lands) is safe because the operation always converges to venmoRequested = true.
 */
export async function markVenmoRequested(paymentId: number) {
  await requireUser()
  const id = z.number().int().positive().parse(paymentId)
  const row = (await db.select().from(payments).where(eq(payments.id, id)))[0]
  if (!row) throw new Error('payment not found')
  await db.update(payments).set({ venmoRequested: true }).where(eq(payments.id, id))
  await advanceCycleStatusFromPayments(row.cycleId)
  revalidatePath(`/cycles/${row.cycleId}`); revalidatePath('/')
}

/** Manually bulk-advance a cycle one step (finalized → requested → settled), marking all payments accordingly. */
export async function advanceCycleStatus(formData: FormData) {
  await requireUser()
  const cycleId = z.coerce.number().int().positive().parse(formData.get('cycleId'))
  const cycle = (await db.select().from(billCycles).where(eq(billCycles.id, cycleId)))[0]
  if (!cycle) throw new Error('cycle not found')
  const next = cycle.status === 'finalized' ? 'requested' : cycle.status === 'requested' ? 'settled' : null
  if (!next) throw new Error(`cannot advance cycle from status "${cycle.status}"`)

  await db.transaction(async tx => {
    if (next === 'requested') await tx.update(payments).set({ venmoRequested: true }).where(eq(payments.cycleId, cycleId))
    if (next === 'settled') await tx.update(payments).set({ paid: true }).where(eq(payments.cycleId, cycleId))
    await tx.update(billCycles).set({ status: next }).where(eq(billCycles.id, cycleId))
  })
  revalidatePath(`/cycles/${cycleId}`); revalidatePath('/')
}
