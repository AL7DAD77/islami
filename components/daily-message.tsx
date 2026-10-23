'use client'

import { useEffect, useState } from 'react'
import { X, Share2, Sparkles } from 'lucide-react'
import { getRandomMessage, type DailyMessage } from '@/lib/daily-messages'
import { useHydrated, useSettings } from '@/lib/settings'

/** نافذة ترحيبية تظهر في كل مرة يفتح فيها المستخدم التطبيق (إذا كانت مفعلة من الإعدادات) */
export function DailyMessageModal() {
  const hydrated = useHydrated()
  const [settings] = useSettings()
  const [message, setMessage] = useState<DailyMessage | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // إذا لم يتم تحميل الإعدادات بعد، أو كانت الميزة متوقفة، لا تفعل شيئاً
    if (!hydrated || !settings.showDailyMessage) return

    // ظهور الرسالة بعد ثانية ونصف من فتح التطبيق
    const timer = setTimeout(() => {
      setMessage(getRandomMessage())
      setVisible(true)
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [hydrated, settings.showDailyMessage])

  if (!visible || !message || !settings.showDailyMessage) return null

  const close = () => setVisible(false)

  const share = async () => {
    const text = `${message.text}\n${message.source}\n\nجزاك الله خيراً`
    try {
      if (navigator.share) await navigator.share({ text })
      else await navigator.clipboard.writeText(text)
    } catch {}
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-message-title"
    >
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#fdfbf7] px-5 pb-5 pt-8 text-center shadow-2xl ring-1 ring-[#b89965]/50 animate-in zoom-in-95 duration-300"
      >
        {/* زر الإغلاق */}
        <button
          type="button"
          onClick={close}
          aria-label="إغلاق"
          className="absolute left-3 top-3 flex size-8 items-center justify-center rounded-full bg-[#f4ece1] text-[#5a3e1b] hover:bg-[#e8dccb] transition-colors"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        {/* أيقونة الترحيب */}
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[#0a1f1a]/5 text-[#d4af37]">
          <Sparkles className="size-6" />
        </div>

        <p className="text-xs font-bold text-[#0a1f1a]/60">
          {message.type === 'ayah' ? 'آية اليوم' : message.type === 'hadith' ? 'حديث اليوم' : 'دعاء اليوم'}
        </p>
        
        <p
          id="daily-message-title"
          className={`mt-4 leading-loose text-[#0a1f1a] ${message.type === 'ayah' ? 'font-quran text-lg font-bold' : 'text-base font-medium'}`}
        >
          {message.text}
        </p>
        
        <p className="mt-4 text-xs text-[#0a1f1a]/50">{message.source}</p>

        {/* النص المفقود الذي أعدناه */}
        <p className="mt-5 text-sm font-bold text-[#d4af37]">
          جزاك الله خيراً
        </p>

        <div className="mt-5 flex items-center justify-center gap-2 border-t border-[#b89965]/20 pt-4">
          <button
            type="button"
            onClick={share}
            className="flex items-center gap-1.5 rounded-full bg-[#f4ece1] px-5 py-2 text-xs font-bold text-[#5a3e1b] hover:bg-[#e8dccb] transition-colors"
          >
            <Share2 className="size-4" aria-hidden="true" />
            {'مشاركة الخير'}
          </button>
        </div>
      </div>
    </div>
  )
}