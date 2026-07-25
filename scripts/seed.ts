import { db } from '../src/db'
import { housemates, utilities } from '../src/db/schema'
import { eq } from 'drizzle-orm'

// Housemate 1's email doubles as the initial sign-in allowlist entry —
// set SEED_OWNER_EMAIL to your Google account email so you can log in,
// then update everyone's real names/emails on the Settings page.
async function main() {
  const ownerEmail = (process.env.SEED_OWNER_EMAIL ?? 'housemate1@example.com').toLowerCase()

  await db.insert(housemates).values([
    { name: 'Housemate One', email: ownerEmail },
    { name: 'Housemate Two', email: 'housemate2@example.com' },
    { name: 'Housemate Three', email: 'housemate3@example.com' },
    { name: 'Housemate Four', email: 'housemate4@example.com' },
  ]).onConflictDoNothing()

  const hm = await db.select().from(housemates)
  const id = (n: string) => hm.find(h => h.name === n)!.id

  await db.insert(utilities).values([
    { name: 'Gas', splitMethod: 'person_day' },
    { name: 'Electricity', splitMethod: 'person_day' },
    { name: 'Water', splitMethod: 'person_day' },
    { name: 'Garbage', splitMethod: 'even' },
    { name: 'Internet', splitMethod: 'even' },
    // Personal EV charging: owed entirely by its owner and deducted from the
    // electricity bill before splitting. Rename/reassign per your household.
    { name: 'EV Charging A', splitMethod: 'even', ownerId: id('Housemate One') },
    { name: 'EV Charging B', splitMethod: 'even', ownerId: id('Housemate Four') },
  ]).onConflictDoNothing()

  const elec = await db.select().from(utilities).where(eq(utilities.name, 'Electricity'))
  for (const n of ['EV Charging A', 'EV Charging B']) {
    await db.update(utilities).set({ deductFromUtilityId: elec[0].id }).where(eq(utilities.name, n))
  }
  console.log('seeded')
  process.exit(0)
}
main()
