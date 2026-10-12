'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    let dark = false
    try {
      dark = localStorage.getItem('theme') === 'dark'
    } catch {}
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      className="flex items-center gap-3 rounded-2xl bg-card p-3 text-right shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        {isDark ? <Sun className="size-5" aria-hidden="true" /> : <Moon className="size-5" aria-hidden="true" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>
        <span className="block text-[11px] text-muted-foreground">تبديل مظهر التطبيق</span>
      </span>
    </button>
  )
}
