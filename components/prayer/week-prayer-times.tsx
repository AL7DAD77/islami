'use client'

import { useMemo } from 'react'
import { CalendarDays } from 'lucide-react'
import { useSettings, useHydrated } from '@/lib/settings'
import { getPrayerTimes, PRAYER_NAMES, PRAYER_ORDER } from '@/lib/prayer'
import { toArabicNumber } from '@/lib/quran'

const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

function formatTime(date: Date) {
  return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export function WeekPrayerTimes() {
  const [settings] = useSettings()
  const hydrated = useHydrated()

  const days = useMemo(() => {
    if (!hydrated) return []
    const today = new Date()
    const result = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const times = getPrayerTimes(settings, date)
      result.push({ date, times, isToday: i === 0 })
    }
    return result
  }, [settings, hydrated])

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-3xl bg-card" aria-hidden="true" />
  }

  return (
    <div className="flex flex-col gap-4">
      {days.map((day, index) => (
        <article
          key={index}
          className={`overflow-hidden rounded-2xl shadow-sm ring-1 ring-border ${
            day.isToday ? 'bg-primary text-primary-foreground' : 'bg-card'
          }`}
        >
          <header className={`flex items-center justify-between px-4 py-3 ${
            day.isToday ? 'bg-primary-foreground/10' : 'bg-muted/50'
          }`}>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4" aria-hidden="true" />
              <span className="font-bold">
                {day.isToday ? 'اليوم' : ARABIC_DAYS[day.date.getDay()]}
              </span>
            </div>
            <span className="text-xs opacity-80">
              {`${toArabicNumber(day.date.getDate())} ${ARABIC_MONTHS[day.date.getMonth()]}`}
            </span>
          </header>
          <div className="grid grid-cols-5 divide-x divide-x-reverse">
            {PRAYER_ORDER.map((key) => (
              <div key={key} className="flex flex-col items-center gap-1 px-2 py-3">
                <span className="text-xs opacity-70">{PRAYER_NAMES[key]}</span>
                <span className="text-sm font-bold">{formatTime(day.times[key])}</span>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}