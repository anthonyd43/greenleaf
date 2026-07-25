'use server'

import { revalidatePath } from 'next/cache'
import { eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { absences } from '@/db/schema'
import { reconcileMonth } from '@/lib/absence-month'
import { requireUser } from './guard'

const schema = z.object({
  housemateId: z.coerce.number().int().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().optional(),
}).refine(d => d.endDate >= d.startDate, { message: 'end before start' })

const dateRe = /^\d{4}-\d{2}-\d{2}$/
const monthRe = /^\d{4}-(0[1-9]|1[0-2])$/

const saveMonthSchema = z.object({
  housemateId: z.coerce.number().int().positive(),
  month: z.string().regex(monthRe),
  days: z.string().transform(s => JSON.parse(s)).pipe(z.array(z.string().regex(dateRe))),
  note: z.string().optional(),
})

export async function createAbsence(formData: FormData) {
  await requireUser()
  const d = schema.parse(Object.fromEntries(formData))
  await db.insert(absences).values({ ...d, note: d.note || null })
  revalidatePath('/absences'); revalidatePath('/')
}

export async function deleteAbsence(formData: FormData) {
  await requireUser()
  const id = z.coerce.number().int().positive().parse(formData.get('id'))
  await db.delete(absences).where(eq(absences.id, id))
  revalidatePath('/absences'); revalidatePath('/')
}

export async function saveAbsenceMonth(formData: FormData) {
  await requireUser()
  const d = saveMonthSchema.parse(Object.fromEntries(formData))
  const existing = await db.select().from(absences).where(eq(absences.housemateId, d.housemateId))
  const { deleteIds, create } = reconcileMonth(existing, d.month, d.days)

  await db.transaction(async tx => {
    if (deleteIds.length > 0) await tx.delete(absences).where(inArray(absences.id, deleteIds))
    if (create.length > 0) {
      await tx.insert(absences).values(create.map(r => ({
        housemateId: d.housemateId,
        startDate: r.startDate,
        endDate: r.endDate,
        // Inherited notes (fragments, or runs overlapping a deleted noted range) win;
        // the form's note only fills in for genuinely new runs (r.note === null).
        note: r.note ?? (d.note || null),
      })))
    }
  })
  revalidatePath('/absences'); revalidatePath('/')
}
