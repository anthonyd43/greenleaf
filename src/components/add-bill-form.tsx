'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { createBill } from '@/lib/actions/bills'
import { fieldClass, labelClass, pillOutline, pillSolid } from '@/components/ui/classes'
import { UtilityIcon } from '@/components/ui/utility-icon'
import { UsagePeriodInput } from '@/components/ui/usage-period-input'
import { Badge } from '@/components/ui/badge'

export function AddBillForm({
  cycle,
  utilities,
  defaultOpen,
}: {
  cycle: { id: number; label: string }
  utilities: { id: number; name: string }[]
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [utilityId, setUtilityId] = useState(utilities[0]?.id)
  const [even, setEven] = useState(false)

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={pillSolid}>
        <Plus size={16} strokeWidth={2.5} /> Add bill
      </button>
    )
  }

  return (
    <form
      action={createBill}
      className="rounded-[20px] border border-accent/40 bg-card p-5"
    >
      <input type="hidden" name="cycleId" value={cycle.id} />
      <input type="hidden" name="utilityId" value={utilityId ?? ''} />
      {even && <input type="hidden" name="splitOverride" value="even" />}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-ink">New bill</h2>
        <Badge variant="open">{cycle.label} · open</Badge>
      </div>

      <div className="mb-4">
        <span className={labelClass}>Which utility?</span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {utilities.map(u => {
            const on = u.id === utilityId
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => setUtilityId(u.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
                  on
                    ? 'border border-mint bg-mint text-mint-ink'
                    : 'border border-line text-ink-2 hover:border-accent/40 hover:text-ink'
                }`}
              >
                <UtilityIcon name={u.name} size={14} />
                {u.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 rail:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Amount</span>
          <div className={`flex items-baseline gap-1 ${fieldClass}`}>
            <span className="text-ink-2">$</span>
            <input
              name="amount"
              required
              placeholder="0.00"
              inputMode="decimal"
              className="w-full bg-transparent text-[22px] font-semibold tabular-nums text-ink outline-none placeholder:text-ink-3"
            />
          </div>
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Paid on</span>
          <input name="paymentDate" type="date" className={fieldClass} />
        </label>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 rail:grid-cols-2">
        <UsagePeriodInput />
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Note (optional)</span>
          <input name="notes" placeholder="e.g. includes late fee" className={fieldClass} />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <button
          type="button"
          role="switch"
          aria-checked={even}
          onClick={() => setEven(v => !v)}
          className="flex items-center gap-2.5 text-[13px] text-ink-2"
        >
          <span
            className={`relative inline-block h-[22px] w-10 rounded-full transition-colors duration-150 ${
              even ? 'bg-accent' : 'bg-raised'
            }`}
          >
            <span
              className={`absolute top-[3px] h-4 w-4 rounded-full bg-white transition-all duration-150 ${
                even ? 'left-[21px]' : 'left-[3px]'
              }`}
            />
          </span>
          Split evenly, ignore absences
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={() => setOpen(false)} className={pillOutline}>
            Cancel
          </button>
          <button type="submit" className={pillSolid}>
            Add bill
          </button>
        </div>
      </div>
    </form>
  )
}
