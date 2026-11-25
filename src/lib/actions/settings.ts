'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, ne } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { housemates, utilities } from '@/db/schema'
import { MAX_INTERVAL_MONTHS } from '@/lib/fixed-bills'
import { parseAmountToCents } from '@/lib/money'
import { requireUser } from './guard'

const schema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().min(1),
  email: z.string().email(),
  venmoUsername: z.string().optional(),
})

export async function updateHousemate(formData: FormData) {
  await requireUser()
  const d = schema.parse(Object.fromEntries(formData))
  await db.update(housemates).set({
    name: d.name, email: d.email.toLowerCase(), venmoUsername: d.venmoUsername || null,
  }).where(eq(housemates.id, d.id))
  revalidatePath('/settings')
}

const utilitySchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  splitMethod: z.enum(['even', 'person_day']),
  // Blank = the amount varies and bills are typed in.
  fixedAmount: z.string().trim(),
  intervalMonths: z.coerce.number().int().min(1).max(MAX_INTERVAL_MONTHS),
  // Rendered as a link, so only web addresses are accepted.
  portalUrl: z.string().trim().refine(v => v === '' || /^https?:\/\//i.test(v), 'portal must be an http(s) address'),
})

/**
 * Edits a utility. Bills already entered keep their amounts: a fixed amount only
 * decides what is added to cycles started from now on.
 */
export async function updateUtility(formData: FormData) {
  await requireUser()
  const d = utilitySchema.parse(Object.fromEntries(formData))
  const fixedAmountCents = d.fixedAmount === '' ? null : parseAmountToCents(d.fixedAmount)
  if (fixedAmountCents != null && fixedAmountCents <= 0) throw new Error('fixed amount must be more than zero')
  const clash = await db.select({ id: utilities.id }).from(utilities)
    .where(and(eq(utilities.name, d.name), ne(utilities.id, d.id)))
  if (clash.length > 0) throw new Error(`another utility is already called "${d.name}"`)
  await db.update(utilities).set({
    name: d.name, splitMethod: d.splitMethod, fixedAmountCents,
    intervalMonths: d.intervalMonths, portalUrl: d.portalUrl || null,
  }).where(eq(utilities.id, d.id))
  revalidatePath('/settings'); revalidatePath('/bills'); revalidatePath('/')
}
