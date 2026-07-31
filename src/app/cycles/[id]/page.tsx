import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { finalizeCycle, markVenmoRequested, reopenCycle } from '@/lib/actions/cycle'
import { formatCents } from '@/lib/money'
import { getCycleBreakdown } from '@/lib/queries'
import { venmoRequestLink } from '@/lib/venmo'
import { VenmoButton } from '@/components/venmo-button'
import { MarkPaidToggle } from '@/components/mark-paid-toggle'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { IconSquare } from '@/components/ui/icon-square'
import { pillSolid } from '@/components/ui/classes'

export const dynamic = 'force-dynamic'

export default async function CyclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cycleId = Number(id)
  if (!Number.isFinite(cycleId)) notFound()
  const [data, session] = await Promise.all([getCycleBreakdown(cycleId), auth()])
  if (!data) notFound()
  const { cycle, billRows, housemates, splits, dues, payments, estimated } = data
  const confirmed = billRows.filter(r => r.bill.status === 'confirmed')
  const total = confirmed.reduce((a, r) => a + r.bill.amountCents, 0)
  const duesTotal = dues.reduce((a, d) => a + d.amountDueCents, 0)
  const myEmail = session?.user?.email?.toLowerCase()
  const me = myEmail ? housemates.find(h => h.email.toLowerCase() === myEmail) : undefined
  const isOpen = cycle.status === 'open'

  return (
    <div className="mx-auto max-w-[940px] space-y-5">
      <Link href="/cycles" className="text-[13px] text-ink-2 transition-colors duration-150 hover:text-accent">
        ← All cycles
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[26px] font-semibold leading-tight text-ink">{cycle.label}</h1>
            <Badge variant={isOpen ? 'open' : 'settled'}>{isOpen ? 'open' : 'settled'}</Badge>
          </div>
          <p className="mt-1 text-[13px] text-ink-2">
            Cycle #{cycle.cycleNumber}
            {isOpen && ' · live preview — splits recompute as bills land'}
            {estimated && ' · estimated from imported data'}
          </p>
        </div>
        {isOpen && (
          <form action={finalizeCycle}>
            <input type="hidden" name="cycleId" value={cycle.id} />
            <button className={pillSolid}>Finalize cycle</button>
          </form>
        )}
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-ink-2">
              <th className="px-5 py-3 font-medium">Bill</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              {housemates.map(h => (
                <th key={h.id} className="px-5 py-3 font-medium">{h.name.split(' ')[0]}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {confirmed.map(({ bill, utility }) => (
              <tr key={bill.id}>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-3">
                    <IconSquare name={utility.name} />
                    <span className="font-medium text-ink">{utility.name}</span>
                  </span>
                </td>
                <td className="px-5 py-3 tabular-nums text-ink">{formatCents(bill.amountCents)}</td>
                {housemates.map(h => {
                  const s = splits.find(x => x.billId === bill.id && x.housemateId === h.id)
                  return (
                    <td key={h.id} className="px-5 py-3 tabular-nums text-ink">
                      {s ? formatCents(s.amountCents) : '—'}
                      {s?.daysPresent != null && (
                        <span className="text-xs text-ink-3"> ({s.daysPresent}d)</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
            <tr className="bg-accent/5 font-semibold">
              <td className="px-5 py-3 text-ink">Total</td>
              <td className="px-5 py-3 tabular-nums text-ink">{formatCents(total)}</td>
              {housemates.map(h => (
                <td
                  key={h.id}
                  className={`px-5 py-3 tabular-nums ${h.id === me?.id ? 'text-mint' : 'text-ink'}`}
                >
                  {formatCents(dues.find(d => d.housemateId === h.id)?.amountDueCents ?? 0)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <p className="border-t border-line px-5 py-3 text-xs text-ink-3">
          Sanity check: dues sum to {formatCents(duesTotal)} vs bills total {formatCents(total)}.
        </p>
      </Card>

      {estimated ? (
        <Card>
          <p className="text-sm text-ink-2">
            Imported cycle — dues are estimated from sheet data and current absences.
          </p>
        </Card>
      ) : (
        <Card className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-3.5 pt-5">
            <h2 className="text-[15px] font-semibold text-ink">Pay dues</h2>
            {isOpen && <span className="text-xs text-ink-3">Venmo requests unlock after finalizing</span>}
          </div>
          <div className="space-y-2 px-5 pb-5">
            {isOpen
              ? dues.map(d => {
                  const mate = housemates.find(h => h.id === d.housemateId)
                  if (!mate) return null
                  return (
                    <div key={d.housemateId} className="flex items-center gap-3 rounded-[14px] bg-raised-2 px-4 py-3">
                      <Avatar name={mate.name} me={mate.id === me?.id} />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                        {mate.name}{mate.id === me?.id ? ' · you' : ''}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-ink">{formatCents(d.amountDueCents)}</span>
                      <Badge variant="pending">pending</Badge>
                    </div>
                  )
                })
              : payments.map(p => {
                  const mate = housemates.find(h => h.id === p.housemateId)
                  if (!mate) return null
                  const note = `Greenleaf utilities — ${cycle.label} (cycle ${cycle.cycleNumber})`
                  return (
                    <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-[14px] bg-raised-2 px-4 py-3">
                      <Avatar name={mate.name} me={mate.id === me?.id} />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                        {mate.name}{mate.id === me?.id ? ' · you' : ''}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-ink">{formatCents(p.amountDueCents)}</span>
                      <Badge variant={p.paid ? 'paid' : p.venmoRequested ? 'requested' : 'pending'}>
                        {p.paid ? 'paid' : p.venmoRequested ? 'requested' : 'pending'}
                      </Badge>
                      {mate.venmoUsername ? (
                        <VenmoButton
                          href={venmoRequestLink(mate.venmoUsername, p.amountDueCents, note)}
                          onTapAction={async () => {
                            'use server'
                            await markVenmoRequested(p.id)
                          }}
                        />
                      ) : (
                        <span className="text-xs text-ink-3">no venmo</span>
                      )}
                      <MarkPaidToggle paymentId={p.id} paid={p.paid} />
                    </div>
                  )
                })}
          </div>
        </Card>
      )}

      {!isOpen && (
        <form action={reopenCycle}>
          <input type="hidden" name="cycleId" value={cycle.id} />
          <button className="text-xs text-danger/80 underline transition-colors duration-150 hover:text-danger">
            Reopen cycle (recomputes splits)
          </button>
        </form>
      )}
    </div>
  )
}
