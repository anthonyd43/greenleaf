'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [dark, setDark] = useState(true)
  useEffect(() => setDark(document.documentElement.classList.contains('dark')), [])
  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    document.cookie = `theme=${next ? 'dark' : 'light'}; path=/; max-age=31536000; samesite=lax`
  }
  return (
    <button onClick={toggle} aria-label="Toggle theme"
      className="rounded-lg p-2 text-ink-2 hover:bg-raised hover:text-ink">
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
