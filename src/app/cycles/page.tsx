import Link from 'next/link'
import { getCycleTotals } from '@/lib/queries'
import { formatCents } from '@/lib/money'
import { Card } from '@/components/ui/card'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'

export const dynamic = 'force-dynamic'

export default async function CyclesPage() {
  const totals = await getCycleTotals()
  const cycles = [...totals].reverse()

  return (
    <div className="space-y-6">
      <PageHeader title="Cycles" />
      <div className="grid gap-3">
        {cycles.map(c => (
          <Link key={c.cycleId} href={`/cycles/${c.cycleId}`}>
            <Card className="flex flex-wrap items-center justify-between gap-3 transition hover:border-accent/40">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium text-ink">
                  #{c.cycleNumber} — {c.label}
                </span>
                <Badge variant={c.status as BadgeVariant}>{c.status}</Badge>
              </span>
              <span className="tabular-nums font-medium text-ink">{formatCents(c.totalCents)}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
