'use client'

import { useRouter } from 'next/navigation'

export function CycleSelector({ cycles, currentId }: {
  cycles: { id: number; cycleNumber: number; label: string }[]; currentId: number
}) {
  const router = useRouter()
  return (
    <select value={currentId} onChange={e => router.push(`/?cycle=${e.target.value}`)}
      aria-label="Select cycle"
      className="rounded-xl border border-line bg-card px-3 py-2 text-sm text-ink">
      {cycles.map(c => <option key={c.id} value={c.id}>#{c.cycleNumber} — {c.label}</option>)}
    </select>
  )
}
