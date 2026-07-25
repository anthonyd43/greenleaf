import { ExternalLink } from 'lucide-react'
import { updateHousemate } from '@/lib/actions/settings'
import { listHousemates, listUtilities } from '@/lib/queries'
import { utilitySlot } from '@/lib/utility-slots'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'

export const dynamic = 'force-dynamic'

const fieldClass = 'rounded-lg border border-line bg-card px-3 py-2 text-sm'

export default async function SettingsPage() {
  const [mates, utils] = await Promise.all([listHousemates(), listUtilities()])
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />

      <div className="space-y-3">
        <div>
          <h2 className="font-semibold text-ink">Housemates</h2>
          <p className="text-sm text-ink-2">Email controls sign-in access; Venmo username powers request links.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {mates.map(m => (
            <Card key={m.id}>
              <form action={updateHousemate} className="flex flex-col gap-3">
                <input type="hidden" name="id" value={m.id} />
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-ink-2">Name</span>
                  <input name="name" defaultValue={m.name} className={fieldClass} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-ink-2">Email</span>
                  <input name="email" defaultValue={m.email} className={fieldClass} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-ink-2">Venmo username</span>
                  <input
                    name="venmoUsername"
                    defaultValue={m.venmoUsername ?? ''}
                    placeholder="venmo username"
                    className={fieldClass}
                  />
                </label>
                <button className="self-start rounded-lg bg-accent px-4 py-2 text-sm text-white shadow-glow">
                  Save
                </button>
              </form>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-ink">Utilities</h2>
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-2">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Split</th>
                <th className="px-5 py-3 font-medium">Portal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {utils.map(u => (
                <tr key={u.id}>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: `var(--cat-${utilitySlot(u.name, u.id)})` }}
                      />
                      <span className="text-ink">{u.name}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="neutral">
                      {u.ownerId ? 'personal — owner pays' : u.splitMethod === 'even' ? 'even' : 'person-day'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    {u.portalUrl ? (
                      <a
                        href={u.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-info hover:underline"
                      >
                        portal <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-ink-2">—</span>
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
