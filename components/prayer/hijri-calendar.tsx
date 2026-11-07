'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useHydrated, useSettings } from '@/lib/settings'
import { ISLAMIC_OCCASIONS, getOccasion, toArabicDigits, toHijri } from '@/lib/hijri'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'

export function HijriCalendar() {
  const [settings] = useSettings()
  const hydrated = useHydrated()
  const { dict, locale } = useLanguage()
  const [offset, setOffset] = useState(0)

  if (!hydrated) return <div className="h-96 animate-pulse rounded-3xl bg-card" aria-hidden="true" />

  const today = new Date()
  const base = new Date(today.getFullYear(), today.getMonth() + offset, 1)
  const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()
  const leading = base.getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(base.getFullYear(), base.getMonth(), i + 1))

  const firstH = toHijri(days[0], settings.hijriAdjust)
  const lastH = toHijri(days[days.length - 1], settings.hijriAdjust)
  
  // عنوان التقويم (نستخدم أسماء الأشهر العربية كما هي من المكتبة)
  const hijriTitle =
    firstH.month === lastH.month
      ? `${firstH.monthName} ${toArabicDigits(firstH.year)}`
      : `${firstH.monthName} - ${lastH.monthName} ${toArabicDigits(lastH.year)} هـ`

  const occasions = days
    .map((d) => ({ d, h: toHijri(d, settings.hijriAdjust) }))
    .filter(({ h }) => ISLAMIC_OCCASIONS.some((o) => o.month === h.month && o.day === h.day))

  return (
    <div className="flex flex-col gap-4" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <section className="rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setOffset((o) => o - 1)}
            className="flex size-10 items-center justify-center rounded-full hover:bg-muted"
            aria-label={dict.hijriCalendar.prevMonth}
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="text-center">
            <p className="text-lg font-bold text-primary">{hijriTitle}</p>
            <p className="text-sm text-muted-foreground">
              {base.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOffset((o) => o + 1)}
            className="flex size-10 items-center justify-center rounded-full hover:bg-muted"
            aria-label={dict.hijriCalendar.nextMonth}
          >
            <ChevronLeft className="size-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center" role="grid">
          {/* أيام الأسبوع */}
          {Object.values(dict.hijriCalendar.weekdays).map((w) => (
            <div key={w} className="py-1 text-xs font-medium text-muted-foreground" role="columnheader">
              {w}
            </div>
          ))}
          {Array.from({ length: leading }).map((_, i) => (
            <div key={`e${i}`} />
          ))}
          {days.map((d) => {
            const h = toHijri(d, settings.hijriAdjust)
            const isToday = d.toDateString() === today.toDateString()
            const special = ISLAMIC_OCCASIONS.some((o) => o.month === h.month && o.day === h.day)
            return (
              <div
                key={d.toISOString()}
                role="gridcell"
                aria-current={isToday ? 'date' : undefined}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center rounded-xl text-sm',
                  isToday ? 'bg-primary text-primary-foreground' : special ? 'bg-accent text-accent-foreground' : 'bg-muted/50',
                )}
              >
                <span className="text-base font-bold leading-none">{toArabicDigits(h.day)}</span>
                <span className={cn('mt-1 text-[10px] leading-none', isToday ? 'opacity-80' : 'text-muted-foreground')}>
                  {d.getDate()}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border">
        <h2 className="mb-3 text-lg font-bold">{dict.hijriCalendar.monthOccasions}</h2>
        {occasions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dict.hijriCalendar.noOccasions}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {occasions.map(({ d, h }) => (
              <li key={d.toISOString()} className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 px-4 py-3">
                <span className="font-medium">{getOccasion(h)}</span>
                <span className="text-sm text-muted-foreground">
                  {d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          {dict.hijriCalendar.calendarNote}
        </p>
      </section>
    </div>
  )
}