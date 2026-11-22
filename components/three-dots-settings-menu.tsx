'use client'

import { useEffect, useState } from 'react'
import { MoreVertical, X } from 'lucide-react'
import { AppSettingsPanel } from './app-settings-panel'
import { cn } from '@/lib/utils'

export function ThreeDotsSettingsMenu({
  className,
}: {
  className?: string
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <div dir="rtl" className={cn('relative inline-flex items-center', className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((prev) => !prev)
        }}
        aria-label="خيارات وإعدادات التطبيق"
        aria-expanded={open}
        className="flex size-10 items-center justify-center rounded-full border transition-colors hover:bg-black/5 active:scale-95"
      >
        <MoreVertical className="size-5" />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-70 flex items-start justify-center bg-black/40 p-3 pt-16 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[82dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border bg-background shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur-md">
              <span className="text-sm font-bold">قائمة الإعدادات السريعة</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="إغلاق القائمة"
                className="flex size-8 items-center justify-center rounded-full border transition-colors hover:bg-black/5"
              >
                <X className="size-4" />
              </button>
            </div>

            <AppSettingsPanel />
          </div>
        </div>
      )}
    </div>
  )
}
