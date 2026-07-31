export function PageHeader({
  title,
  sub,
  action,
}: {
  title: string
  sub?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-[26px] font-semibold leading-tight text-ink">{title}</h1>
        {sub && <p className="mt-1 text-[13px] text-ink-2">{sub}</p>}
      </div>
      {action && <div className="min-w-0">{action}</div>}
    </div>
  )
}
