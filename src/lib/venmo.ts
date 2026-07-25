/** Venmo has no public request API; this deep link prefills a charge the user sends manually. */
export function venmoRequestLink(username: string, amountCents: number, note: string): string {
  const params = new URLSearchParams({
    txn: 'charge',
    amount: (amountCents / 100).toFixed(2),
    note,
  })
  return `https://venmo.com/${encodeURIComponent(username)}?${params.toString()}`
}
