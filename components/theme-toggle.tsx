'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

/** بطاقة تبديل الوضع الداكن، بنفس شكل بطاقات الشبكة */
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
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-card p-3 py-4 text-center shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        {isDark ? <Sun className="size-5" aria-hidden="true" /> : <Moon className="size-5" aria-hidden="true" />}
      </span>
      <span className="line-clamp-2 block text-sm font-bold leading-snug">{isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>
      <span className="line-clamp-1 block text-[11px] text-muted-foreground">تبديل مظهر التطبيق</span>
    </button>
  )
}
