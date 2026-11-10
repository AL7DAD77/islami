'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar, MapPin } from 'lucide-react'
import { getPrayerTimes, PRAYER_NAMES, PRAYER_ORDER, formatTime } from '@/lib/prayer'
import { useSettings } from '@/lib/settings'

export function PrayerTimesList() {
  const [settings] = useSettings()
  // 0 يعني اليوم الحالي، 1 الغد، -1 الأمس...
  const [dayOffset, setDayOffset] = useState(0)

  // حساب التاريخ بناءً على الإزاحة
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + dayOffset)

  // جلب مواقيت الصلاة لليوم المحدد تلقائياً
  const times = getPrayerTimes(settings, targetDate)

  const handlePrevDay = () => setDayOffset(prev => prev - 1)
  const handleNextDay = () => setDayOffset(prev => prev + 1)
  const handleResetToday = () => setDayOffset(0)

  // تنسيق التاريخ للعرض العربي
  const formattedDate = targetDate.toLocaleDateString('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="flex flex-col bg-background p-4 text-foreground dir-rtl">
      {/* رأس المكون: المدينة وتحديد اليوم */}
      <header className="mb-6 flex flex-col items-center justify-between gap-3 rounded-2xl bg-card p-4 ring-1 ring-border shadow-sm">
        <div className="flex items-center gap-2 text-primary font-bold">
          <MapPin className="size-5 shrink-0" />
          <span>{settings.location.city || 'موقعي الحالي'}</span>
        </div>

        {/* شريط التنقل بين الأيام بالسحب/الضغط */}
        <div className="flex w-full items-center justify-between gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={handlePrevDay}
            className="flex items-center gap-1 rounded-xl bg-muted p-2 text-xs font-bold transition-colors hover:bg-muted/80"
            aria-label="اليوم السابق"
          >
            <ChevronRight className="size-4" />
            <span>السابق</span>
          </button>

          <button
            type="button"
            onClick={handleResetToday}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold text-primary transition-opacity hover:opacity-80"
          >
            <Calendar className="size-4" />
            <span>{dayOffset === 0 ? 'اليوم' : formattedDate}</span>
          </button>

          <button
            type="button"
            onClick={handleNextDay}
            className="flex items-center gap-1 rounded-xl bg-muted p-2 text-xs font-bold transition-colors hover:bg-muted/80"
            aria-label="اليوم التالي"
          >
            <span>التالي</span>
            <ChevronLeft className="size-4" />
          </button>
        </div>
      </header>

      {/* قائمة المواقيت لليوم المختار */}
      <main className="flex-1 space-y-3">
        {PRAYER_ORDER.map((key) => {
          const prayerTime = times[key]
          const isAdhanEnabled = settings.adhanEnabled[key]

          return (
            <div
              key={key}
              className="flex items-center justify-between rounded-2xl bg-card p-4 ring-1 ring-border shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-base font-bold">
                  {PRAYER_NAMES[key]}
                </span>
                {!isAdhanEnabled && (
                  <span className="text-[10px] rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                    مكتوم
                  </span>
                )}
              </div>

              <span className="text-lg font-bold dir-ltr font-mono text-primary">
                {formatTime(prayerTime)}
              </span>
            </div>
          )
        })}
      </main>

      {/* زر العودة لمواقيت اليوم عند الانتقال بين الأيام */}
      {dayOffset !== 0 && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleResetToday}
            className="text-xs text-primary underline underline-offset-4"
          >
            العودة لمواقيت اليوم الحالي
          </button>
        </div>
      )}
    </div>
  )
}

// تصدير افتراضي أيضاً لضمان مطابقة جميع طرق الـ Import ومنع أي خطأ بناء
export default PrayerTimesList
