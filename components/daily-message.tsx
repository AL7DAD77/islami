'use client'

import { useEffect, useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import { getRandomMessage, type DailyMessage } from '@/lib/daily-messages'

export function DailyMessageModal() {
  const [message, setMessage] = useState<DailyMessage | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
  const timer = setTimeout(() => {
    setMessage(getRandomMessage())
    setVisible(true)
  }, 1500)

  return () => clearTimeout(timer)
}, [])

  const close = () => setVisible(false)

  if (!visible || !message) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-message-title"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 to-white shadow-2xl ring-1 ring-emerald-200 dark:from-zinc-900 dark:to-zinc-800 dark:ring-emerald-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* زر الإغلاق */}
        <button
          type="button"
          onClick={close}
          aria-label="إغلاق"
          className="absolute top-3 left-3 flex size-9 items-center justify-center rounded-full bg-white/80 text-zinc-600 shadow-sm transition hover:bg-white dark:bg-zinc-800/80 dark:text-zinc-300"
        >
          <X className="size-4" />
        </button>

        {/* الأيقونة */}
        <div className="flex justify-center pt-8">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
            <Sparkles className="size-8 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        {/* العنوان */}
        <div className="px-6 pt-4 text-center">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {message.type === 'ayah' ? 'آية اليوم' : message.type === 'hadith' ? 'حديث اليوم' : 'دعاء اليوم'}
          </p>
        </div>

        {/* النص */}
        <div className="px-6 py-5 text-center">
          <p
            id="daily-message-title"
            className={`text-lg leading-loose text-zinc-800 dark:text-zinc-100 ${
              message.type === 'ayah' ? 'font-quran text-xl' : 'font-medium'
            }`}
          >
            {message.text}
          </p>
          <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
            {message.source}
          </p>
        </div>

        {/* زر الإغلاق السفلي */}
        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={close}
            className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            جزاك الله خيراً
          </button>
        </div>
      </div>
    </div>
  )
}