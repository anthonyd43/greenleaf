'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipContentProps } from 'recharts'
import { Card, CardHeader } from '@/components/ui/card'
import { formatCents } from '@/lib/money'

type UtilitySlice = { name: string; amountCents: number; slot: number }

function DonutTip({ active, payload }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload?.length) return null
  const slice = payload[0]?.payload as UtilitySlice | undefined
  if (!slice) return null
  return (
    <div className="rounded-lg border border-line bg-card px-3 py-2 text-xs">
      <div className="text-ink-2">{slice.name}</div>
      <div className="font-medium text-ink">{formatCents(slice.amountCents)}</div>
    </div>
  )
}

export function UtilityDonut({ data }: { data: UtilitySlice[] }) {
  const totalCents = data.reduce((a, d) => a + d.amountCents, 0)

  return (
    <Card>
      <CardHeader title="Where it went" />
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-2">No confirmed bills yet this cycle.</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative min-w-0 flex-1">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="amountCents"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="var(--bg-card)"
                  strokeWidth={2}
                >
                  {data.map(d => (
                    <Cell key={d.name} fill={`var(--cat-${d.slot})`} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-lg font-bold tabular-nums text-ink">{formatCents(totalCents)}</div>
              <div className="text-xs text-ink-2">total</div>
            </div>
          </div>
          <div className="flex w-40 shrink-0 flex-col gap-2">
            {data.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: `var(--cat-${d.slot})` }}
                />
                <span className="min-w-0 flex-1 truncate text-ink-2">{d.name}</span>
                <span className="tabular-nums text-ink">{formatCents(d.amountCents)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
