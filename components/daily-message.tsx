'use client'

import { useEffect, useState } from 'react'
import { X, Share2 } from 'lucide-react'
import { getRandomMessage, type DailyMessage } from '@/lib/daily-messages'
import { useHydrated, useSettings } from '@/lib/settings'

const SHOWN_KEY = 'daily-msg-shown-date'

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/** نافذة مختصرة تظهر مرة واحدة في اليوم، ويمكن إيقافها من صفحة المزيد */
export function DailyMessageModal() {
  const hydrated = useHydrated()
  const [settings] = useSettings()
  const [message, setMessage] = useState<DailyMessage | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!hydrated || !settings.showDailyMessage) return
    let shownToday = false
    try {
      shownToday = localStorage.getItem(SHOWN_KEY) === today()
    } catch {}
    if (shownToday) return
    const timer = setTimeout(() => {
      setMessage(getRandomMessage())
      setVisible(true)
      try {
        localStorage.setItem(SHOWN_KEY, today())
      } catch {}
    }, 1500)
    return () => clearTimeout(timer)
  }, [hydrated, settings.showDailyMessage])

  if (!visible || !message || !settings.showDailyMessage) return null

  const close = () => setVisible(false)

  const share = async () => {
    const text = `${message.text}\n${message.source}`
    try {
      if (navigator.share) await navigator.share({ text })
      else await navigator.clipboard.writeText(text)
    } catch {}
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-6"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-message-title"
    >
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl bg-background px-5 pb-4 pt-8 text-center shadow-xl ring-1 ring-border"
      >
        <button
          type="button"
          onClick={close}
          aria-label="إغلاق"
          className="absolute left-2 top-2 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <p className="text-xs font-bold text-primary">
          {message.type === 'ayah' ? 'آية اليوم' : message.type === 'hadith' ? 'حديث اليوم' : 'دعاء اليوم'}
        </p>
        <p
          id="daily-message-title"
          className={`mt-3 leading-loose ${message.type === 'ayah' ? 'font-quran text-lg' : 'text-base'}`}
        >
          {message.text}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">{message.source}</p>

        <button
          type="button"
          onClick={share}
          className="mx-auto mt-4 flex items-center gap-1.5 rounded-full bg-muted px-4 py-1.5 text-xs font-medium"
        >
          <Share2 className="size-3.5" aria-hidden="true" />
          {'مشاركة'}
        </button>
      </div>
    </div>
  )
}
