'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type LabelListEntry,
  type TooltipContentProps,
} from 'recharts'
import { Card, CardHeader } from '@/components/ui/card'
import { formatCents } from '@/lib/money'

type TrendPoint = { label: string; cycleNumber: number; totalCents: number; selected: boolean }

function TrendTip({ active, payload }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as TrendPoint | undefined
  if (!point) return null
  return (
    <div className="rounded-lg border border-line bg-card px-3 py-2 text-xs">
      <div className="text-ink-2">{point.label}</div>
      <div className="font-medium text-ink">{formatCents(point.totalCents)}</div>
    </div>
  )
}

export function SpendingTrend({ data }: { data: TrendPoint[] }) {
  return (
    <Card>
      <CardHeader title="Spending by cycle" />
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 20, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis
            dataKey="cycleNumber"
            tickFormatter={n => `#${n}`}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--ink-2)', fontSize: 11 }}
          />
          <YAxis hide />
          <Tooltip cursor={{ fill: 'var(--bg-raised, rgba(127,127,127,0.1))' }} content={<TrendTip />} />
          <Bar dataKey="totalCents" radius={[4, 4, 0, 0]} fill="var(--chart-muted)">
            {data.map(d => (
              <Cell key={d.cycleNumber} fill={d.selected ? 'var(--accent)' : 'var(--chart-muted)'} />
            ))}
            <LabelList
              valueAccessor={(entry: LabelListEntry<TrendPoint>) =>
                entry.payload.selected ? formatCents(entry.payload.totalCents) : ''
              }
              fill="var(--ink)"
              fontSize={11}
              position="top"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
