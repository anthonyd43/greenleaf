import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { housemates } from '@/db/schema'

export async function isAllowedEmail(email: string | null | undefined): Promise<boolean> {
  const normalized = email?.toLowerCase()
  if (!normalized) return false
  const rows = await db.select().from(housemates).where(eq(housemates.email, normalized))
  return rows.length > 0 && rows[0].isActive
}
