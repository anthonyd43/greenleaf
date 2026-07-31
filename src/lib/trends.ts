export type TrendCycle = { cycleId: number; cycleNumber: number; label: string }

export type UtilityTrendData = {
  /** Oldest → newest, at most `limit` cycles. */
  cycles: TrendCycle[]
  /** Utility name → cents per cycle (aligned to `cycles`, 0 when absent), plus 'All'. */
  series: Record<string, number[]>
}

export function shapeUtilityTrends(
  cycles: { id: number; cycleNumber: number; label: string }[],
  bills: { cycleId: number; utilityName: string; amountCents: number; status: string }[],
  limit = 12,
): UtilityTrendData {
  const window = [...cycles]
    .sort((a, b) => a.cycleNumber - b.cycleNumber)
    .slice(-limit)
    .map(c => ({ cycleId: c.id, cycleNumber: c.cycleNumber, label: c.label }))
  const indexByCycleId = new Map(window.map((c, i) => [c.cycleId, i]))

  const series: Record<string, number[]> = { All: window.map(() => 0) }
  for (const b of bills) {
    if (b.status !== 'confirmed') continue
    const i = indexByCycleId.get(b.cycleId)
    if (i === undefined) continue
    series[b.utilityName] ??= window.map(() => 0)
    series[b.utilityName][i] += b.amountCents
    series.All[i] += b.amountCents
  }
  return { cycles: window, series }
}
