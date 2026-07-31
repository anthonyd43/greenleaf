import Link from 'next/link'
import { ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { createCycle, deleteBill } from '@/lib/actions/bills'
import { formatCents } from '@/lib/money'
import { getOpenCycle, listBills, listCycles, listUtilities } from '@/lib/queries'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { IconSquare } from '@/components/ui/icon-square'
import { AddBillForm } from '@/components/add-bill-form'
import { fieldClass, ghostIcon, ghostIconDanger, pillSolid } from '@/components/ui/classes'

export const dynamic = 'force-dynamic'

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>
}) {
  const { add } = await searchParams
  const [open, utilities, cycles, rows] = await Promise.all([
    getOpenCycle(), listUtilities(), listCycles(), listBills(),
  ])

  const billsByCycle = new Map<number, typeof rows>()
  for (const row of rows) {
    const list = billsByCycle.get(row.bill.cycleId)
    if (list) list.push(row)
    else billsByCycle.set(row.bill.cycleId, [row])
  }
  const openBills = open ? (billsByCycle.get(open.id) ?? []) : []
  const openConfirmed = openBills.filter(r => r.bill.status === 'confirmed')
  const openTotal = openConfirmed.reduce((a, r) => a + r.bill.amountCents, 0)
  const past = cycles.filter(c => c.id !== open?.id && (billsByCycle.get(c.id)?.length ?? 0) > 0)

  return (
    <div className="mx-auto max-w-[820px] space-y-5">
      <PageHeader title="Bills" sub="Log what arrived — splits update live" />

      {!open ? (
        <Card>
          <form action={createCycle} className="flex gap-2">
            <input
              name="label"
              placeholder="New cycle label (e.g. July 2026)"
              className={`flex-1 ${fieldClass}`}
              required
            />
            <button className={pillSolid}>Start cycle</button>
          </form>
        </Card>
      ) : (
        <AddBillForm
          cycle={{ id: open.id, label: open.label }}
          utilities={utilities.map(u => ({ id: u.id, name: u.name }))}
          defaultOpen={add === '1'}
        />
      )}

      {open && (
        <Card className="p-0">
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-t-[20px] px-5 py-4"
            style={{ background: 'linear-gradient(120deg, rgba(164,192,127,0.1), transparent)' }}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-[15px] font-semibold text-ink">{open.label}</span>
              <Badge variant="open">open</Badge>
            </div>
            <span className="text-xl font-bold tabular-nums text-ink">{formatCents(openTotal)}</span>
          </div>
          <div className="divide-y divide-line border-t border-line">
            {openBills.map(({ bill, utility }) => {
              const period = bill.usageStart ? `${bill.usageStart} → ${bill.usageEnd}` : bill.usagePeriodText
              return (
                <div key={bill.id} className="flex items-center gap-3 px-5 py-3">
                  <IconSquare name={utility.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-ink">{utility.name}</span>
                      {bill.status === 'draft' && <Badge variant="neutral">draft</Badge>}
                    </div>
                    <div className="truncate text-xs text-ink-2">
                      {period ?? '—'}
                      {bill.paymentDate ? ` · paid ${bill.paymentDate}` : ''}
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-ink">{formatCents(bill.amountCents)}</span>
                  <div className="flex items-center gap-1">
                    <Link href={`/bills/${bill.id}`} aria-label="Edit" className={ghostIcon}>
                      <Pencil size={14} strokeWidth={2} />
                    </Link>
                    <form action={deleteBill}>
                      <input type="hidden" name="id" value={bill.id} />
                      <button aria-label="Delete" className={ghostIconDanger}>
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
            {openBills.length === 0 && (
              <p className="px-5 py-4 text-sm text-ink-2">No bills yet this cycle.</p>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-line px-5 py-3.5">
            <span className="text-xs text-ink-3">
              {openBills.length} bill{openBills.length === 1 ? '' : 's'}
              {openBills.length > 0 && openConfirmed.length === openBills.length ? ' · all confirmed' : ''}
            </span>
            <Link href={`/cycles/${open.id}`} className="text-[13px] text-accent hover:text-[#c2d8a4]">
              View splits →
            </Link>
          </div>
        </Card>
      )}

      {past.length > 0 && (
        <Card className="p-0">
          <div className="flex items-center justify-between px-5 pb-3.5 pt-5">
            <h2 className="text-[15px] font-semibold text-ink">Past cycles</h2>
            <Link href="/cycles" className="text-[13px] text-accent hover:text-[#c2d8a4]">See all</Link>
          </div>
          <div className="divide-y divide-line border-t border-line">
            {past.map(c => {
              const cycleBills = billsByCycle.get(c.id) ?? []
              const totalCents = cycleBills
                .filter(r => r.bill.status === 'confirmed')
                .reduce((a, r) => a + r.bill.amountCents, 0)
              return (
                <Link
                  key={c.id}
                  href={`/cycles/${c.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-[rgba(148,163,184,0.04)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ink">{c.label}</div>
                    <div className="text-xs text-ink-2">
                      cycle #{c.cycleNumber} · {cycleBills.length} bill{cycleBills.length === 1 ? '' : 's'}
                    </div>
                  </div>
                  <Badge variant="settled">settled</Badge>
                  <span className="text-sm font-semibold tabular-nums text-ink">{formatCents(totalCents)}</span>
                  <ChevronRight size={16} className="text-ink-3" />
                </Link>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
