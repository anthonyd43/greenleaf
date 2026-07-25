'use client'

import { useState } from 'react'

const fieldClass = 'rounded-lg border border-line bg-card px-3 py-2 text-sm'
const labelClass = 'text-xs text-ink-2'

type Mode = 'month' | 'dates'

function pillClass(active: boolean): string {
  return active
    ? 'rounded-full px-2.5 py-0.5 text-xs font-medium text-accent bg-accent/10'
    : 'rounded-full px-2.5 py-0.5 text-xs font-medium text-ink-2 bg-raised'
}

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
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('month')}
          aria-pressed={mode === 'month'}
          className={pillClass(mode === 'month')}
        >
          Month
        </button>
        <button
          type="button"
          onClick={() => setMode('dates')}
          aria-pressed={mode === 'dates'}
          className={pillClass(mode === 'dates')}
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
