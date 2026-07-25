'use client'

import { useEffect, useMemo, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { listMonthDays, type AbsRange } from '@/lib/absence-month'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type Housemate = { id: number; name: string }
type Absence = { id: number; housemateId: number; startDate: string; endDate: string }

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Adds (or subtracts) whole months to a 'YYYY-MM' string via UTC math. */
function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`
}

/** Human-readable label for a 'YYYY-MM' string, e.g. 'July 2026'. Computed via UTC. */
function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Builds a Mon-first grid of ISO day strings for `month`, with `null` cells
 * for the leading/trailing blanks outside the month. Always built via
 * Date.UTC — never local Date parsing of ISO strings.
 */
function buildGrid(month: string): (string | null)[] {
  const [y, m] = month.split('-').map(Number)
  const monthIndex = m - 1
  const firstWeekday = new Date(Date.UTC(y, monthIndex, 1)).getUTCDay() // 0=Sun..6=Sat
  const leadBlanks = (firstWeekday + 6) % 7 // Mon-first offset
  const totalDays = new Date(Date.UTC(y, monthIndex + 1, 0)).getUTCDate()

  const cells: (string | null)[] = []
  for (let i = 0; i < leadBlanks; i++) cells.push(null)
  for (let day = 1; day <= totalDays; day++) cells.push(`${y}-${pad2(m)}-${pad2(day)}`)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

/** Today's month ('YYYY-MM') from the viewer's local clock — a UI default, not date-math on stored data. */
function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`
}

function dayCellClass(isSelected: boolean, isPendingAdd: boolean, isPendingRemove: boolean): string {
  const base = 'flex h-9 w-full items-center justify-center rounded-lg text-sm transition-colors'
  const fill = isSelected ? 'bg-accent text-white' : 'text-ink hover:bg-raised'
  const ring = isPendingAdd ? 'ring-2 ring-accent' : isPendingRemove ? 'ring-2 ring-danger' : ''
  return [base, fill, ring].filter(Boolean).join(' ')
}

/** Submit button — must be a descendant of the <form>; useFormStatus reads the nearest one. */
function SaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-lg bg-accent px-4 py-2 text-sm text-white shadow-glow disabled:opacity-50"
    >
      {pending ? 'Saving…' : 'Save'}
    </button>
  )
}

function MonthGrid({
  housemateId,
  month,
  rangesForHousemate,
  action,
  onDirtyChange,
}: {
  housemateId: number
  month: string
  rangesForHousemate: AbsRange[]
  action: (formData: FormData) => void
  onDirtyChange: (dirty: boolean) => void
}) {
  const initialDays = useMemo(() => listMonthDays(rangesForHousemate, month), [rangesForHousemate, month])
  const [selectedDays, setSelectedDays] = useState<Set<string>>(() => new Set(initialDays))
  const [note, setNote] = useState('')

  const initialSet = useMemo(() => new Set(initialDays), [initialDays])
  const { pendingAdds, pendingRemoves } = useMemo(() => {
    const adds = new Set<string>()
    const removes = new Set<string>()
    for (const d of selectedDays) if (!initialSet.has(d)) adds.add(d)
    for (const d of initialSet) if (!selectedDays.has(d)) removes.add(d)
    return { pendingAdds: adds, pendingRemoves: removes }
  }, [selectedDays, initialSet])

  const changeCount = pendingAdds.size + pendingRemoves.size
  const dirty = changeCount > 0

  useEffect(() => {
    onDirtyChange(dirty)
    // onDirtyChange is a stable setState from the parent; only re-run when dirty flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty])

  const grid = useMemo(() => buildGrid(month), [month])

  function toggleDay(iso: string) {
    setSelectedDays(prev => {
      const next = new Set(prev)
      if (next.has(iso)) next.delete(iso)
      else next.add(iso)
      return next
    })
  }

  function reset() {
    setSelectedDays(new Set(initialDays))
    setNote('')
  }

  const daysJson = JSON.stringify(Array.from(selectedDays).sort())

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="housemateId" value={housemateId} readOnly />
      <input type="hidden" name="month" value={month} readOnly />
      <input type="hidden" name="days" value={daysJson} readOnly />

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-2">
        {WEEKDAYS.map(w => (
          <div key={w} className="py-1 font-medium">{w}</div>
        ))}
        {grid.map((iso, i) => {
          if (!iso) return <div key={i} />
          const isSelected = selectedDays.has(iso)
          const isPendingAdd = pendingAdds.has(iso)
          const isPendingRemove = pendingRemoves.has(iso)
          const day = Number(iso.slice(-2))
          return (
            <button
              key={iso}
              type="button"
              onClick={() => toggleDay(iso)}
              aria-pressed={isSelected}
              aria-label={iso}
              className={dayCellClass(isSelected, isPendingAdd, isPendingRemove)}
            >
              {day}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex flex-1 min-w-[10rem] flex-col gap-1">
          <span className="text-xs text-ink-2">Note (applied to newly added days)</span>
          <input
            name="note"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. vacation"
            className="rounded-lg border border-line bg-card px-3 py-2 text-sm"
          />
        </label>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-xs text-ink-2">{changeCount} unsaved change{changeCount === 1 ? '' : 's'}</span>
          )}
          {dirty && (
            <button type="button" onClick={reset} className="rounded-lg border border-line px-3 py-2 text-sm text-ink-2">
              Reset
            </button>
          )}
          <SaveButton disabled={!dirty} />
        </div>
      </div>
    </form>
  )
}

export function AbsenceCalendar({
  housemates,
  absences,
  action,
}: {
  housemates: Housemate[]
  absences: Absence[]
  action: (formData: FormData) => void
}) {
  const [housemateId, setHousemateId] = useState<number | null>(housemates[0]?.id ?? null)
  const [month, setMonth] = useState<string>(currentMonth())
  const [dirty, setDirty] = useState(false)

  const rangesForHousemate: AbsRange[] = useMemo(
    () =>
      absences
        .filter(a => a.housemateId === housemateId)
        .map(a => ({ id: a.id, startDate: a.startDate, endDate: a.endDate, note: null })),
    [absences, housemateId],
  )

  const dataHash = rangesForHousemate.map(r => `${r.id}:${r.startDate}:${r.endDate}`).join('|')
  const gridKey = `${housemateId}-${month}-${dataHash}`

  if (housemateId == null) {
    return <p className="text-sm text-ink-2">Add a housemate first.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={housemateId}
          disabled={dirty}
          onChange={e => setHousemateId(Number(e.target.value))}
          className="rounded-lg border border-line bg-card px-3 py-2 text-sm disabled:opacity-50"
        >
          {housemates.map(h => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={dirty}
            onClick={() => setMonth(m => shiftMonth(m, -1))}
            aria-label="Previous month"
            className="rounded-lg border border-line px-2 py-1 text-sm disabled:opacity-50"
          >
            ‹
          </button>
          <span className="min-w-[8rem] text-center text-sm font-medium text-ink">{monthLabel(month)}</span>
          <button
            type="button"
            disabled={dirty}
            onClick={() => setMonth(m => shiftMonth(m, 1))}
            aria-label="Next month"
            className="rounded-lg border border-line px-2 py-1 text-sm disabled:opacity-50"
          >
            ›
          </button>
        </div>
      </div>

      {dirty && <p className="text-xs text-warning">Save or reset first — housemate and month are locked while you have unsaved changes.</p>}

      <MonthGrid
        key={gridKey}
        housemateId={housemateId}
        month={month}
        rangesForHousemate={rangesForHousemate}
        action={action}
        onDirtyChange={setDirty}
      />
    </div>
  )
}
