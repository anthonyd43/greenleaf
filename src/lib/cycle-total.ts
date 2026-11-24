/**
 * A personal utility belongs to one housemate (it has an owner — e.g. someone's
 * EV charging). Its bills are owed entirely by that owner, so they are not part
 * of what the household spent in a cycle.
 */
export function isPersonalUtility(utility: { ownerId: number | null }): boolean {
  return utility.ownerId != null
}

export type CycleTotalRow = {
  bill: { amountCents: number; status: string }
  utility: { ownerId: number | null }
}

/** A cycle's total: its confirmed bills, leaving out personal (owner-pays) bills. */
export function cycleTotalCents(rows: CycleTotalRow[]): number {
  return rows
    .filter(r => r.bill.status === 'confirmed' && !isPersonalUtility(r.utility))
    .reduce((a, r) => a + r.bill.amountCents, 0)
}
