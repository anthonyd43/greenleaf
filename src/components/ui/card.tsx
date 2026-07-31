import { twMerge } from 'tailwind-merge'

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={twMerge('rounded-[20px] border border-line bg-card p-5', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ title, badge }: { title: string; badge?: React.ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-2">
      <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
      {badge}
    </div>
  )
}
