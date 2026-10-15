'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, PartyPopper, RotateCcw, Share2 } from 'lucide-react'
import type { Dhikr } from '@/lib/adhkar'
import { toArabicNumber } from '@/lib/quran'
import { cn } from '@/lib/utils'
import { usePinchZoom } from '@/lib/use-pinch-zoom'

const AUTO_SCROLL_KEY = 'dhikr-auto-scroll'
const FONT_KEY = 'dhikr-font-size'
const DEFAULT_FONT = 22
const NEXT_DELAY_SECONDS = 4

export function DhikrList({
  items,
  nextHref,
  nextTitle,
}: {
  items: Dhikr[]
  nextHref?: string
  nextTitle?: string
}) {
  const router = useRouter()
  // حجم نص الذكر: يُحفظ محلياً، ويتغير بإصبعين
  const [fontSize, setFontSize] = useState(DEFAULT_FONT)
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(FONT_KEY))
      if (saved) setFontSize(saved)
    } catch {}
  }, [])
  const pinch = usePinchZoom<HTMLDivElement>(
    fontSize,
    (v) => {
      setFontSize(v)
      try {
        localStorage.setItem(FONT_KEY, String(v))
      } catch {}
    },
    [],
    16,
    40,
  )
  const [counts, setCounts] = useState<number[]>(() => items.map(() => 0))
  const [autoScroll, setAutoScroll] = useState(true)
  const [justCompleted, setJustCompleted] = useState<number | null>(null)
  const [cancelledNext, setCancelledNext] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(NEXT_DELAY_SECONDS)
  const refs = useRef<(HTMLElement | null)[]>([])
  const doneRef = useRef<HTMLDivElement | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // تحميل الإعداد
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTO_SCROLL_KEY)
      if (saved !== null) setAutoScroll(saved === 'true')
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(AUTO_SCROLL_KEY, String(autoScroll))
    } catch {}
  }, [autoScroll])

  // تنظيف المؤقتات عند مغادرة الصفحة
  useEffect(() => {
    const list = timers.current
    return () => list.forEach(clearTimeout)
  }, [])

  const done = counts.filter((c, i) => c >= items[i].count).length
  const allDone = items.length > 0 && done === items.length

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms))
  }

  const vibrate = (pattern: number | number[]) => {
    try {
      if ('vibrate' in navigator) navigator.vibrate(pattern)
    } catch {}
  }
  // أنماط مميزة: إتمام الذكر، والانتقال للذكر التالي، والانتقال للقسم التالي
  const BUZZ_DONE = [30, 50, 30]
  const BUZZ_NEXT = [120]
  const BUZZ_CATEGORY = [150, 100, 150, 100, 150]

  /** أول ذكر غير مكتمل بعد الموضع i، وإن لم يوجد فأول غير مكتمل قبله */
  const nextIncomplete = (from: number, current: number[]) => {
    for (let k = from + 1; k < items.length; k++) if (current[k] < items[k].count) return k
    for (let k = 0; k < from; k++) if (current[k] < items[k].count) return k
    return -1
  }

  const tap = (i: number) => {
    const before = counts[i]
    if (before >= items[i].count) return

    const next = counts.map((c, j) => (j === i ? c + 1 : c))
    setCounts(next)

    const justDone = next[i] >= items[i].count
    if (!justDone) {
      vibrate(15)
      return
    }

    // اكتمل هذا الذكر: تأثير بصري واهتزاز
    setJustCompleted(i)
    later(() => setJustCompleted(null), 1000)
    vibrate(BUZZ_DONE)

    if (!autoScroll) return

    const target = nextIncomplete(i, next)
    later(() => {
      if (target >= 0) {
        refs.current[target]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        vibrate(BUZZ_NEXT) // تنبيه بتغيير الذكر
      } else {
        // اكتملت كل الأذكار: انزل إلى بطاقة الإتمام
        doneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        vibrate(BUZZ_NEXT)
      }
    }, 450)
  }

  const reset = () => {
    setCounts(items.map(() => 0))
    setCancelledNext(false)
    setSecondsLeft(NEXT_DELAY_SECONDS)
  }

  // ===== الانتقال التلقائي إلى القسم التالي بعد إتمام الكل =====
  // نحفظ الموجّه في مرجع: كائن الموجّه قد يتغير مع كل عرض، وكان ذلك يُعيد ضبط المؤقت باستمرار فلا ينتقل أبدًا
  const routerRef = useRef(router)
  routerRef.current = router
  const goNext = useCallback(() => {
    if (!nextHref) return
    try {
      if ('vibrate' in navigator) navigator.vibrate(BUZZ_CATEGORY)
    } catch {}
    routerRef.current.push(nextHref)
  }, [nextHref])

  useEffect(() => {
    if (!allDone || !autoScroll || !nextHref || cancelledNext) return
    setSecondsLeft(NEXT_DELAY_SECONDS)
    const tick = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    const go = setTimeout(goNext, NEXT_DELAY_SECONDS * 1000)
    return () => {
      clearInterval(tick)
      clearTimeout(go)
    }
  }, [allDone, autoScroll, nextHref, cancelledNext, goNext])

  const share = async (d: Dhikr) => {
    const text = `${d.text}\n\n${d.source}`
    try {
      if (navigator.share) await navigator.share({ text })
      else await navigator.clipboard.writeText(text)
    } catch {}
  }

  return (
    <div ref={pinch.ref} className="flex flex-col gap-3">
      {/* ============ الشريط العلوي ============ */}
      <div className="sticky top-0 z-10 -mx-4 flex flex-col gap-2 bg-background/90 px-4 py-2 backdrop-blur">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {`أنجزت ${toArabicNumber(done)} من ${toArabicNumber(items.length)}`}
          </p>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            {'إعادة'}
          </button>
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
          <span className="text-xs font-medium">{'الانتقال التلقائي للذكر التالي ثم للقسم التالي'}</span>
          <span
            className={cn(
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
              autoScroll ? 'bg-gold' : 'bg-muted-foreground/30',
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
                autoScroll ? '-translate-x-4' : '-translate-x-1',
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
              <p className="font-quran leading-loose" style={{ fontSize: pinch.size }}>{d.text}</p>
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
                  complete ? 'bg-secondary text-primary' : 'bg-primary text-primary-foreground',
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

      {/* ============ بطاقة الإتمام والانتقال للقسم التالي ============ */}
      {allDone && (
        <div
          ref={doneRef}
          role="status"
          className="flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-700 p-5 text-center text-white shadow-lg"
        >
          <PartyPopper className="size-8" aria-hidden="true" />
          <p className="text-lg font-bold">{'تقبّل الله منك، أتممت هذا القسم'}</p>

          {nextHref ? (
            <>
              <p className="text-sm opacity-90">
                {autoScroll && !cancelledNext
                  ? `الانتقال إلى «${nextTitle}» بعد ${toArabicNumber(secondsLeft)} ثوانٍ`
                  : `القسم التالي: ${nextTitle}`}
              </p>
              <div className="flex w-full gap-2">
                <button
                  type="button"
                  onClick={goNext}
                  className="flex-1 rounded-xl bg-white py-2.5 text-sm font-bold text-emerald-700"
                >
                  {'الانتقال الآن'}
                </button>
                {autoScroll && !cancelledNext && (
                  <button
                    type="button"
                    onClick={() => setCancelledNext(true)}
                    className="flex-1 rounded-xl bg-white/20 py-2.5 text-sm font-medium"
                  >
                    {'البقاء هنا'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm opacity-90">{'هذا آخر قسم من الأذكار والأدعية'}</p>
          )}
        </div>
      )}
    </div>
  )
}
