import { Car, Droplet, Flame, ReceiptText, Trash2, Wifi, Zap, type LucideIcon } from 'lucide-react'

export function utilityIconFor(name: string): LucideIcon {
  const n = name.toLowerCase()
  if (n.includes('electric')) return Zap
  if (n.includes('gas')) return Flame
  if (n.includes('water')) return Droplet
  if (n.includes('internet') || n.includes('wifi')) return Wifi
  if (n.includes('garbage') || n.includes('trash')) return Trash2
  if (n.includes('ev') || n.includes('charg') || n.includes('car')) return Car
  return ReceiptText
}

export function UtilityIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = utilityIconFor(name)
  // eslint-disable-next-line react-hooks/static-components
  return <Icon size={size} strokeWidth={2} />
}
