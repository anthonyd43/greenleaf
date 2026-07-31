import { UtilityIcon } from '@/components/ui/utility-icon'

export function IconSquare({ name }: { name: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-raised text-mint">
      <UtilityIcon name={name} size={18} />
    </div>
  )
}
