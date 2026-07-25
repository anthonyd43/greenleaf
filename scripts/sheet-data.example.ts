// Example historical data for the one-time import. To import your own
// history, copy this file to sheet-data.local.ts (gitignored) and fill in
// your real rows — the import script prefers the local file when present.
// Utility names must match rows in the utilities table (see scripts/seed.ts).
export type SheetRow = {
  utility: string; cycle: number; paymentDate: string | null
  usagePeriod: string | null; amount: string | null; notes: string | null
}

export const SHEET_ROWS: SheetRow[] = [
  { utility: 'Gas', cycle: 1, paymentDate: '2026-01-22', usagePeriod: 'December', amount: '24.10', notes: null },
  { utility: 'Electricity', cycle: 1, paymentDate: '2026-01-22', usagePeriod: 'December', amount: '210.55', notes: null },
  { utility: 'Water', cycle: 1, paymentDate: '2026-01-16', usagePeriod: '11/20/25 - 01/15/26', amount: '98.40', notes: null },
  { utility: 'Internet', cycle: 1, paymentDate: '2026-01-27', usagePeriod: 'January', amount: '55.00', notes: null },
  { utility: 'EV Charging A', cycle: 1, paymentDate: null, usagePeriod: 'December', amount: '31.00', notes: null },
  { utility: 'Gas', cycle: 2, paymentDate: '2026-02-20', usagePeriod: 'January', amount: '27.85', notes: null },
  { utility: 'Electricity', cycle: 2, paymentDate: '2026-02-20', usagePeriod: 'January', amount: '198.20', notes: 'two housemates away one week' },
  { utility: 'Internet', cycle: 2, paymentDate: '2026-02-27', usagePeriod: 'February', amount: '55.00', notes: null },
  { utility: 'EV Charging B', cycle: 2, paymentDate: null, usagePeriod: 'January', amount: '19.00', notes: null },
]

export const CYCLE_LABELS: Record<number, string> = {
  1: 'Dec 2025',
  2: 'Jan 2026',
}
