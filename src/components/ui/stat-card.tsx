import { Card } from './card';

export function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: React.ReactNode; accent?: boolean }) {
  return (
    <Card>
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-ink-2">{label}</div>
        <div className={`text-2xl font-bold tabular-nums ${accent ? 'text-accent' : ''}`}>{value}</div>
        {sub && <div className="text-xs text-ink-2">{sub}</div>}
      </div>
    </Card>
  );
}
