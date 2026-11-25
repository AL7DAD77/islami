'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Minus, PartyPopper, Plus, RotateCcw, Share2 } from 'lucide-react'
import type { Dhikr } from '@/lib/adhkar'
import { toArabicNumber } from '@/lib/quran'
import { cn } from '@/lib/utils'
import { usePinchZoom } from '@/lib/use-pinch-zoom'
import { useLanguage } from '@/lib/language-context'
import { useSettings } from '@/lib/settings'

const AUTO_SCROLL_KEY = 'dhikr-auto-scroll'
const FONT_KEY = 'dhikr-font-size'
const DEFAULT_FONT = 22
const MIN_FONT = 16
const MAX_FONT = 40
const NEXT_DELAY_SECONDS = 4

const BUZZ_DONE = [30, 50, 30]
const BUZZ_NEXT = [120]
const BUZZ_CATEGORY = [150, 100, 150, 100, 150]

function vibrate(pattern: number | number[], enabled: boolean) {
  if (!enabled) return
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  } catch {}
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
  const { dict, locale } = useLanguage()
  const isRtl = locale === 'ar'
  const [settings] = useSettings()
  const vibrationEnabled = settings.vibrationEnabled

  const [fontSize, setFontSize] = useState(DEFAULT_FONT)
  const [counts, setCounts] = useState<number[]>(() => items.map(() => 0))
  const [autoScroll, setAutoScroll] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [justCompleted, setJustCompleted] = useState<number | null>(null)
  const [cancelledNext, setCancelledNext] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(NEXT_DELAY_SECONDS)

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const doneRef = useRef<HTMLDivElement | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const countsRef = useRef<number[]>(items.map(() => 0))
  const autoScrollRef = useRef(true)
  const vibrationEnabledRef = useRef(vibrationEnabled)

  useEffect(() => {
    vibrationEnabledRef.current = vibrationEnabled
  }, [vibrationEnabled])

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

  useEffect(() => {
    try {
      const savedFont = Number(localStorage.getItem(FONT_KEY))
      if (Number.isFinite(savedFont) && savedFont >= MIN_FONT && savedFont <= MAX_FONT) {
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
    autoScrollRef.current = autoScroll
    try {
      localStorage.setItem(AUTO_SCROLL_KEY, String(autoScroll))
    } catch {}
  }, [autoScroll, settingsLoaded])

  const updateFontSize = useCallback((value: number) => {
    const clamped = Math.min(Math.max(Math.round(value), MIN_FONT), MAX_FONT)
    setFontSize(clamped)
    try {
      localStorage.setItem(FONT_KEY, String(clamped))
    } catch {}
  }, [])

  const pinch = usePinchZoom<HTMLDivElement>(
    fontSize,
    (value) => updateFontSize(value),
    [],
    MIN_FONT,
    MAX_FONT,
  )

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  const done = items.reduce(
    (total, item, index) => total + ((counts[index] ?? 0) >= item.count ? 1 : 0),
    0,
  )
  const allDone = items.length > 0 && done === items.length

  const nextIncomplete = (from: number, current: number[]) => {
    for (let index = from + 1; index < items.length; index++) {
      if ((current[index] ?? 0) < items[index].count) return index
    }
    for (let index = 0; index < from; index++) {
      if ((current[index] ?? 0) < items[index].count) return index
    }
    return -1
  }

  const scrollToCard = (index: number) => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const child = container.children[index] as HTMLElement | undefined
    if (child) {
      child.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
      if (index < items.length) {
        setActiveIndex(index)
      }
    }
  }

  const tap = (index: number) => {
    const item = items[index]
    if (!item) return

    const current = countsRef.current
    const before = current[index] ?? 0

    if (before >= item.count) return

    const next = items.map((_, itemIndex) =>
      itemIndex === index ? before + 1 : (current[itemIndex] ?? 0),
    )

    countsRef.current = next
    setCounts(next)

    if (next[index] < item.count) {
      vibrate(15, vibrationEnabledRef.current)
      return
    }

    setJustCompleted(index)
    vibrate(BUZZ_DONE, vibrationEnabledRef.current)

    later(() => {
      setJustCompleted((currentIndex) => (currentIndex === index ? null : currentIndex))
    }, 1000)

    if (!autoScrollRef.current) return

    later(() => {
      if (!autoScrollRef.current) return
      const target = nextIncomplete(index, countsRef.current)
      if (target >= 0) {
        scrollToCard(target)
      } else if (scrollContainerRef.current) {
        const container = scrollContainerRef.current
        const endCard = container.children[items.length] as HTMLElement | undefined
        if (endCard) {
          endCard.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
          })
        }
      }
      vibrate(BUZZ_NEXT, vibrationEnabledRef.current)
    }, 450)
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const width = target.clientWidth
    if (width <= 0) return
    const scrollLeft = Math.abs(target.scrollLeft)
    const newIndex = Math.round(scrollLeft / width)
    if (newIndex !== activeIndex && newIndex < items.length) {
      setActiveIndex(newIndex)
    }
  }

  const reset = () => {
    clearTimers()
    const initialCounts = items.map(() => 0)
    countsRef.current = initialCounts
    setCounts(initialCounts)
    setJustCompleted(null)
    setCancelledNext(false)
    setSecondsLeft(NEXT_DELAY_SECONDS)
    scrollToCard(0)
  }

  const goNext = useCallback(() => {
    if (!nextHref) return
    vibrate(BUZZ_CATEGORY, vibrationEnabledRef.current)
    router.push(nextHref)
  }, [nextHref, router])

  const goNextRef = useRef(goNext)

  useEffect(() => {
    goNextRef.current = goNext
  }, [goNext])

  useEffect(() => {
    if (!settingsLoaded || !allDone || !autoScroll || !nextHref || cancelledNext) return
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
  }, [settingsLoaded, allDone, autoScroll, nextHref, cancelledNext])

  const share = async (dhikr: Dhikr) => {
    const text = `${dhikr.text}\n\n${dhikr.source}`
    try {
      if (navigator.share) {
        await navigator.share({ text })
      } else {
        await navigator.clipboard.writeText(text)
      }
    } catch {}
  }

  return (
    <div
      className="flex h-[calc(100dvh-120px)] min-h-0 w-full select-none flex-col overflow-hidden bg-background text-foreground"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* الشريط العلوي: الإنجاز والتحكم بالخط وإعادة الضبط */}
      <div className="z-10 flex shrink-0 flex-col gap-2 border-b border-border/60 bg-background/95 px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-foreground">
            {`${dict.dhikrList.completed} ${toArabicNumber(done)} ${dict.dhikrList.of} ${toArabicNumber(items.length)}`}
          </p>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center rounded-full border border-border bg-card px-1 py-0.5">
              <button
                type="button"
                onClick={() => updateFontSize(fontSize - 2)}
                disabled={fontSize <= MIN_FONT}
                aria-label="تصغير الخط"
                className="flex size-6 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:opacity-40"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="px-1 text-[11px] font-bold text-foreground">
                {toArabicNumber(fontSize)}
              </span>
              <button
                type="button"
                onClick={() => updateFontSize(fontSize + 2)}
                disabled={fontSize >= MAX_FONT}
                aria-label="تكبير الخط"
                className="flex size-6 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:opacity-40"
              >
                <Plus className="size-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {dict.dhikrList.reset}
            </button>
          </div>
        </div>
      </div>

      {/* حاوية بطاقات الأذكار الأفقية */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
      >
        {items.map((dhikr, index) => {
          const count = counts[index] ?? 0
          const complete = count >= dhikr.count
          const isJustCompleted = justCompleted === index
          const progress = Math.min(1, count / dhikr.count)
          const circumference = 2 * Math.PI * 74

          return (
            <div
              key={`${index}-${dhikr.source}`}
              className="flex h-full min-h-0 w-full min-w-full shrink-0 snap-center flex-col justify-between overflow-hidden p-4"
            >
              {/* بطاقة الذكر المستقلة دون تمدد خارج الشاشة */}
              <div
                ref={index === activeIndex ? pinch.ref : undefined}
                className={cn(
                  'custom-scrollbar mb-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-3xl border border-border bg-card p-5 shadow-sm transition-all duration-500',
                  complete && 'opacity-70',
                  isJustCompleted && 'scale-[0.99] ring-2 ring-foreground shadow-lg',
                )}
              >
                <p
                  className="whitespace-pre-line text-center font-quran leading-loose text-foreground"
                  style={{ fontSize: index === activeIndex ? pinch.size : fontSize }}
                >
                  {dhikr.text}
                </p>
                {dhikr.note && (
                  <p className="mt-4 rounded-xl bg-muted/80 p-3 text-center text-sm leading-relaxed text-foreground">
                    {dhikr.note}
                  </p>
                )}
                <p className="mt-6 text-center text-xs text-muted-foreground">
                  {dhikr.source}
                </p>
              </div>

              {/* المسبحة والعداد الدائري أسفل كل ذكر مباشرة */}
              <div className="relative flex shrink-0 items-center justify-center py-3">
                <button
                  type="button"
                  onClick={() => share(dhikr)}
                  className="absolute right-2 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted"
                  aria-label={dict.dhikrList.shareDhikr}
                >
                  <Share2 className="size-5" />
                </button>

                <button
                  type="button"
                  onClick={() => tap(index)}
                  disabled={complete}
                  aria-label={`${dict.dhikrList.goal}: ${toArabicNumber(dhikr.count)}`}
                  className="group relative z-10 flex size-36 items-center justify-center rounded-full focus:outline-none sm:size-40"
                >
                  <svg
                    className="pointer-events-none absolute inset-0 size-full -rotate-90"
                    viewBox="0 0 160 160"
                  >
                    <circle
                      cx="80"
                      cy="80"
                      r="74"
                      fill="none"
                      stroke="currentColor"
                      className="text-border"
                      strokeWidth="6"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="74"
                      fill="none"
                      stroke="currentColor"
                      className="text-foreground"
                      strokeWidth="6"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference * (1 - progress)}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                    />
                  </svg>

                  <div className="z-10 flex size-28 flex-col items-center justify-center rounded-full border border-border/60 bg-card shadow-sm transition-transform group-active:scale-95 group-disabled:group-active:scale-100 sm:size-32">
                    {complete ? (
                      <div className="flex flex-col items-center text-foreground">
                        <Check className="mb-1 size-10" />
                        <span className="text-xs font-bold">{dict.dhikrList.done}</span>
                      </div>
                    ) : (
                      <>
                        <div className="mb-1 size-3 rounded-full bg-foreground" />
                        <span className="text-4xl font-bold text-foreground">
                          {toArabicNumber(count)}
                        </span>
                        <span className="mt-1 text-[10px] text-muted-foreground">
                          {`${dict.dhikrList.goal}: ${toArabicNumber(dhikr.count)} ${dict.dhikrList.time}`}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          )
        })}

        {/* بطاقة إتمام القسم */}
        {allDone && (
          <div className="flex h-full min-w-full shrink-0 snap-center flex-col justify-center p-4">
            <div
              ref={doneRef}
              role="status"
              className="flex flex-col items-center gap-5 rounded-3xl bg-linear-to-l from-emerald-600 to-emerald-700 p-8 text-center text-white shadow-xl"
            >
              <PartyPopper className="size-14 animate-bounce text-white" aria-hidden="true" />
              <p className="text-2xl font-bold">
                {locale === 'ar'
                  ? 'تقبّل الله منك، أتممت هذا القسم'
                  : 'May Allah accept from you, you completed this section'}
              </p>

              {nextHref ? (
                <>
                  <p className="text-sm opacity-90">
                    {autoScroll && !cancelledNext
                      ? `${dict.dhikrList.nextIn} «${nextTitle}» ${dict.dhikrList.after} ${toArabicNumber(secondsLeft)} ${dict.dhikrList.seconds}`
                      : `${locale === 'ar' ? 'القسم التالي' : 'Next section'}: ${nextTitle}`}
                  </p>
                  <div className="mt-4 flex w-full gap-3">
                    <button
                      type="button"
                      onClick={goNext}
                      className="flex-1 rounded-xl bg-white py-3.5 text-sm font-bold text-emerald-700 shadow-sm transition-colors hover:bg-gray-50"
                    >
                      {dict.dhikrList.goNow}
                    </button>
                    {autoScroll && !cancelledNext && (
                      <button
                        type="button"
                        onClick={() => setCancelledNext(true)}
                        className="flex-1 rounded-xl bg-white/20 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/30"
                      >
                        {dict.dhikrList.stayHere}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm opacity-90">{dict.dhikrList.lastSection}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
