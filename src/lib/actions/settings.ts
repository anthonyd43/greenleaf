'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { housemates } from '@/db/schema'
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
