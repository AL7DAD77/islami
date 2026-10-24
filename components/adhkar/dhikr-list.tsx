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
    const child = container.children[index] as HTMLElement
    if (child) {
      child.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }

  const tap = (index: number) => {
    const item = items[index]
    if (!item) return

    const current = countsRef.current
    const before = current[index] ?? 0

    if (before >= item.count) return

    const next = items.map((_, itemIndex) =>
      itemIndex === index ? before + 1 : (current[itemIndex] ?? 0)
    )

    countsRef.current = next
    setCounts(next)

    if (next[index] < item.count) {
      vibrate(15)
      return
    }

    setJustCompleted(index)
    vibrate(BUZZ_DONE)

    later(() => {
      setJustCompleted((currentIndex) => (currentIndex === index ? null : currentIndex))
    }, 1000)

    if (!autoScrollRef.current) return

    later(() => {
      if (!autoScrollRef.current) return
      const target = nextIncomplete(index, countsRef.current)
      if (target >= 0) {
        scrollToCard(target)
      } else {
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current
          const endCard = container.children[items.length] as HTMLElement
          if (endCard) {
            endCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
          }
        }
      }
      vibrate(BUZZ_NEXT)
    }, 450)
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const width = target.clientWidth
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
    vibrate(BUZZ_CATEGORY)
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
    <div className="flex flex-col h-[calc(100dvh-120px)] w-full overflow-hidden select-none" dir="rtl">
      
      <div className="shrink-0 flex flex-col gap-2 bg-background/95 px-4 py-2 border-b border-border/50 z-10">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-primary">
            {`أنجزت ${toArabicNumber(done)} من ${toArabicNumber(items.length)}`}
          </p>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/80 transition-colors"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            {'إعادة'}
          </button>
        </div>
      </div>

      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
      >
        {items.map((dhikr, index) => {
          const count = counts[index] ?? 0
          const complete = count >= dhikr.count
          const isJustCompleted = justCompleted === index
          const progress = Math.min(1, count / dhikr.count)
          const circumference = 2 * Math.PI * 74 // نصف قطر الدائرة 74

          return (
            <div
              key={index}
              className="min-w-full h-full snap-center p-4 flex flex-col justify-between"
            >
              <div 
                ref={pinch.ref}
                className={cn(
                  "flex-1 overflow-y-auto overflow-x-hidden rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border transition-all duration-500 mb-2 custom-scrollbar",
                  complete && 'opacity-60',
                  isJustCompleted && 'ring-2 ring-primary shadow-lg scale-[0.99]'
                )}
              >
                <p className="font-quran leading-loose text-foreground text-center" style={{ fontSize: pinch.size }}>
                  {dhikr.text}
                </p>
                {dhikr.note && (
                  <p className="mt-4 rounded-xl bg-accent/60 p-3 text-sm leading-relaxed text-accent-foreground text-center">
                    {dhikr.note}
                  </p>
                )}
                <p className="mt-6 text-center text-xs text-muted-foreground">
                  {dhikr.source}
                </p>
              </div>

              {/* ============ المسبحة الإلكترونية (تصميم الدائرة) ============ */}
              <div className="shrink-0 flex items-center justify-center relative py-6">
                
                {/* زر المشاركة (يطفو على الجانب) */}
                <button
                  type="button"
                  onClick={() => share(dhikr)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex size-11 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm hover:bg-gray-50 transition-colors z-20 border border-border/50"
                  aria-label="مشاركة الذكر"
                >
                  <Share2 className="size-5" />
                </button>

                {/* الدائرة الكبيرة */}
                <button
                  type="button"
                  onClick={() => tap(index)}
                  disabled={complete}
                  className="relative flex flex-col items-center justify-center size-40 rounded-full group focus:outline-none z-10"
                >
                  {/* حلقة التقدم SVG */}
                  <svg className="absolute inset-0 size-full -rotate-90 pointer-events-none" viewBox="0 0 160 160">
                    <circle 
                      cx="80" cy="80" r="74" 
                      fill="none" 
                      stroke="var(--border)" 
                      strokeWidth="6" 
                    />
                    <circle 
                      cx="80" cy="80" r="74" 
                      fill="none" 
                      stroke="var(--primary)" 
                      strokeWidth="6" 
                      strokeDasharray={circumference} 
                      strokeDashoffset={circumference * (1 - progress)}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                    />
                  </svg>

                  {/* الجزء الداخلي (النقطة السوداء والعدد) */}
                  <div className="flex flex-col items-center justify-center size-32 rounded-full bg-card shadow-sm z-10 transition-transform group-active:scale-95 group-disabled:group-active:scale-100 border border-border/50">
                    {complete ? (
                      <div className="flex flex-col items-center text-primary">
                        <Check className="size-10 mb-1" />
                        <span className="text-xs font-bold">تم بحمد الله</span>
                      </div>
                    ) : (
                      <>
                        <div className="size-3 bg-[#1a1a1a] rounded-full mb-1" />
                        <span className="text-4xl font-bold text-foreground">{toArabicNumber(count)}</span>
                        <span className="text-[10px] text-muted-foreground mt-1">الهدف: {toArabicNumber(dhikr.count)} مرة</span>
                      </>
                    )}
                  </div>
                </button>

              </div>
            </div>
          )
        })}

        {allDone && (
          <div className="min-w-full h-full snap-center p-4 flex flex-col justify-center">
            <div
              ref={doneRef}
              role="status"
              className="flex flex-col items-center gap-5 rounded-3xl bg-gradient-to-l from-emerald-600 to-emerald-700 p-8 text-center text-white shadow-xl"
            >
              <PartyPopper className="size-14 text-gold animate-bounce" aria-hidden="true" />
              <p className="text-2xl font-bold">تقبّل الله منك، أتممت هذا القسم</p>
              
              {nextHref ? (
                <>
                  <p className="text-sm opacity-90">
                    {autoScroll && !cancelledNext
                      ? `الانتقال إلى «${nextTitle}» بعد ${toArabicNumber(secondsLeft)} ثوانٍ`
                      : `القسم التالي: ${nextTitle}`}
                  </p>
                  <div className="flex w-full gap-3 mt-4">
                    <button
                      type="button"
                      onClick={goNext}
                      className="flex-1 rounded-xl bg-white py-3.5 text-sm font-bold text-emerald-700 shadow-sm hover:bg-gray-50 transition-colors"
                    >
                      {'الانتقال الآن'}
                    </button>
                    {autoScroll && !cancelledNext && (
                      <button
                        type="button"
                        onClick={() => setCancelledNext(true)}
                        className="flex-1 rounded-xl bg-white/20 py-3.5 text-sm font-medium hover:bg-white/30 transition-colors"
                      >
                        {'البقاء هنا'}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm opacity-90">هذا آخر قسم من الأذكار والأدعية</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}