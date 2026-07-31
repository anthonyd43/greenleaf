'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ReceiptText, Layers, CalendarDays, Settings, LogOut } from 'lucide-react'
import { LeafLogo } from '@/components/ui/leaf-logo'

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

export function Sidebar({
  signOutAction,
  userInitial,
}: {
  signOutAction: () => Promise<void>
  userInitial?: string
}) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col items-center border-r border-line bg-sidebar py-5 rail:flex">
        <Link href="/" aria-label="Overview" className="mb-5">
          <LeafLogo size={26} veinColor="#10121d" />
        </Link>
        <nav className="flex flex-col gap-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                title={label}
                className={`flex h-11 w-11 items-center justify-center rounded-[14px] transition-colors duration-150 ${
                  active ? 'bg-mint text-mint-ink' : 'text-[#8d96a8] hover:bg-card hover:text-ink'
                }`}
              >
                <Icon size={18} strokeWidth={2} />
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto flex flex-col items-center gap-3">
          <form action={signOutAction}>
            <button
              type="submit"
              aria-label="Sign out"
              title="Sign out"
              className="flex h-11 w-11 items-center justify-center rounded-[14px] text-[#8d96a8] transition-colors duration-150 hover:bg-card hover:text-ink"
            >
              <LogOut size={18} strokeWidth={2} />
            </button>
          </form>
          {userInitial && (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-raised text-[13px] font-semibold text-mint">
              {userInitial}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-line bg-sidebar py-2 rail:hidden">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 text-[11px] ${
                active ? 'text-mint' : 'text-ink-2'
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
