export type BadgeVariant = 'open' | 'finalized' | 'requested' | 'settled' | 'paid' | 'pending' | 'neutral'

const variantStyles: Record<BadgeVariant, string> = {
  open: 'border border-mint/60 text-mint',
  finalized: 'border border-ink-3/50 text-ink-2',
  settled: 'border border-ink-3/50 text-ink-2',
  paid: 'border border-accent/50 bg-accent/10 text-accent',
  requested: 'border border-accent/40 text-accent',
  pending: 'border border-ink-3/50 text-ink-2',
  neutral: 'border border-line text-ink-2',
}

export function Badge({ variant, children }: { variant: BadgeVariant; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  )
}
