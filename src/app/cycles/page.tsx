import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getCycleTotals, getOpenCycle } from '@/lib/queries'
import { formatCents } from '@/lib/money'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'

export const dynamic = 'force-dynamic'

export default async function CyclesPage() {
  const [totals, open] = await Promise.all([getCycleTotals(), getOpenCycle()])
  const openTotal = open ? totals.find(t => t.cycleId === open.id) : null
  const settled = [...totals].reverse().filter(t => t.cycleId !== open?.id)
  const maxTotal = Math.max(1, ...settled.map(s => s.totalCents))
  const avg = settled.length
    ? Math.round(settled.reduce((a, s) => a + s.totalCents, 0) / settled.length)
    : 0

  return (
    <div className="mx-auto max-w-[820px] space-y-5">
      <PageHeader title="Cycles" sub="Every month's bills, splits, and settlement" />

      {open && (
        <Link href={`/cycles/${open.id}`} className="block">
          <Card className="border-accent/30 p-0 transition-colors duration-150 hover:border-accent/50">
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-t-[20px] px-5 py-4"
              style={{ background: 'linear-gradient(120deg, rgba(164,192,127,0.1), transparent)' }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[15px] font-semibold text-ink">{open.label}</span>
                <Badge variant="open">open</Badge>
              </div>
              <span className="text-xl font-bold tabular-nums text-ink">
                {formatCents(openTotal?.totalCents ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-line px-5 py-3.5">
              <span className="text-xs text-ink-3">
                Finalizing freezes dues and unlocks Venmo requests
              </span>
              <span className="text-[13px] text-accent">View splits →</span>
            </div>
          </Card>
        </Link>
      )}

      {settled.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-ink">Settled</h2>
            <span className="text-xs tabular-nums text-ink-3">avg {formatCents(avg)} / cycle</span>
          </div>
          <Card className="p-0">
            <div className="divide-y divide-line">
              {settled.map(c => (
                <Link
                  key={c.cycleId}
                  href={`/cycles/${c.cycleId}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-[rgba(148,163,184,0.04)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ink">{c.label}</div>
                    <div className="text-xs text-ink-2">cycle #{c.cycleNumber} · {c.status}</div>
                  </div>
                  <div className="hidden h-1.5 w-[90px] rounded-full bg-raised rail:block">
                    <div
                      className="h-1.5 rounded-full bg-ink-3 opacity-70"
                      style={{ width: `${Math.round((c.totalCents / maxTotal) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-ink">{formatCents(c.totalCents)}</span>
                  <ChevronRight size={16} className="text-ink-3" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      )}

      {!open && settled.length === 0 && (
        <Card>
          <p className="text-ink-2">
            No cycles yet — <Link href="/bills" className="text-accent underline">start one on the Bills page</Link>.
          </p>
        </Card>
      )}
    </div>
  )
}
