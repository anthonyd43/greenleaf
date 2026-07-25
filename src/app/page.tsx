import Link from 'next/link'
import { auth } from '@/auth'
import { formatCents } from '@/lib/money'
import { getCycleBreakdown, getCycleTotals, getOpenCycle, listCycles } from '@/lib/queries'
import { Card, CardHeader } from '@/components/ui/card'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { CycleSelector } from '@/components/ui/cycle-selector'
import { SpendingTrend } from '@/components/charts/spending-trend'
import { UtilityDonut } from '@/components/charts/utility-donut'
import { utilitySlot } from '@/lib/utility-slots'

export const dynamic = 'force-dynamic'

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ cycle?: string }> }) {
  const session = await auth()
  const { cycle: cycleParam } = await searchParams

  const [cycles, totals, open] = await Promise.all([listCycles(), getCycleTotals(), getOpenCycle()])

  if (cycles.length === 0) {
    return (
      <Card>
        <p className="text-ink-2">
          No cycles yet — <Link href="/bills" className="text-accent underline">start one on the Bills page</Link>.
        </p>
      </Card>
    )
  }

  const paramId = cycleParam && /^\d+$/.test(cycleParam) ? Number(cycleParam) : null
  const selectedId = paramId !== null && cycles.some(c => c.id === paramId)
    ? paramId
    : (open?.id ?? cycles[0].id)

  const data = await getCycleBreakdown(selectedId)
  if (!data) {
    return (
      <Card>
        <p className="text-ink-2">
          No cycles yet — <Link href="/bills" className="text-accent underline">start one on the Bills page</Link>.
        </p>
      </Card>
    )
  }

  const cycleTotalCents = totals.find(t => t.cycleId === selectedId)?.totalCents ?? 0

  const myEmail = session?.user?.email?.toLowerCase()
  const me = myEmail ? data.housemates.find(h => h.email.toLowerCase() === myEmail) : undefined
  const myDue = me ? data.dues.find(d => d.housemateId === me.id) : undefined
  const yourShare = myDue ? formatCents(myDue.amountDueCents) : '—'

  const collectedCents = data.frozen
    ? data.payments.filter(p => p.paid).reduce((a, p) => a + p.amountDueCents, 0)
    : 0
  const outstandingCents = data.frozen
    ? data.payments.filter(p => !p.paid).reduce((a, p) => a + p.amountDueCents, 0)
    : cycleTotalCents

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        action={<CycleSelector cycles={cycles} currentId={selectedId} />}
      />
      <div className="flex items-center gap-2 text-sm text-ink-2">
        <span>{data.cycle.label}</span>
        <Badge variant={data.cycle.status as BadgeVariant}>{data.cycle.status}</Badge>
        {data.estimated && <Badge variant="neutral">estimated</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Cycle total" value={formatCents(cycleTotalCents)} accent />
        <StatCard label="Your share" value={yourShare} sub="you" />
        <StatCard
          label="Collected"
          value={data.estimated ? '—' : formatCents(collectedCents)}
          sub={data.estimated ? 'estimated' : data.frozen ? undefined : 'not finalized'}
        />
        <StatCard
          label="Outstanding"
          value={data.estimated ? '—' : formatCents(outstandingCents)}
          sub={data.estimated ? 'estimated' : data.frozen ? undefined : 'preview'}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <SpendingTrend
          data={totals.map(t => ({
            label: t.label,
            cycleNumber: t.cycleNumber,
            totalCents: t.totalCents,
            selected: t.cycleId === selectedId,
          }))}
        />
        <UtilityDonut
          data={Object.values(
            data.billRows
              .filter(r => r.bill.status === 'confirmed')
              .reduce<Record<string, { name: string; amountCents: number; slot: number }>>((acc, r) => {
                const name = r.utility.name
                const slot = utilitySlot(name, r.utility.id)
                const existing = acc[name]
                if (existing) {
                  existing.amountCents += r.bill.amountCents
                } else {
                  acc[name] = { name, amountCents: r.bill.amountCents, slot }
                }
                return acc
              }, {}),
          )}
        />
      </div>

      <Card>
        <CardHeader
          title="What each person owes"
          badge={data.estimated ? <Badge variant="neutral">estimated</Badge> : undefined}
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {data.dues.map(d => {
            const mate = data.housemates.find(h => h.id === d.housemateId)
            const payment = data.payments.find(p => p.housemateId === d.housemateId)
            return (
              <div key={d.housemateId} className="bg-raised rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-raised text-sm font-semibold text-ink">
                    {mate?.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm text-ink-2">{mate?.name}</div>
                    <div className="tabular-nums font-semibold text-ink">{formatCents(d.amountDueCents)}</div>
                  </div>
                </div>
                {payment && (
                  <div className="mt-3">
                    {payment.paid ? (
                      <Badge variant="paid">paid</Badge>
                    ) : payment.venmoRequested ? (
                      <Badge variant="requested">requested</Badge>
                    ) : (
                      <Badge variant="pending">unpaid</Badge>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Bills this cycle"
          badge={
            <Link href={`/cycles/${data.cycle.id}`} className="text-sm text-accent hover:underline">
              View cycle →
            </Link>
          }
        />
        <div className="divide-y divide-line">
          {data.billRows.map(({ bill, utility }) => (
            <div key={bill.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-ink">{utility.name}</span>
              <span className="tabular-nums text-ink-2">{formatCents(bill.amountCents)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
