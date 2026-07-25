import Link from 'next/link'
import { notFound } from 'next/navigation'
import { finalizeCycle, markVenmoRequested, reopenCycle, togglePayment } from '@/lib/actions/cycle'
import { formatCents } from '@/lib/money'
import { getCycleBreakdown } from '@/lib/queries'
import { venmoRequestLink } from '@/lib/venmo'
import { VenmoButton } from '@/components/venmo-button'
import { Card } from '@/components/ui/card'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { utilitySlot } from '@/lib/utility-slots'

export const dynamic = 'force-dynamic'

export default async function CyclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cycleId = Number(id)
  if (!Number.isFinite(cycleId)) notFound()
  const data = await getCycleBreakdown(cycleId)
  if (!data) notFound()
  const { cycle, billRows, housemates, splits, dues, payments, frozen, estimated } = data
  const total = billRows.filter(r => r.bill.status === 'confirmed').reduce((a, r) => a + r.bill.amountCents, 0)
  const name = (hid: number) => housemates.find(h => h.id === hid)?.name ?? `#${hid}`

  return (
    <div className="space-y-6">
      <Link href="/cycles" className="text-sm text-ink-2 hover:text-accent">
        ← Back to cycles
      </Link>

      <PageHeader
        title={cycle.label}
        action={<Badge variant={cycle.status as BadgeVariant}>{cycle.status}</Badge>}
      />
      <p className="-mt-4 text-xs text-ink-2">
        Cycle #{cycle.cycleNumber}
        {!frozen && !estimated && ' · live preview'}
        {estimated && ' · estimated'}
      </p>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-2">
              <th className="px-5 py-3 font-medium">Bill</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              {housemates.map(h => (
                <th key={h.id} className="px-5 py-3 font-medium">{h.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {billRows.filter(r => r.bill.status === 'confirmed').map(({ bill, utility }) => (
              <tr key={bill.id}>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: `var(--cat-${utilitySlot(utility.name, utility.id)})` }}
                    />
                    <span className="text-ink">{utility.name}</span>
                  </span>
                </td>
                <td className="px-5 py-3 tabular-nums text-ink">{formatCents(bill.amountCents)}</td>
                {housemates.map(h => {
                  const s = splits.find(x => x.billId === bill.id && x.housemateId === h.id)
                  return (
                    <td key={h.id} className="px-5 py-3 tabular-nums text-ink">
                      {s ? formatCents(s.amountCents) : '—'}
                      {s?.daysPresent != null && <span className="text-ink-2"> ({s.daysPresent}d)</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
            <tr className="border-t border-line font-bold">
              <td className="px-5 py-3 text-ink">Total</td>
              <td className="px-5 py-3 tabular-nums text-ink">{formatCents(total)}</td>
              {housemates.map(h => (
                <td key={h.id} className="px-5 py-3 tabular-nums text-ink">
                  {formatCents(dues.find(d => d.housemateId === h.id)?.amountDueCents ?? 0)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <p className="border-t border-line px-5 py-3 text-xs text-ink-2">
          Sanity check: dues sum to {formatCents(dues.reduce((a, d) => a + d.amountDueCents, 0))} vs bills total {formatCents(total)}.
        </p>
      </Card>

      {cycle.status === 'open' ? (
        <form action={finalizeCycle}>
          <input type="hidden" name="cycleId" value={cycle.id} />
          <button className="rounded-xl bg-accent px-6 py-2.5 font-medium text-white shadow-glow">
            Finalize cycle
          </button>
        </form>
      ) : (
        <>
          {frozen ? (
          <Card>
            <h2 className="mb-3 font-semibold text-ink">Venmo requests</h2>
            <div className="divide-y divide-line">
              {payments.map(p => {
                const mate = housemates.find(h => h.id === p.housemateId)
                const note = `Greenleaf utilities — ${cycle.label} (cycle ${cycle.cycleNumber})`
                return (
                  <div key={p.id} className="flex items-center gap-3 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-raised text-sm font-semibold text-ink">
                      {name(p.housemateId)[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0 flex-1 truncate text-sm text-ink">{name(p.housemateId)}</div>
                    <span className="tabular-nums text-sm text-ink">{formatCents(p.amountDueCents)}</span>
                    <Badge variant={p.paid ? 'paid' : p.venmoRequested ? 'requested' : 'pending'}>
                      {p.paid ? 'paid' : p.venmoRequested ? 'requested' : 'pending'}
                    </Badge>
                    {mate?.venmoUsername ? (
                      <VenmoButton
                        href={venmoRequestLink(mate.venmoUsername, p.amountDueCents, note)}
                        onTapAction={async () => {
                          'use server'
                          await markVenmoRequested(p.id)
                        }}
                      />
                    ) : (
                      <span className="text-xs text-ink-2">no venmo</span>
                    )}
                    <form action={togglePayment}>
                      <input type="hidden" name="paymentId" value={p.id} />
                      <input type="hidden" name="field" value="paid" />
                      <button className={`text-xs ${p.paid ? 'text-accent' : 'text-ink-2'}`}>
                        {p.paid ? 'paid ✓' : 'mark paid'}
                      </button>
                    </form>
                  </div>
                )
              })}
            </div>
          </Card>
          ) : (
          <Card>
            <p className="text-sm text-ink-2">
              Imported cycle — dues are estimated from sheet data and current absences.
            </p>
          </Card>
          )}

          <form action={reopenCycle}>
            <input type="hidden" name="cycleId" value={cycle.id} />
            <button className="text-xs text-danger underline">Reopen cycle (recomputes splits)</button>
          </form>
        </>
      )}
    </div>
  )
}
