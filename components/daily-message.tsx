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
  
  // ✅ حالة لتخزين النص الاحتفالي الذي سيظهر عشوائياً
  const [celebrationText, setCelebrationText] = useState('بسم الله نبدأ 💖✨')

  useEffect(() => {
    if (!hydrated || !settings.showDailyMessage) return

    const timer = setTimeout(() => {
      // 1. اختيار رسالة عشوائية
      setMessage(getRandomMessage())
      
      // 2. اختيار نص احتفالي عشوائي للزر
      const buttonTexts = [
        'جزاك الله خيراً 🎊🎉',
        'بسم الله نبدأ 💖✨',
        'اللهم آمين، يوم مبارك 🌟',
        'تقبل الله 🤍'
      ]
      setCelebrationText(buttonTexts[Math.floor(Math.random() * buttonTexts.length)])
      
      setVisible(true)
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [hydrated, settings.showDailyMessage])

  if (!visible || !message || !settings.showDailyMessage) return null

  const close = () => setVisible(false)

  const share = async () => {
    const text = `${message.text}\n${message.source}\n\nمن تطبيق إسلامي ✨`
    try {
      if (navigator.share) await navigator.share({ text })
      else {
        await navigator.clipboard.writeText(text)
        alert('تم نسخ الرسالة للمشاركة!')
      }
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
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#fdfbf7] px-5 pb-6 pt-8 text-center shadow-2xl ring-1 ring-[#b89965]/50 animate-in zoom-in-95 duration-300"
      >
        {/* زر الإغلاق العلوي */}
        <button
          type="button"
          onClick={close}
          aria-label="إغلاق"
          className="absolute left-3 top-3 flex size-8 items-center justify-center rounded-full bg-[#f4ece1] text-[#5a3e1b] hover:bg-[#e8dccb] transition-colors"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        {/* أيقونة الترحيب */}
        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-[#0a1f1a]/5 text-[#d4af37] ring-4 ring-[#d4af37]/20">
          <Sparkles className="size-7" />
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
        
        <p className="mt-4 text-xs font-bold text-[#b89965]">{message.source}</p>

        <div className="mt-6 flex flex-col gap-3 border-t border-[#b89965]/20 pt-5">
          {/* ✅ الزر الاحتفالي الكبير والمتغير */}
          <button
            type="button"
            onClick={close}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#0a1f1a] px-4 py-4 text-lg font-bold text-white shadow-xl shadow-[#0a1f1a]/30 transition-all hover:bg-[#12332b] active:scale-95"
          >
            {/* تأثير لمعان خلف الزر */}
            <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
              <div className="relative h-full w-12 bg-white/20" />
            </div>
            
            <span className="relative z-10 flex items-center gap-2">
              {celebrationText}
            </span>
          </button>

          <button
            type="button"
            onClick={share}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#f4ece1] px-4 py-3 text-xs font-bold text-[#5a3e1b] transition-colors hover:bg-[#e8dccb] active:scale-95"
          >
            <Share2 className="size-4" aria-hidden="true" />
            {'شارك الخير مع أصدقائك'}
          </button>
        </div>
      </div>
    </div>
  )
}