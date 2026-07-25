import Link from 'next/link'
import { createBill, createCycle, deleteBill } from '@/lib/actions/bills'
import { formatCents } from '@/lib/money'
import { getOpenCycle, listBills, listCycles, listUtilities } from '@/lib/queries'
import { utilitySlot } from '@/lib/utility-slots'
import { Card } from '@/components/ui/card'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { UsagePeriodInput } from '@/components/ui/usage-period-input'

export const dynamic = 'force-dynamic'

const fieldClass = 'rounded-lg border border-line bg-card px-3 py-2 text-sm'
const labelClass = 'text-xs text-ink-2'

export default async function BillsPage() {
  const [open, utilities, cycles, rows] = await Promise.all([
    getOpenCycle(),
    listUtilities(),
    listCycles(),
    listBills(),
  ])

  const billsByCycle = new Map<number, typeof rows>()
  for (const row of rows) {
    const list = billsByCycle.get(row.bill.cycleId)
    if (list) list.push(row)
    else billsByCycle.set(row.bill.cycleId, [row])
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Bills" />

      {!open && (
        <Card>
          <form action={createCycle} className="flex gap-2">
            <input
              name="label"
              placeholder="New cycle label (e.g. July 2026)"
              className={`flex-1 ${fieldClass}`}
              required
            />
            <button className="rounded-lg bg-accent px-4 text-sm text-white shadow-glow">Start cycle</button>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {cycles.map(cycle => {
          const cycleBills = billsByCycle.get(cycle.id) ?? []
          const isOpen = open?.id === cycle.id
          if (!isOpen && cycleBills.length === 0) return null

          const subtotalCents = cycleBills
            .filter(r => r.bill.status === 'confirmed')
            .reduce((a, r) => a + r.bill.amountCents, 0)

          return (
            <Card key={cycle.id} className="overflow-hidden p-0">
              <details className="group" open={isOpen}>
                <summary className="flex cursor-pointer select-none items-center justify-between gap-3 px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium text-ink">
                      #{cycle.cycleNumber} — {cycle.label}
                    </span>
                    <Badge variant={cycle.status as BadgeVariant}>{cycle.status}</Badge>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="tabular-nums font-medium text-ink">{formatCents(subtotalCents)}</span>
                    <svg
                      className="h-4 w-4 shrink-0 text-ink-2 transition-transform group-open:rotate-180"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 7l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </summary>

                <div className="divide-y divide-line border-t border-line">
                  {cycleBills.map(({ bill, utility }) => {
                    const period = bill.usageStart ? `${bill.usageStart} → ${bill.usageEnd}` : bill.usagePeriodText
                    return (
                      <div key={bill.id} className="group/row flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: `var(--cat-${utilitySlot(utility.name, utility.id)})` }}
                        />
                        <span className="text-sm text-ink">{utility.name}</span>
                        {bill.status === 'draft' && <Badge variant="neutral">draft</Badge>}
                        <span className="text-xs text-ink-2">
                          {period ?? '—'}
                          {bill.paymentDate ? ` · paid ${bill.paymentDate}` : ''}
                        </span>
                        <span className="ml-auto tabular-nums text-sm text-ink">{formatCents(bill.amountCents)}</span>
                        <span className="flex items-center gap-3 opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 max-md:opacity-100">
                          <Link href={`/bills/${bill.id}`} className="text-xs text-info">
                            edit
                          </Link>
                          <form action={deleteBill}>
                            <input type="hidden" name="id" value={bill.id} />
                            <button className="text-xs text-danger">delete</button>
                          </form>
                        </span>
                      </div>
                    )
                  })}
                </div>

                {isOpen && open && (
                  <form action={createBill} className="m-4 grid grid-cols-2 gap-2 rounded-xl bg-raised p-4 md:grid-cols-4">
                    <input type="hidden" name="cycleId" value={open.id} />

                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>Utility</span>
                      <select name="utilityId" className={fieldClass} required>
                        {utilities.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>Amount</span>
                      <input name="amount" placeholder="e.g. 42.06" className={fieldClass} required />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>Payment date</span>
                      <input name="paymentDate" type="date" className={fieldClass} />
                    </label>

                    <UsagePeriodInput />

                    <label className="col-span-2 flex flex-col gap-1">
                      <span className={labelClass}>Notes</span>
                      <input name="notes" placeholder="Notes" className={fieldClass} />
                    </label>

                    <label className="flex items-center gap-1 text-sm text-ink-2">
                      <input type="checkbox" name="splitOverride" value="even" /> Force even split
                    </label>

                    <button className="rounded-lg bg-accent px-3 py-2 text-sm text-white shadow-glow">
                      Add to {open.label}
                    </button>
                  </form>
                )}
              </details>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
