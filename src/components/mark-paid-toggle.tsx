'use client'

import { useOptimistic, useTransition } from 'react'
import { togglePayment } from '@/lib/actions/cycle'

export function MarkPaidToggle({ paymentId, paid }: { paymentId: number; paid: boolean }) {
  const [optimisticPaid, setOptimisticPaid] = useOptimistic(paid)
  const [, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      setOptimisticPaid(!optimisticPaid)
      const fd = new FormData()
      fd.set('paymentId', String(paymentId))
      fd.set('field', 'paid')
      await togglePayment(fd)
    })
  }

  return optimisticPaid ? (
    <button type="button" onClick={toggle} className="text-[13px] font-medium text-accent hover:text-[#c2d8a4]">
      paid ✓
    </button>
  ) : (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-line px-3.5 py-1.5 text-xs font-medium text-ink-2 transition-colors duration-150 hover:border-accent/40 hover:text-ink"
    >
      mark paid
    </button>
  )
}
