import Link from 'next/link'
import { notFound } from 'next/navigation'
import { updateBill } from '@/lib/actions/bills'
import { getBill, getCycle, listUtilities } from '@/lib/queries'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { UsagePeriodInput } from '@/components/ui/usage-period-input'
import { rangeIsCalendarMonth } from '@/lib/usage-period'

export const dynamic = 'force-dynamic'

const fieldClass = 'rounded-lg border border-line bg-card px-3 py-2 text-sm'
const labelClass = 'text-xs text-ink-2'

export default async function EditBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const billId = Number(id)
  if (!Number.isFinite(billId)) notFound()
  const row = await getBill(billId)
  if (!row) notFound()
  const { bill } = row
  const cycle = await getCycle(bill.cycleId)
  const utilities = await listUtilities()
  const defaultMonth =
    bill.usageStart && bill.usageEnd
      ? rangeIsCalendarMonth(bill.usageStart, bill.usageEnd) ?? undefined
      : undefined

  return (
    <div className="space-y-6">
      <PageHeader title="Edit bill" />

      {!cycle || cycle.status !== 'open' ? (
        <Card>
          <p className="text-sm text-warning">
            This bill&apos;s cycle is finalized — reopen it to edit.{' '}
            {cycle && (
              <Link href={`/cycles/${cycle.id}`} className="underline">
                View cycle →
              </Link>
            )}
          </p>
        </Card>
      ) : (
        <Card className="max-w-lg">
          <form action={updateBill} className="grid grid-cols-2 gap-3">
            <input type="hidden" name="id" value={bill.id} />
            <input type="hidden" name="cycleId" value={bill.cycleId} />

            <label className="col-span-2 flex flex-col gap-1">
              <span className={labelClass}>Utility</span>
              <select name="utilityId" defaultValue={bill.utilityId} className={fieldClass} required>
                {utilities.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className={labelClass}>Amount</span>
              <input
                name="amount"
                defaultValue={(bill.amountCents / 100).toFixed(2)}
                placeholder="e.g. 42.06"
                className={fieldClass}
                required
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className={labelClass}>Payment date</span>
              <input name="paymentDate" type="date" defaultValue={bill.paymentDate ?? ''} className={fieldClass} />
            </label>

            <UsagePeriodInput
              defaultMonth={defaultMonth}
              defaultStart={bill.usageStart ?? undefined}
              defaultEnd={bill.usageEnd ?? undefined}
            />

            <label className="col-span-2 flex flex-col gap-1">
              <span className={labelClass}>Usage period text</span>
              <input
                name="usagePeriodText"
                defaultValue={bill.usagePeriodText ?? ''}
                placeholder="Usage period text"
                className={fieldClass}
              />
            </label>

            <label className="col-span-2 flex flex-col gap-1">
              <span className={labelClass}>Notes</span>
              <input name="notes" defaultValue={bill.notes ?? ''} placeholder="Notes" className={fieldClass} />
            </label>

            <label className="col-span-2 flex items-center gap-2 text-sm text-ink-2">
              <input type="checkbox" name="splitOverride" value="even" defaultChecked={bill.splitOverride === 'even'} />
              Force even split
            </label>

            <button className="col-span-2 rounded-lg bg-accent px-3 py-2 text-sm text-white shadow-glow">
              Save changes
            </button>
          </form>
        </Card>
      )}

      <p>
        <Link href="/bills" className="text-sm text-accent hover:underline">
          Cancel — back to Bills
        </Link>
      </p>
    </div>
  )
}
