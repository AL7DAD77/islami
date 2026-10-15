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

const BUZZ_DONE = [30, 50, 30]
const BUZZ_NEXT = [120]
const BUZZ_CATEGORY = [150, 100, 150, 100, 150]

function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  } catch {}
}

function moveToElement(element: HTMLElement | null) {
  if (!element) return

  try {
    element.scrollIntoView({
      behavior: 'instant',
      block: 'start',
      inline: 'nearest',
    })
  } catch {
    element.scrollIntoView(true)
  }
}

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

  const [fontSize, setFontSize] = useState(DEFAULT_FONT)
  const [counts, setCounts] = useState<number[]>(() =>
    items.map(() => 0),
  )
  const [autoScroll, setAutoScroll] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [justCompleted, setJustCompleted] = useState<number | null>(null)
  const [cancelledNext, setCancelledNext] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(NEXT_DELAY_SECONDS)

  const refs = useRef<(HTMLElement | null)[]>([])
  const doneRef = useRef<HTMLDivElement | null>(null)
  const toolbarRef = useRef<HTMLDivElement | null>(null)

  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const countsRef = useRef<number[]>(items.map(() => 0))
  const autoScrollRef = useRef(true)

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => clearTimeout(timer))
    timers.current.clear()
  }, [])

  const later = useCallback((fn: () => void, ms: number) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer)
      fn()
    }, ms)

    timers.current.add(timer)
    return timer
  }, [])

  // تحميل الإعدادات قبل السماح بحفظها.
  useEffect(() => {
    try {
      const savedFont = Number(localStorage.getItem(FONT_KEY))

      if (Number.isFinite(savedFont) && savedFont >= 16 && savedFont <= 40) {
        setFontSize(savedFont)
      }

      const savedAutoScroll = localStorage.getItem(AUTO_SCROLL_KEY)
      const enabled = savedAutoScroll !== 'false'

      autoScrollRef.current = enabled
      setAutoScroll(enabled)
    } catch {
      autoScrollRef.current = true
      setAutoScroll(true)
    }

    setSettingsLoaded(true)
  }, [])

  useEffect(() => {
    if (!settingsLoaded) return

    try {
      localStorage.setItem(AUTO_SCROLL_KEY, String(autoScroll))
    } catch {}
  }, [autoScroll, settingsLoaded])

  const pinch = usePinchZoom<HTMLDivElement>(
    fontSize,
    (value) => {
      setFontSize(value)

      try {
        localStorage.setItem(FONT_KEY, String(value))
      } catch {}
    },
    [],
    16,
    40,
  )

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  const done = items.reduce(
    (total, item, index) =>
      total + ((counts[index] ?? 0) >= item.count ? 1 : 0),
    0,
  )

  const allDone = items.length > 0 && done === items.length

  const nextIncomplete = (from: number, current: number[]) => {
    for (let index = from + 1; index < items.length; index++) {
      if ((current[index] ?? 0) < items[index].count) {
        return index
      }
    }

    for (let index = 0; index < from; index++) {
      if ((current[index] ?? 0) < items[index].count) {
        return index
      }
    }

    return -1
  }

  const scrollToCard = (element: HTMLElement | null) => {
    if (!element) return

    const toolbarHeight = toolbarRef.current?.getBoundingClientRect().height ?? 100

    // مسافة أعلى البطاقة حتى لا يغطيها شريط التحكم.
    element.style.scrollMarginTop = `${Math.ceil(toolbarHeight + 24)}px`

    moveToElement(element)
  }

  const tap = (index: number) => {
    const item = items[index]
    if (!item) return

    const current = countsRef.current
    const before = current[index] ?? 0

    if (before >= item.count) return

    const next = items.map((_, itemIndex) =>
      itemIndex === index
        ? before + 1
        : (current[itemIndex] ?? 0),
    )

    // تحديث المرجع فورًا حتى لا تعتمد الضغطات السريعة على قيمة قديمة.
    countsRef.current = next
    setCounts(next)

    if (next[index] < item.count) {
      vibrate(15)
      return
    }

    setJustCompleted(index)
    vibrate(BUZZ_DONE)

    later(() => {
      setJustCompleted((currentIndex) =>
        currentIndex === index ? null : currentIndex,
      )
    }, 1000)

    if (!autoScrollRef.current) return

    later(() => {
      // احترام إلغاء الخيار أثناء فترة الانتظار.
      if (!autoScrollRef.current) return

      // إعادة حساب الهدف من أحدث قيم العدادات.
      const target = nextIncomplete(index, countsRef.current)

      if (target >= 0) {
        scrollToCard(refs.current[target] ?? null)
      } else {
        scrollToCard(doneRef.current)
      }

      vibrate(BUZZ_NEXT)
    }, 450)
  }

  const reset = () => {
    clearTimers()

    const initialCounts = items.map(() => 0)

    countsRef.current = initialCounts
    setCounts(initialCounts)
    setJustCompleted(null)
    setCancelledNext(false)
    setSecondsLeft(NEXT_DELAY_SECONDS)
  }

  const changeAutoScroll = (enabled: boolean) => {
    autoScrollRef.current = enabled
    setAutoScroll(enabled)
  }

  // الانتقال إلى القسم التالي.
  const goNext = useCallback(() => {
    if (!nextHref) return

    vibrate(BUZZ_CATEGORY)
    router.push(nextHref)
  }, [nextHref, router])

  // إبقاء مؤقت القسم مستقلاً عن تغير مرجع دالة التنقل.
  const goNextRef = useRef(goNext)

  useEffect(() => {
    goNextRef.current = goNext
  }, [goNext])

  useEffect(() => {
    if (
      !settingsLoaded ||
      !allDone ||
      !autoScroll ||
      !nextHref ||
      cancelledNext
    ) {
      return
    }

    setSecondsLeft(NEXT_DELAY_SECONDS)

    const tick = setInterval(() => {
      setSecondsLeft((seconds) => Math.max(0, seconds - 1))
    }, 1000)

    const go = setTimeout(() => {
      goNextRef.current()
    }, NEXT_DELAY_SECONDS * 1000)

    return () => {
      clearInterval(tick)
      clearTimeout(go)
    }
  }, [
    settingsLoaded,
    allDone,
    autoScroll,
    nextHref,
    cancelledNext,
  ])

  const share = async (dhikr: Dhikr) => {
    const text = `${dhikr.text}

${dhikr.source}`

    try {
      if (navigator.share) {
        await navigator.share({ text })
      } else {
        await navigator.clipboard.writeText(text)
      }
    } catch {}
  }

  return (
    <div ref={pinch.ref} className="flex flex-col gap-3">
      {/* الشريط العلوي */}
      <div
        ref={toolbarRef}
        className="sticky top-0 z-10 -mx-4 flex flex-col gap-2 bg-background/90 px-4 py-2 backdrop-blur"
      >
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
          <span className="text-xs font-medium">
            {'الانتقال التلقائي للذكر التالي ثم للقسم التالي'}
          </span>

          <span
            className={cn(
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
              autoScroll ? 'bg-gold' : 'bg-muted-foreground/30',
            )}
          >
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(event) => changeAutoScroll(event.target.checked)}
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

      {/* قائمة الأذكار */}
      {items.map((dhikr, index) => {
        const count = counts[index] ?? 0
        const complete = count >= dhikr.count
        const isJustCompleted = justCompleted === index

        return (
          <article
            key={index}
            ref={(element) => {
              refs.current[index] = element
            }}
            style={{ scrollMarginTop: 140 }}
            className={cn(
              'overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border transition-all duration-500',
              complete && 'opacity-60',
              isJustCompleted && 'ring-2 ring-gold shadow-lg',
            )}
          >
            <button
              type="button"
              onClick={() => tap(index)}
              disabled={complete}
              className="block w-full p-5 text-right"
              aria-label={`اضغط للعد: ${toArabicNumber(count)} من ${toArabicNumber(dhikr.count)}`}
            >
              <p
                className="font-quran leading-loose"
                style={{ fontSize: pinch.size }}
              >
                {dhikr.text}
              </p>

              {dhikr.note && (
                <p className="mt-3 rounded-xl bg-accent/60 p-3 text-sm leading-relaxed text-accent-foreground">
                  {dhikr.note}
                </p>
              )}
            </button>

            <div className="flex items-center gap-3 border-t px-5 py-3">
              <p className="flex-1 text-xs text-muted-foreground">
                {dhikr.source}
              </p>

              <button
                type="button"
                onClick={() => share(dhikr)}
                className="flex size-8 items-center justify-center rounded-full bg-muted"
                aria-label="مشاركة الذكر"
              >
                <Share2 className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => tap(index)}
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
                  `${toArabicNumber(count)} / ${toArabicNumber(dhikr.count)}`
                )}
              </button>
            </div>
          </article>
        )
      })}

      {/* بطاقة الإتمام */}
      {allDone && (
        <div
          ref={doneRef}
          role="status"
          style={{ scrollMarginTop: 140 }}
          className="flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-700 p-5 text-center text-white shadow-lg"
        >
          <PartyPopper className="size-8" aria-hidden="true" />

          <p className="text-lg font-bold">
            {'تقبّل الله منك، أتممت هذا القسم'}
          </p>

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
            <p className="text-sm opacity-90">
              {'هذا آخر قسم من الأذكار والأدعية'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}