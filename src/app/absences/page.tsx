import { Info, Trash2 } from 'lucide-react'
import { createAbsence, deleteAbsence, saveAbsenceMonth } from '@/lib/actions/absences'
import { listAbsences, listHousemates } from '@/lib/queries'
import { Card, CardHeader } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Avatar } from '@/components/ui/avatar'
import { AbsenceCalendar } from '@/components/absence-calendar'
import { fieldClass, ghostIconDanger, labelClass, pillSolid } from '@/components/ui/classes'

export const dynamic = 'force-dynamic'

function tripDays(start: string, end: string): number {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1
}

export default async function AbsencesPage() {
  const [rows, mates] = await Promise.all([listAbsences(), listHousemates()])
  return (
    <div className="mx-auto max-w-[1040px] space-y-5">
      <PageHeader
        title="Absences"
        sub="Usage-based utilities (gas, electricity, water) prorate by days home"
      />

      <div className="flex items-center gap-3 rounded-[14px] border border-accent/25 bg-accent/10 px-4 py-3">
        <Info size={16} className="shrink-0 text-accent" />
        <p className="text-[13px] text-ink-2">
          Calendar taps and Add-a-trip are two ways into the same absence data — use whichever fits.
        </p>
      </div>

      <div className="flex flex-col gap-5 rail:flex-row">
        <Card className="min-w-0 flex-[1.5]">
          <CardHeader title="Absence calendar" />
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

        <div className="w-full space-y-5 rail:w-[340px] rail:shrink-0">
          <Card>
            <CardHeader title="Add a trip" />
            <p className="-mt-2 mb-3 text-xs text-ink-3">
              A whole date range at once — shows up on the calendar too
            </p>
            <form action={createAbsence} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className={labelClass}>Housemate</span>
                <select name="housemateId" className={fieldClass} required>
                  {mates.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className={labelClass}>Start date</span>
                  <input name="startDate" type="date" className={fieldClass} required />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelClass}>End date</span>
                  <input name="endDate" type="date" className={fieldClass} required />
                </label>
              </div>
              <label className="flex flex-col gap-1">
                <span className={labelClass}>Note</span>
                <input name="note" placeholder="e.g. work travel" className={fieldClass} />
              </label>
              <button className={`${pillSolid} w-full`}>Add</button>
            </form>
          </Card>

          <Card>
            <CardHeader title="Logged trips" />
            {rows.length === 0 ? (
              <p className="text-sm text-ink-2">No trips logged.</p>
            ) : (
              <div className="space-y-2">
                {rows.map(({ absence, housemate }) => (
                  <div key={absence.id} className="flex items-center gap-3 rounded-[14px] bg-raised-2 px-3.5 py-2.5">
                    <Avatar name={housemate.name} size={30} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-ink">
                        {housemate.name.split(' ')[0]} · {tripDays(absence.startDate, absence.endDate)} days
                      </div>
                      <div className="truncate text-xs text-ink-2">
                        {absence.startDate} – {absence.endDate}
                        {absence.note ? ` · ${absence.note}` : ''}
                      </div>
                    </div>
                    <form action={deleteAbsence}>
                      <input type="hidden" name="id" value={absence.id} />
                      <button aria-label="Delete trip" className={ghostIconDanger}>
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
