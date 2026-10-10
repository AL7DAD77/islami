'use client'

import { useEffect, useState } from 'react'
import { RotateCcw, Check, ChevronRight } from 'lucide-react'
import { toArabicNumber } from '@/lib/quran'
import { useHydrated } from '@/lib/settings'
import { cn } from '@/lib/utils'

// ============ الأذكار ============
const TASBIH_ITEMS = [
  { text: 'سُبْحَانَ اللَّهِ', target: 33 },
  { text: 'الْحَمْدُ لِلَّهِ', target: 33 },
  { text: 'اللَّهُ أَكْبَرُ', target: 33 },
  { text: 'لَا إِلَهَ إِلَّا اللَّهُ', target: 100 },
  { text: 'أَسْتَغْفِرُ اللَّهَ', target: 100 },
  { text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', target: 100 },
  { text: 'سُبْحَانَ اللَّهِ الْعَظِيمِ', target: 100 },
  { text: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', target: 100 },
  { text: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', target: 100 },
]

const STORAGE_KEY = 'tasbih-state-v1'

interface TasbihState {
  index: number
  count: number
  dailyTotal: number
  lastDate: string
}

const DEFAULT_STATE: TasbihState = {
  index: 0,
  count: 0,
  dailyTotal: 0,
  lastDate: new Date().toDateString(),
}

function loadState(): TasbihState {
  if (typeof window === 'undefined') return DEFAULT_STATE
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as TasbihState
    // ⚠️ إعادة تعيين إذا تغيّر اليوم
    if (parsed.lastDate !== new Date().toDateString()) {
      return { ...parsed, dailyTotal: 0, lastDate: new Date().toDateString() }
    }
    return parsed
  } catch {
    return DEFAULT_STATE
  }
}

function saveState(state: TasbihState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

export function TasbihCounter() {
  const hydrated = useHydrated()
  const [state, setState] = useState<TasbihState>(DEFAULT_STATE)
  const [completed, setCompleted] = useState(false)

  // ⚠️ تحميل الحالة
  useEffect(() => {
    if (hydrated) setState(loadState())
  }, [hydrated])

  // ⚠️ حفظ عند كل تغيير
  useEffect(() => {
    if (hydrated) saveState(state)
  }, [state, hydrated])

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-3xl bg-card" aria-hidden="true" />
  }

  const current = TASBIH_ITEMS[state.index]
  const percent = (state.count / current.target) * 100
  const done = state.count >= current.target

  const handleTap = () => {
    if ('vibrate' in navigator) navigator.vibrate(10)

    setState((prev) => {
      const next = prev.count + 1
      const currentTarget = TASBIH_ITEMS[prev.index].target

      // ⚠️ وصل للهدف
      if (next >= currentTarget) {
        // ⚠️ تأثير الإكمال
        setCompleted(true)
        setTimeout(() => setCompleted(false), 800)
        if ('vibrate' in navigator) navigator.vibrate([30, 50, 30])

        // ⚠️ الانتقال التلقائي للذكر التالي
        const nextIndex = (prev.index + 1) % TASBIH_ITEMS.length
        return {
          index: nextIndex,
          count: 0,
          dailyTotal: prev.dailyTotal + currentTarget,
          lastDate: new Date().toDateString(),
        }
      }

      return {
        ...prev,
        count: next,
        dailyTotal: prev.dailyTotal + 1,
        lastDate: new Date().toDateString(),
      }
    })
  }

  const handleReset = () => {
    if (confirm('هل تريد إعادة تعيين العدّاد؟')) {
      setState((prev) => ({
        ...prev,
        count: 0,
      }))
    }
  }

  const handleNext = () => {
    setState((prev) => ({
      ...prev,
      index: (prev.index + 1) % TASBIH_ITEMS.length,
      count: 0,
    }))
  }

  const handlePrev = () => {
    setState((prev) => ({
      ...prev,
      index: prev.index === 0 ? TASBIH_ITEMS.length - 1 : prev.index - 1,
      count: 0,
    }))
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ============ بطاقة الذكر الحالي ============ */}
      <div className="rounded-3xl bg-gradient-to-l from-emerald-700 to-emerald-800 p-6 text-center text-white shadow-lg">
        <p className="text-xs opacity-70">
          {toArabicNumber(state.index + 1)} من {toArabicNumber(TASBIH_ITEMS.length)}
        </p>
        <p className="mt-3 font-quran text-3xl leading-relaxed">{current.text}</p>
        <p className="mt-2 text-sm opacity-80">
          الهدف: {toArabicNumber(current.target)} مرة
        </p>
      </div>

      {/* ============ العدّاد الكبير ============ */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleTap}
          aria-label="اضغط للعد"
          className={cn(
            'relative flex size-64 items-center justify-center rounded-full transition-transform duration-150 active:scale-95',
            'bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-950',
            completed && 'ring-4 ring-gold',
          )}
        >
          {/* ⚠️ دائرة التقدم */}
          <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-emerald-200 dark:text-emerald-950"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              className="text-gold transition-all duration-300"
              strokeDasharray={`${percent * 2.89} 289`}
            />
          </svg>

          {/* ⚠️ الرقم */}
          <div className="flex flex-col items-center">
            {done ? (
              <Check className="size-16 text-gold" />
            ) : (
              <>
                <span className="text-6xl font-bold text-emerald-700 dark:text-emerald-100">
                  {toArabicNumber(state.count)}
                </span>
                <span className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  من {toArabicNumber(current.target)}
                </span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* ============ أزرار التحكم ============ */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handlePrev}
          className="flex size-12 items-center justify-center rounded-full bg-muted transition hover:bg-muted/70"
          aria-label="الذكر السابق"
        >
          <ChevronRight className="size-5" />
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 rounded-full bg-muted px-5 py-3 text-sm font-medium transition hover:bg-muted/70"
        >
          <RotateCcw className="size-4" />
          إعادة
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="flex size-12 items-center justify-center rounded-full bg-muted transition hover:bg-muted/70"
          aria-label="الذكر التالي"
        >
          <ChevronRight className="size-5 rotate-180" />
        </button>
      </div>

      {/* ============ إجمالي اليوم ============ */}
      <div className="rounded-2xl bg-card p-4 text-center shadow-sm ring-1 ring-border">
        <p className="text-xs text-muted-foreground">مجموع اليوم</p>
        <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
          {toArabicNumber(state.dailyTotal)}
        </p>
      </div>

      {/* ============ قائمة الأذكار ============ */}
      <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <h3 className="mb-3 text-sm font-bold text-muted-foreground">الأذكار المتتالية</h3>
        <div className="flex flex-wrap gap-2">
          {TASBIH_ITEMS.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() =>
                setState((prev) => ({ ...prev, index: i, count: 0 }))
              }
              className={cn(
                'rounded-full px-3 py-1.5 text-xs transition',
                i === state.index
                  ? 'bg-gold text-foreground font-bold'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70',
              )}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>

      {/* ============ تنبيه الانتقال ============ */}
      <p className="text-center text-xs text-muted-foreground">
        ⚠️ عند إكمال العدد، ينتقل تلقائياً للذكر التالي
      </p>
    </div>
  )
}