'use client'

import { useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import { MushafPageView } from '@/components/mushaf/mushaf-page'
import { toArabicNumber } from '@/lib/quran'
import { useHydrated, useSettings } from '@/lib/settings'
import { cn } from '@/lib/utils'

const TOTAL_PAGES = 604
const todayKey = () => new Date().toISOString().slice(0, 10)

export function DailyWird() {
  const [settings, update] = useSettings()
  const hydrated = useHydrated()
  const { wird } = settings
  const [viewPage, setViewPage] = useState<number | null>(null)
  const page = viewPage ?? wird.currentPage
  // اسم سورة الصفحة المعروضة (يأتي من مكوّن المصحف بعد تحميلها)
  const [surahName, setSurahName] = useState<string | null>(null)

  if (!hydrated) return <div className="h-96 animate-pulse rounded-3xl bg-card" aria-hidden="true" />

  const endPage = Math.min(TOTAL_PAGES, wird.currentPage + wird.pagesPerDay - 1)
  const doneToday = wird.lastDoneDate === todayKey()
  const daysToKhatm = Math.ceil((TOTAL_PAGES - wird.currentPage + 1) / wird.pagesPerDay)
  const percent = Math.round(((wird.currentPage - 1) / TOTAL_PAGES) * 100)

  const completeToday = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const continued = wird.lastDoneDate === yesterday.toISOString().slice(0, 10)
    const next = endPage >= TOTAL_PAGES ? 1 : endPage + 1
    update({
      wird: { ...wird, currentPage: next, lastDoneDate: todayKey(), streak: continued ? wird.streak + 1 : 1 },
    })
    setViewPage(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-3xl bg-primary p-5 text-primary-foreground shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">{'ورد اليوم'}</p>
            <p className="text-2xl font-bold">
              {`الصفحات ${toArabicNumber(wird.currentPage)} - ${toArabicNumber(endPage)}`}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-primary-foreground/10 px-3 py-1.5 text-sm">
            <Flame className="size-4 text-gold" aria-hidden="true" />
            {`${toArabicNumber(wird.streak)} يوم`}
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary-foreground/15" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="نسبة التقدم في الختمة">
          <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-xs opacity-80">
          {`أنجزت ${toArabicNumber(percent)}٪ من الختمة · تتبقى ${toArabicNumber(daysToKhatm)} يوماً تقريباً`}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[2, 4, 10, 20].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => update({ wird: { ...wird, pagesPerDay: n } })}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs',
                wird.pagesPerDay === n ? 'bg-gold text-foreground' : 'bg-primary-foreground/10',
              )}
            >
              {n === 20 ? 'جزء يومياً (ختمة في شهر)' : `${toArabicNumber(n)} صفحات`}
            </button>
          ))}
        </div>
      </section>

      <article className="rounded-3xl bg-card p-3 shadow-sm ring-1 ring-border sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setViewPage(page - 1)}
            className="flex size-9 items-center justify-center rounded-full bg-muted disabled:opacity-40"
            aria-label="الصفحة السابقة"
          >
            <ChevronRight className="size-4" />
          </button>
          <p className="text-sm font-medium text-muted-foreground">
            {`صفحة ${toArabicNumber(page)}`}
            {surahName && ` · سورة ${surahName}`}
          </p>
          <button
            type="button"
            disabled={page >= TOTAL_PAGES}
            onClick={() => setViewPage(page + 1)}
            className="flex size-9 items-center justify-center rounded-full bg-muted disabled:opacity-40"
            aria-label="الصفحة التالية"
          >
            <ChevronLeft className="size-4" />
          </button>
        </div>
        {/* صفحة المصحف بنص QPC Hafs وخط KFGQPC: الضبط نفسه الذي في المصحف الأساسي */}
        <MushafPageView page={page} onSurah={setSurahName} />
      </article>

      <button
        type="button"
        onClick={completeToday}
        disabled={doneToday}
        className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 font-bold text-primary-foreground shadow-sm disabled:bg-secondary disabled:text-secondary-foreground"
      >
        <CheckCircle2 className="size-5" aria-hidden="true" />
        {doneToday ? 'أتممت ورد اليوم، تقبل الله منك' : 'أتممت ورد اليوم'}
      </button>
    </div>
  )
}
