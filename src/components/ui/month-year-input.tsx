'use client'

import { useState } from 'react'
import { fieldClass } from '@/components/ui/classes'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * Month + year picker that submits `name` as 'YYYY-MM' (or '' while incomplete).
 * Built from a select and a number field instead of <input type="month">, which
 * Firefox and desktop Safari render as a plain text box.
 */
export function MonthYearInput({
  name,
  label,
  defaultMonth,
  required = false,
}: {
  name: string
  /** What is being picked, for screen readers, e.g. "Usage" → "Usage month" / "Usage year". */
  label: string
  /** 'YYYY-MM' */
  defaultMonth?: string
  required?: boolean
}) {
  const [month, setMonth] = useState(defaultMonth?.slice(5, 7) ?? '')
  const [year, setYear] = useState(defaultMonth?.slice(0, 4) ?? '')
  const value = month && /^\d{4}$/.test(year) ? `${year}-${month}` : ''

  return (
    <div className="flex gap-2">
      <input type="hidden" name={name} value={value} />
      <select
        aria-label={`${label} month`}
        value={month}
        onChange={e => setMonth(e.target.value)}
        // Half a month is not a month: once either part is filled in, both are needed.
        required={required || year !== ''}
        className={`min-w-0 flex-1 ${fieldClass}`}
      >
        {(!required || month === '') && <option value="">Month</option>}
        {MONTHS.map((m, i) => (
          <option key={m} value={String(i + 1).padStart(2, '0')}>
            {m}
          </option>
        ))}
      </select>
      <input
        type="number"
        aria-label={`${label} year`}
        value={year}
        onChange={e => setYear(e.target.value)}
        min={2000}
        max={2100}
        step={1}
        placeholder="Year"
        required={required || month !== ''}
        className={`w-24 tabular-nums ${fieldClass}`}
      />
    </div>
  )
}
