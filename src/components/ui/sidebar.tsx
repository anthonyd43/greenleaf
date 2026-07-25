'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ReceiptText, Layers, CalendarDays, Settings, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/bills', label: 'Bills', icon: ReceiptText },
  { href: '/cycles', label: 'Cycles', icon: Layers },
  { href: '/absences', label: 'Absences', icon: CalendarDays },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== '/' && pathname.startsWith(href))
}

export function Sidebar({ signOutAction }: { signOutAction: () => Promise<void> }) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden md:flex sticky top-0 w-56 h-dvh flex-col gap-1 border-r border-line bg-card p-4">
        <div className="mb-4 flex items-center gap-2 px-3 font-bold text-ink">
          <span className="text-accent">🌿</span> greenleaf
        </div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={
                active
                  ? 'flex items-center gap-3 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white shadow-glow'
                  : 'flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-2 hover:bg-raised hover:text-ink'
              }
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
        <div className="mt-auto flex flex-col gap-1">
          <ThemeToggle />
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-2 hover:bg-raised hover:text-ink"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-line bg-card py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 text-[11px] ${
                active ? 'text-accent' : 'text-ink-2'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
