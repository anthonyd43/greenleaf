import { eq } from 'drizzle-orm'
import { db } from '../src/db'
import { billCycles, bills, utilities } from '../src/db/schema'
import { parseAmountToCents } from '../src/lib/money'
import type { SheetRow } from './sheet-data.example'

// Prefers the gitignored sheet-data.local.ts (your real history) and falls
// back to the committed example data.
async function loadSheetData(): Promise<{ SHEET_ROWS: SheetRow[]; CYCLE_LABELS: Record<number, string> }> {
  try {
    // dynamic specifier keeps TS agnostic about the optional local module
    const localModule = './sheet-data.local'
    return await import(localModule)
  } catch {
    return await import('./sheet-data.example')
  }
}

async function main() {
  const { SHEET_ROWS, CYCLE_LABELS } = await loadSheetData()

  const existing = await db.select().from(bills).where(eq(bills.source, 'imported'))
  if (existing.length > 0) {
    console.log(`already imported (${existing.length} bills) — aborting`)
    process.exit(0)
  }
  const utils = await db.select().from(utilities)
  const utilId = (name: string) => {
    const u = utils.find(x => x.name === name)
    if (!u) throw new Error(`unknown utility in sheet data: ${name} — create/rename it to match before importing`)
    return u.id
  }

  // The highest-numbered cycle imports as the current open cycle.
  const openCycle = Math.max(...Object.keys(CYCLE_LABELS).map(Number))
  for (const [num, label] of Object.entries(CYCLE_LABELS)) {
    await db.insert(billCycles).values({
      cycleNumber: Number(num), label, status: Number(num) === openCycle ? 'open' : 'settled',
    }).onConflictDoNothing()
  }
  const cycles = await db.select().from(billCycles)
  const cycleId = (n: number) => cycles.find(c => c.cycleNumber === n)!.id

  let imported = 0
  for (const row of SHEET_ROWS) {
    if (row.amount == null) continue
    await db.insert(bills).values({
      utilityId: utilId(row.utility), cycleId: cycleId(row.cycle),
      amountCents: parseAmountToCents(row.amount),
      paymentDate: row.paymentDate, usagePeriodText: row.usagePeriod,
      notes: row.notes, source: 'imported', status: 'confirmed',
    })
    imported++
  }
  console.log(`imported ${imported} bills across ${Object.keys(CYCLE_LABELS).length} cycles`)
  process.exit(0)
}
main()
