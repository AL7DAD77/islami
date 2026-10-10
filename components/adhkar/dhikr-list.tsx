'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, RotateCcw, Share2 } from 'lucide-react'
import type { Dhikr } from '@/lib/adhkar'
import { toArabicNumber } from '@/lib/quran'
import { cn } from '@/lib/utils'

const AUTO_SCROLL_KEY = 'dhikr-auto-scroll'

export function DhikrList({ items }: { items: Dhikr[] }) {
  const [counts, setCounts] = useState<number[]>(() => items.map(() => 0))
  const [autoScroll, setAutoScroll] = useState(true)
  const [justCompleted, setJustCompleted] = useState<number | null>(null)
  const refs = useRef<(HTMLElement | null)[]>([])

  // ⚠️ تحميل الإعداد
  useEffect(() => {
    const saved = localStorage.getItem(AUTO_SCROLL_KEY)
    if (saved !== null) setAutoScroll(saved === 'true')
  }, [])

  // ⚠️ حفظ الإعداد
  useEffect(() => {
    localStorage.setItem(AUTO_SCROLL_KEY, String(autoScroll))
  }, [autoScroll])

  const done = counts.filter((c, i) => c >= items[i].count).length

  const tap = (i: number) => {
    setCounts((prev) => {
      const next = prev.map((c, j) => (j === i ? Math.min(c + 1, items[i].count) : c))

      // ⚠️ إذا اكتمل الذكر → انتقل للتالي
      const justDone = prev[i] < items[i].count && next[i] >= items[i].count
      if (justDone && autoScroll && i < items.length - 1) {
        // تأثير بصري
        setJustCompleted(i)
        setTimeout(() => setJustCompleted(null), 1000)

        // اهتزاز أقوى
        if ('vibrate' in navigator) navigator.vibrate([30, 50, 30])

        // ⚠️ التمرير للذكر التالي
        setTimeout(() => {
          refs.current[i + 1]?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }, 400)
      } else if ('vibrate' in navigator) {
        navigator.vibrate(15)
      }

      return next
    })
  }

  const share = async (d: Dhikr) => {
    const text = `${d.text}\n\n${d.source}`
    if (navigator.share) await navigator.share({ text }).catch(() => {})
    else await navigator.clipboard.writeText(text)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ============ الشريط العلوي ============ */}
      <div className="sticky top-0 z-10 -mx-4 flex flex-col gap-2 bg-background/90 px-4 py-2 backdrop-blur">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {`أنجزت ${toArabicNumber(done)} من ${toArabicNumber(items.length)}`}
          </p>
          <button
            type="button"
            onClick={() => setCounts(items.map(() => 0))}
            className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            {'إعادة'}
          </button>
        </div>

        {/* ⚠️ تبديل الانتقال التلقائي */}
        <label className="flex cursor-pointer items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
          <span className="text-xs font-medium">
            {'الانتقال التلقائي للذكر التالي'}
          </span>
          <span
            className={cn(
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
              autoScroll ? 'bg-gold' : 'bg-muted-foreground/30'
            )}
          >
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="sr-only"
            />
            <span
              className={cn(
                'inline-block size-4 transform rounded-full bg-white shadow transition-transform',
                autoScroll ? '-translate-x-4' : '-translate-x-1'
              )}
            />
          </span>
        </label>
      </div>

      {/* ============ قائمة الأذكار ============ */}
      {items.map((d, i) => {
        const complete = counts[i] >= d.count
        const isJustCompleted = justCompleted === i
        return (
          <article
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            className={cn(
              'overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border transition-all duration-500',
              complete && 'opacity-60',
              isJustCompleted && 'ring-2 ring-gold shadow-lg',
            )}
          >
            <button
              type="button"
              onClick={() => tap(i)}
              disabled={complete}
              className="block w-full p-5 text-right"
              aria-label={`اضغط للعد: ${toArabicNumber(counts[i])} من ${toArabicNumber(d.count)}`}
            >
              <p className="font-quran text-xl leading-loose">{d.text}</p>
              {d.note && (
                <p className="mt-3 rounded-xl bg-accent/60 p-3 text-sm leading-relaxed text-accent-foreground">
                  {d.note}
                </p>
              )}
            </button>
            <div className="flex items-center gap-3 border-t px-5 py-3">
              <p className="flex-1 text-xs text-muted-foreground">{d.source}</p>
              <button
                type="button"
                onClick={() => share(d)}
                className="flex size-8 items-center justify-center rounded-full bg-muted"
                aria-label="مشاركة الذكر"
              >
                <Share2 className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => tap(i)}
                disabled={complete}
                className={cn(
                  'flex h-9 min-w-16 items-center justify-center gap-1 rounded-full px-3 text-sm font-bold',
                  complete
                    ? 'bg-secondary text-primary'
                    : 'bg-primary text-primary-foreground',
                )}
              >
                {complete ? (
                  <Check className="size-4" aria-label="تم" />
                ) : (
                  `${toArabicNumber(counts[i])} / ${toArabicNumber(d.count)}`
                )}
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}