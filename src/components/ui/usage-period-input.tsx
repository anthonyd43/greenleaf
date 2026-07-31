'use client'

import { useState } from 'react'
import { fieldClass, labelClass } from '@/components/ui/classes'

type Mode = 'month' | 'dates'

export function UsagePeriodInput({
  defaultMonth,
  defaultStart,
  defaultEnd,
}: {
  defaultMonth?: string
  defaultStart?: string
  defaultEnd?: string
}) {
  // Dates mode is preselected only when dates are given without a month; otherwise month mode wins.
  const initialMode: Mode = !defaultMonth && (defaultStart || defaultEnd) ? 'dates' : 'month'
  const [mode, setMode] = useState<Mode>(initialMode)

  return (
    <div className="col-span-2 flex flex-col gap-1">
      <span className={labelClass}>Usage period</span>
      <div className="inline-flex rounded-full border border-line bg-page p-0.5">
        <button
          type="button"
          onClick={() => setMode('month')}
          aria-pressed={mode === 'month'}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 ${
            mode === 'month' ? 'bg-mint text-mint-ink' : 'text-ink-2 hover:text-ink'
          }`}
        >
          Month
        </button>
        <button
          type="button"
          onClick={() => setMode('dates')}
          aria-pressed={mode === 'dates'}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 ${
            mode === 'dates' ? 'bg-mint text-mint-ink' : 'text-ink-2 hover:text-ink'
          }`}
        >
          Specific dates
        </button>
      </div>

      {mode === 'month' ? (
        <input
          name="usageMonth"
          type="month"
          defaultValue={defaultMonth}
          className={fieldClass}
          aria-label="Usage month"
        />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Start date</span>
            <input name="usageStart" type="date" defaultValue={defaultStart} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>End date</span>
            <input name="usageEnd" type="date" defaultValue={defaultEnd} className={fieldClass} />
          </label>
        </div>
      )}
    </div>
  )
}
