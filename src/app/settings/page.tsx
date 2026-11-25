import { ExternalLink } from 'lucide-react'
import { updateHousemate, updateUtility } from '@/lib/actions/settings'
import { MAX_INTERVAL_MONTHS } from '@/lib/fixed-bills'
import { formatCents } from '@/lib/money'
import { listHousemates, listUtilities } from '@/lib/queries'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Avatar } from '@/components/ui/avatar'
import { UtilityIcon } from '@/components/ui/utility-icon'
import { fieldClass, labelClass } from '@/components/ui/classes'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const [mates, utils] = await Promise.all([listHousemates(), listUtilities()])
  return (
    <div className="mx-auto max-w-[820px] space-y-6">
      <PageHeader title="Settings" sub="Housemates, access, and utility setup" />

      <div className="space-y-3">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">Housemates</h2>
          <p className="text-[13px] text-ink-2">
            Email controls sign-in access; Venmo username powers request links.
          </p>
        </div>
        <div className="grid gap-3 rail:grid-cols-2">
          {mates.map(m => (
            <Card key={m.id}>
              <form action={updateHousemate} className="flex flex-col gap-3">
                <input type="hidden" name="id" value={m.id} />
                <div className="flex items-center gap-3">
                  <Avatar name={m.name} />
                  <span className="text-sm font-semibold text-ink">{m.name}</span>
                </div>
                <label className="flex flex-col gap-1">
                  <span className={labelClass}>Name</span>
                  <input name="name" defaultValue={m.name} className={fieldClass} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelClass}>Email</span>
                  <input name="email" defaultValue={m.email} className={fieldClass} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelClass}>Venmo username</span>
                  <input
                    name="venmoUsername"
                    defaultValue={m.venmoUsername ?? ''}
                    placeholder="venmo username"
                    className={fieldClass}
                  />
                </label>
                <button className="self-start rounded-full border border-accent/50 px-4 py-1.5 text-[13px] font-medium text-accent transition-colors duration-150 hover:bg-accent/10">
                  Save
                </button>
              </form>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">Utilities</h2>
          <p className="text-[13px] text-ink-2">
            Give a utility a fixed amount and its bill is added for you when a cycle starts.
          </p>
        </div>
        <div className="grid gap-3 rail:grid-cols-2">
          {utils.map(u => {
            const owner = u.ownerId != null ? mates.find(m => m.id === u.ownerId) : undefined
            return (
              <Card key={u.id}>
                <form action={updateUtility} className="flex flex-col gap-3">
                  <input type="hidden" name="id" value={u.id} />
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="text-accent"><UtilityIcon name={u.name} size={16} /></span>
                      <span className="truncate text-sm font-semibold text-ink">{u.name}</span>
                    </span>
                    {u.portalUrl && (
                      <a
                        href={u.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1.5 text-[13px] text-accent transition-colors duration-150 hover:text-[#c2d8a4]"
                      >
                        portal <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                  <label className="flex flex-col gap-1">
                    <span className={labelClass}>Name</span>
                    <input name="name" defaultValue={u.name} className={fieldClass} required />
                  </label>
                  {u.ownerId != null ? (
                    <div className="flex flex-col gap-1">
                      <span className={labelClass}>Split</span>
                      <input type="hidden" name="splitMethod" value={u.splitMethod} />
                      <span className="text-sm text-ink-2">
                        Personal — {owner ? owner.name.split(' ')[0] : 'its owner'} pays all of it
                      </span>
                    </div>
                  ) : (
                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>Split</span>
                      <select name="splitMethod" defaultValue={u.splitMethod} className={fieldClass}>
                        <option value="even">Evenly</option>
                        <option value="person_day">By days at home</option>
                      </select>
                    </label>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>Fixed amount</span>
                      <div className={`flex items-baseline gap-1 ${fieldClass}`}>
                        <span className="text-ink-2">$</span>
                        <input
                          name="fixedAmount"
                          defaultValue={u.fixedAmountCents != null ? (u.fixedAmountCents / 100).toFixed(2) : ''}
                          placeholder="varies"
                          inputMode="decimal"
                          className="w-full min-w-0 bg-transparent tabular-nums text-ink outline-none placeholder:text-ink-3"
                        />
                      </div>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>Billed</span>
                      <select name="intervalMonths" defaultValue={u.intervalMonths} className={fieldClass}>
                        {Array.from({ length: MAX_INTERVAL_MONTHS }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>
                            {n === 1 ? 'Every month' : `Every ${n} months`}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="text-xs text-ink-3">
                    {u.fixedAmountCents != null
                      ? `${formatCents(u.fixedAmountCents)} is added when a cycle starts, ${
                          u.intervalMonths === 1 ? 'every month' : `every ${u.intervalMonths} months`
                        }.`
                      : 'Leave the amount blank for a bill that changes each time; you enter those yourself.'}
                  </p>
                  <label className="flex flex-col gap-1">
                    <span className={labelClass}>Portal link</span>
                    <input
                      name="portalUrl"
                      type="url"
                      defaultValue={u.portalUrl ?? ''}
                      placeholder="https://"
                      className={fieldClass}
                    />
                  </label>
                  <button className="self-start rounded-full border border-accent/50 px-4 py-1.5 text-[13px] font-medium text-accent transition-colors duration-150 hover:bg-accent/10">
                    Save
                  </button>
                </form>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
