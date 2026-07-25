'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { billCycles, bills } from '@/db/schema'
import { parseAmountToCents } from '@/lib/money'
import { monthToRange } from '@/lib/usage-period'
import { requireUser } from './guard'

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('').transform(() => undefined))

const billSchema = z.object({
  utilityId: z.coerce.number().int().positive(),
  cycleId: z.coerce.number().int().positive(),
  amount: z.string().min(1),
  paymentDate: dateStr,
  usageMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional().or(z.literal('').transform(() => undefined)),
  usageStart: dateStr,
  usageEnd: dateStr,
  usagePeriodText: z.string().optional(),
  notes: z.string().optional(),
  splitOverride: z.enum(['even']).optional().or(z.literal('').transform(() => undefined)),
})

/** When usageMonth is present, it overrides usageStart/usageEnd with the month's calendar range. */
function resolveUsagePeriod(data: z.infer<typeof billSchema>): { usageStart?: string; usageEnd?: string } {
  if (data.usageMonth) {
    try {
      const { start, end } = monthToRange(data.usageMonth)
      return { usageStart: start, usageEnd: end }
    } catch {
      throw new Error('invalid usage month')
    }
  }
  return { usageStart: data.usageStart, usageEnd: data.usageEnd }
}

async function assertCycleOpen(cycleId: number) {
  const rows = await db.select().from(billCycles).where(eq(billCycles.id, cycleId))
  if (!rows[0]) throw new Error('cycle not found')
  if (rows[0].status !== 'open') throw new Error('cycle is not open — reopen it first')
}

export async function createCycle(formData: FormData) {
  await requireUser()
  const label = z.string().min(1).parse(formData.get('label'))
  const existing = await db.select().from(billCycles)
  const next = Math.max(0, ...existing.map(c => c.cycleNumber)) + 1
  await db.insert(billCycles).values({ cycleNumber: next, label })
  revalidatePath('/')
}

export async function createBill(formData: FormData) {
  await requireUser()
  const data = billSchema.parse(Object.fromEntries(formData))
  await assertCycleOpen(data.cycleId)
  const { usageStart, usageEnd } = resolveUsagePeriod(data)
  await db.insert(bills).values({
    utilityId: data.utilityId, cycleId: data.cycleId,
    amountCents: parseAmountToCents(data.amount),
    paymentDate: data.paymentDate ?? null,
    usageStart: usageStart ?? null, usageEnd: usageEnd ?? null,
    usagePeriodText: data.usagePeriodText || null, notes: data.notes || null,
    splitOverride: data.splitOverride ?? null,
  })
  revalidatePath('/bills'); revalidatePath('/')
}

export async function updateBill(formData: FormData) {
  await requireUser()
  const id = z.coerce.number().int().positive().parse(formData.get('id'))
  const data = billSchema.parse(Object.fromEntries(formData))
  const row = (await db.select().from(bills).where(eq(bills.id, id)))[0]
  if (!row) throw new Error('bill not found')
  // Authorize against the bill's own stored cycle, not the form-supplied cycleId — a client
  // could otherwise pair a finalized cycle's billId with an unrelated open cycleId and slip past
  // this guard while mutating a bill whose splits/payments are already frozen.
  await assertCycleOpen(row.cycleId)
  const { usageStart, usageEnd } = resolveUsagePeriod(data)
  await db.update(bills).set({
    utilityId: data.utilityId, amountCents: parseAmountToCents(data.amount),
    paymentDate: data.paymentDate ?? null,
    usageStart: usageStart ?? null, usageEnd: usageEnd ?? null,
    usagePeriodText: data.usagePeriodText || null, notes: data.notes || null,
    splitOverride: data.splitOverride ?? null,
  }).where(eq(bills.id, id))
  revalidatePath('/bills'); revalidatePath('/')
  redirect('/bills')
}

export async function deleteBill(formData: FormData) {
  await requireUser()
  const id = z.coerce.number().int().positive().parse(formData.get('id'))
  const row = (await db.select().from(bills).where(eq(bills.id, id)))[0]
  if (!row) return
  await assertCycleOpen(row.cycleId)
  await db.delete(bills).where(eq(bills.id, id))
  revalidatePath('/bills'); revalidatePath('/')
}

export async function confirmBill(formData: FormData) {
  await requireUser()
  const id = z.coerce.number().int().positive().parse(formData.get('id'))
  const row = (await db.select().from(bills).where(eq(bills.id, id)))[0]
  if (!row) return
  await assertCycleOpen(row.cycleId)
  await db.update(bills).set({ status: 'confirmed' }).where(eq(bills.id, id))
  revalidatePath('/bills'); revalidatePath('/')
}
