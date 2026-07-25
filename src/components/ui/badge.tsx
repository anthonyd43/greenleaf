export type BadgeVariant = 'open' | 'finalized' | 'requested' | 'settled' | 'paid' | 'pending' | 'neutral';

const variantStyles: Record<BadgeVariant, string> = {
  open: 'text-accent bg-accent/10',
  finalized: 'text-info bg-info/10',
  requested: 'text-warning bg-warning/10',
  settled: 'text-accent bg-accent/10',
  paid: 'text-accent bg-accent/10',
  pending: 'text-ink-2 bg-raised',
  neutral: 'text-ink-2 bg-raised',
};

export function Badge({ variant, children }: { variant: BadgeVariant; children: React.ReactNode }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]}`}>
      {children}
    </span>
  );
}
