// One-time (idempotent) data fix: imported bills in OPEN cycles have null
// usageStart/usageEnd (the import script never derived dates; the open-cycle
// query path intentionally doesn't either, so absences never prorated their
// person-day utilities). This backfills real dates from each bill's
// usagePeriodText + cycle label, using the same deriveUsagePeriod helper the
// app already relies on for imported/settled cycles.
//
// Scoped to person-day, no-owner utilities only (Gas/Electricity/Water):
// those are the only utilities whose split actually consumes usageStart/
// usageEnd. Even-split and personal-owner (charging) utilities never need
// usage dates — their usagePeriodText remains the display — and the single-
// month-name derivation is unreliable for "prepay ahead" text (e.g. an
// Internet bill's "July" under a "Jun 2026" cycle label derives to 2025-07,
// not 2026-07). A prior run of this script wrote such wrong-year dates for
// those bills; this version also reverts them back to null.
import { eq } from 'drizzle-orm'
import { db } from '../src/db'
import { billCycles, bills, utilities } from '../src/db/schema'
import { deriveUsagePeriod } from '../src/lib/usage-period'

/** Only Gas/Electricity/Water-shaped utilities: person-day split, no personal owner. */
function needsUsageDates(utility: { splitMethod: string; ownerId: number | null }): boolean {
  return utility.splitMethod === 'person_day' && utility.ownerId == null
}

async function main() {
  const openCycles = await db.select().from(billCycles).where(eq(billCycles.status, 'open'))
  if (openCycles.length === 0) {
    console.log('no open cycles — nothing to do')
    process.exit(0)
  }
  const cycleById = new Map(openCycles.map(c => [c.id, c]))
  const utils = await db.select().from(utilities)
  const utilById = new Map(utils.map(u => [u.id, u]))

  const openCycleIds = openCycles.map(c => c.id)
  const openCycleBills = (await db.select().from(bills)).filter(b => openCycleIds.includes(b.cycleId))

  // Revert pass: even-split/personal-owner imported bills should never carry
  // usage dates (their split doesn't use them, and the derivation is
  // unreliable for their prepay-ahead text patterns). Only null out dates that
  // exactly match what deriveUsagePeriod would produce for this bill right
  // now — i.e. values this script itself (a current or prior run) would have
  // written. `source === 'imported'` alone isn't a safe guard: updateBill
  // never changes source, so a user editing an imported bill's dates later
  // wouldn't be protected by that check alone. Requiring an exact match means
  // user-entered dates (which won't coincidentally equal the derivation) are
  // left untouched, and bills where derivation returns null are skipped —
  // nothing to match.
  let reverted = 0
  for (const bill of openCycleBills) {
    const utility = utilById.get(bill.utilityId)
    if (!utility || needsUsageDates(utility)) continue
    if (bill.source !== 'imported') continue
    if (bill.usageStart == null && bill.usageEnd == null) continue
    const cycle = cycleById.get(bill.cycleId)!
    const derived = deriveUsagePeriod(bill.usagePeriodText, cycle.label)
    if (!derived) continue
    if (bill.usageStart !== derived.start || bill.usageEnd !== derived.end) continue
    await db.update(bills).set({ usageStart: null, usageEnd: null }).where(eq(bills.id, bill.id))
    console.log(
      `reverted bill ${bill.id} (${utility.name}, cycle "${cycle.label}"): ${bill.usageStart} -> ${bill.usageEnd} => null`,
    )
    reverted++
  }

  // Backfill pass: person-day, no-owner utilities only.
  const targets = openCycleBills.filter(b => {
    const utility = utilById.get(b.utilityId)
    return utility && needsUsageDates(utility) && b.usageStart == null && b.usageEnd == null
  })

  let updated = 0
  for (const bill of targets) {
    const cycle = cycleById.get(bill.cycleId)!
    const derived = deriveUsagePeriod(bill.usagePeriodText, cycle.label)
    if (!derived) continue
    await db.update(bills)
      .set({ usageStart: derived.start, usageEnd: derived.end })
      .where(eq(bills.id, bill.id))
    const utilityName = utilById.get(bill.utilityId)?.name ?? `utility ${bill.utilityId}`
    console.log(
      `bill ${bill.id} (${utilityName}, cycle "${cycle.label}"): ${derived.start} -> ${derived.end}`,
    )
    updated++
  }

  console.log(`reverted ${reverted} bill(s), updated ${updated} bill(s)`)
  process.exit(0)
}
main()
