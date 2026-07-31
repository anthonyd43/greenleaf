import Link from 'next/link'
import { ArrowRightLeft, Bell, CalendarDays, Plus } from 'lucide-react'
import { auth } from '@/auth'
import { formatCents } from '@/lib/money'
import { getCycleBreakdown, getOpenCycle, getUtilityTrends, listAbsences, listCycles } from '@/lib/queries'
import { daysLeftInMonth, labelToMonth } from '@/lib/cycle-month'
import { listMonthDays } from '@/lib/absence-month'
import { Card, CardHeader } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { IconSquare } from '@/components/ui/icon-square'
import { UtilityTrends } from '@/components/charts/utility-trends'

export const dynamic = 'force-dynamic'

const quickActions = (openCycleId: number | null) => [
  { href: openCycleId ? `/cycles/${openCycleId}` : '/cycles', label: 'Pay dues', icon: ArrowRightLeft },
  { href: '/bills?add=1', label: 'Add bill', icon: Plus },
  { href: '/absences', label: 'Log absence', icon: CalendarDays },
]

export default async function Dashboard() {
  const session = await auth()
  const [cycles, open, trends, absenceRows] = await Promise.all([
    listCycles(), getOpenCycle(), getUtilityTrends(), listAbsences(),
  ])

  const currentId = open?.id ?? cycles[0]?.id
  if (!currentId) {
    return (
      <Card>
        <p className="text-ink-2">
          No cycles yet — <Link href="/bills" className="text-accent underline">start one on the Bills page</Link>.
        </p>
      </Card>
    )
  }
  const data = await getCycleBreakdown(currentId)
  if (!data) {
    return (
      <Card>
        <p className="text-ink-2">
          No cycles yet — <Link href="/bills" className="text-accent underline">start one on the Bills page</Link>.
        </p>
      </Card>
    )
  }

  const { cycle, billRows, housemates, dues } = data
  const confirmed = billRows.filter(r => r.bill.status === 'confirmed')
  const total = confirmed.reduce((a, r) => a + r.bill.amountCents, 0)

  const myEmail = session?.user?.email?.toLowerCase()
  const me = myEmail ? housemates.find(h => h.email.toLowerCase() === myEmail) : undefined
  const myDue = me ? dues.find(d => d.housemateId === me.id) : undefined
  const firstName = me?.name.split(' ')[0] ?? session?.user?.name?.split(' ')[0] ?? 'there'

  const month = labelToMonth(cycle.label)
  const todayIso = new Date().toISOString().slice(0, 10)
  const daysLeft = month ? daysLeftInMonth(month, todayIso) : null
  const sub = [cycle.label, `cycle #${cycle.cycleNumber}`, daysLeft != null ? `${daysLeft} days left` : null]
    .filter(Boolean).join(' · ')

  const awayDays = (housemateId: number) => {
    if (!month) return 0
    const ranges = absenceRows
      .filter(r => r.absence.housemateId === housemateId)
      .map(r => ({ id: r.absence.id, startDate: r.absence.startDate, endDate: r.absence.endDate, note: null }))
    return listMonthDays(ranges, month).length
  }

  const byUtility = [...confirmed
    .reduce((acc, r) => {
      acc.set(r.utility.name, (acc.get(r.utility.name) ?? 0) + r.bill.amountCents)
      return acc
    }, new Map<string, number>())]
    .sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight text-ink">Hello, {firstName}</h1>
          <p className="mt-1 text-[13px] text-ink-2">{sub}</p>
        </div>
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(148,163,184,0.15)] text-ink-2 transition-colors duration-150 hover:border-[rgba(148,163,184,0.35)] hover:text-ink"
        >
          <Bell size={18} strokeWidth={2} />
        </button>
      </div>

      <div className="flex flex-col gap-5 rail:flex-row">
        {/* Left column */}
        <div className="min-w-0 flex-[1.4] space-y-5">
          {/* Hero */}
          <div className="rounded-[20px] bg-mint p-6 text-mint-ink">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[40px] font-bold leading-none tracking-[-0.02em] tabular-nums">
                {myDue ? formatCents(myDue.amountDueCents) : '—'}
              </span>
              <span className="rounded-full border border-mint-ink/30 px-3 py-1 text-xs font-medium">
                your share
              </span>
            </div>
            <div className="mt-3 flex flex-wrap justify-between gap-2 text-[13px] text-mint-ink-2">
              <span>{confirmed.length} of {billRows.length} bills confirmed</span>
              <span>due when finalized</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-mint-ink/15 pt-3.5">
              <span className="text-[13px] text-mint-ink-2">Household total</span>
              <span className="text-base font-bold tabular-nums">{formatCents(total)}</span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-3">
            {quickActions(open?.id ?? null).map(({ href, label, icon: Icon }, i) => (
              <Link
                key={label}
                href={href}
                className={`flex min-w-[140px] flex-1 items-center gap-3 rounded-2xl border border-line bg-card px-5 py-4 transition-colors duration-150 hover:border-accent/40 ${
                  i === 0 ? 'max-rail:basis-full' : ''
                }`}
              >
                <Icon size={18} strokeWidth={2} className="text-accent" />
                <span className="text-sm font-medium text-ink">{label}</span>
              </Link>
            ))}
          </div>

          {/* Bills */}
          <Card className="p-0">
            <div className="flex items-center justify-between px-5 pb-3.5 pt-5">
              <h2 className="text-[15px] font-semibold text-ink">Bills</h2>
              <Link href="/bills" className="text-[13px] text-accent hover:text-[#c2d8a4]">See all</Link>
            </div>
            <div className="divide-y divide-line border-t border-line">
              {billRows.map(({ bill, utility }) => (
                <div key={bill.id} className="flex items-center gap-3 px-5 py-3">
                  <IconSquare name={utility.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{utility.name}</div>
                    <div className="text-xs text-ink-2">
                      {bill.status === 'draft' ? 'draft' : bill.paymentDate ? `paid ${bill.paymentDate}` : 'confirmed'}
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-ink">{formatCents(bill.amountCents)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-line px-5 py-3.5">
              <span className="text-xs text-ink-3">
                {billRows.length} bill{billRows.length === 1 ? '' : 's'}
                {confirmed.length === billRows.length ? ' · all confirmed' : ''}
              </span>
              <Link href={`/cycles/${cycle.id}`} className="text-[13px] text-accent hover:text-[#c2d8a4]">
                View splits →
              </Link>
            </div>
          </Card>
        </div>

        {/* Right rail */}
        <div className="w-full space-y-5 rail:w-[340px] rail:shrink-0">
          <Card>
            <CardHeader title="Where it went" />
            {byUtility.length === 0 ? (
              <p className="py-4 text-sm text-ink-2">No confirmed bills yet this cycle.</p>
            ) : (
              <div className="space-y-3.5">
                {byUtility.map(([name, cents], i) => (
                  <div key={name}>
                    <div className="mb-1.5 flex items-center justify-between text-[13px]">
                      <span className="text-ink">{name}</span>
                      <span className="tabular-nums text-ink-2">{formatCents(cents)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-raised">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${total ? Math.max(3, Math.round((cents / total) * 100)) : 0}%`,
                          background: `var(--chart-${Math.min(i + 1, 5)})`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Housemates" />
            <div className="space-y-3.5">
              {housemates.map(h => {
                const away = awayDays(h.id)
                const isMe = h.id === me?.id
                const note = [isMe ? 'you' : null, away > 0 ? `away ${away} days` : 'home all month']
                  .filter(Boolean).join(' · ')
                return (
                  <div key={h.id} className="flex items-center gap-3">
                    <Avatar name={h.name} me={isMe} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">{h.name.split(' ')[0]}</div>
                      <div className="truncate text-xs text-ink-2">{note}</div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-ink">
                      {formatCents(dues.find(d => d.housemateId === h.id)?.amountDueCents ?? 0)}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>

      <UtilityTrends data={trends} />
    </div>
  )
}
