'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const dark = saved === 'dark'
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex w-full items-center gap-3 rounded-2xl border border-emerald-100 bg-white p-4 text-right shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <span className="text-3xl">{isDark ? '☀️' : '🌙'}</span>
      <div className="flex-1">
        <div className="font-semibold text-zinc-800 dark:text-zinc-100">
          {isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {isDark ? 'التبديل للوضع الفاتح' : 'التبديل للوضع الداكن'}
        </div>
      </div>
      <span className="text-zinc-400">‹</span>
    </button>
  )
}