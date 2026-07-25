import { twMerge } from 'tailwind-merge';

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={twMerge('rounded-2xl border border-line bg-card p-5', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, badge }: { title: string; badge?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <h2 className="text-sm font-medium text-ink-2">{title}</h2>
      {badge}
    </div>
  );
}
