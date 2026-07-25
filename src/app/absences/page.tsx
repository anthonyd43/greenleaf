import { createAbsence, deleteAbsence, saveAbsenceMonth } from '@/lib/actions/absences'
import { listAbsences, listHousemates } from '@/lib/queries'
import { Card, CardHeader } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { AbsenceCalendar } from '@/components/absence-calendar'

export const dynamic = 'force-dynamic'

const fieldClass = 'rounded-lg border border-line bg-card px-3 py-2 text-sm'

export default async function AbsencesPage() {
  const [rows, mates] = await Promise.all([listAbsences(), listHousemates()])
  return (
    <div className="space-y-6">
      <PageHeader title="Absences" />
      <p className="text-sm text-ink-2">
        Log time away from the house — usage-based utilities (gas, electricity, water) prorate by days home.
      </p>

      <Card>
        <CardHeader title="Absence calendar" />
        <p className="mb-3 text-xs text-ink-2">Tap days you were away — weekends take two taps, not a form each.</p>
        <AbsenceCalendar
          housemates={mates.map(m => ({ id: m.id, name: m.name }))}
          absences={rows.map(({ absence }) => ({
            id: absence.id,
            housemateId: absence.housemateId,
            startDate: absence.startDate,
            endDate: absence.endDate,
          }))}
          action={saveAbsenceMonth}
        />
      </Card>

      <Card>
        <CardHeader title="Add a longer trip" />
        <form action={createAbsence} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink-2">Housemate</span>
            <select name="housemateId" className={fieldClass} required>
              {mates.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink-2">Start date</span>
            <input name="startDate" type="date" className={fieldClass} required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink-2">End date</span>
            <input name="endDate" type="date" className={fieldClass} required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink-2">Note</span>
            <input name="note" placeholder="e.g. vacation" className={fieldClass} />
          </label>
          <button className="col-span-2 rounded-lg bg-accent px-4 py-2 text-sm text-white shadow-glow md:col-span-1">
            Add
          </button>
        </form>
      </Card>

      <Card className="p-0">
        <div className="divide-y divide-line">
          {rows.map(({ absence, housemate }) => (
            <div key={absence.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-raised text-sm font-semibold text-ink">
                {housemate.name[0]?.toUpperCase() ?? '?'}
              </div>
              <span className="text-sm text-ink">{housemate.name}</span>
              <span className="rounded-full bg-raised px-2.5 py-0.5 text-xs tabular-nums text-ink-2">
                {absence.startDate} → {absence.endDate}
              </span>
              {absence.note && <span className="min-w-0 max-w-full truncate text-sm text-ink-2">{absence.note}</span>}
              <form action={deleteAbsence} className="ml-auto">
                <input type="hidden" name="id" value={absence.id} />
                <button className="text-xs text-danger">delete</button>
              </form>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
