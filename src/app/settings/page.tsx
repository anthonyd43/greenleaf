import { ExternalLink } from 'lucide-react'
import { updateHousemate } from '@/lib/actions/settings'
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
        <h2 className="text-[15px] font-semibold text-ink">Utilities</h2>
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-ink-2">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Split</th>
                <th className="px-5 py-3 font-medium">Portal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {utils.map(u => (
                <tr key={u.id}>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2.5">
                      <span className="text-accent"><UtilityIcon name={u.name} size={16} /></span>
                      <span className="font-medium text-ink">{u.name}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-ink-2">
                      {u.ownerId ? 'personal — owner pays' : u.splitMethod === 'even' ? 'even' : 'person-day'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {u.portalUrl ? (
                      <a
                        href={u.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[13px] text-accent transition-colors duration-150 hover:text-[#c2d8a4]"
                      >
                        portal <ExternalLink size={13} />
                      </a>
                    ) : (
                      <span className="text-ink-3">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
