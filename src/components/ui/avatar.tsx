export function Avatar({ name, me = false, size = 36 }: { name: string; me?: boolean; size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${
        me ? 'bg-mint text-mint-ink' : 'bg-raised text-mint'
      }`}
    >
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  )
}
