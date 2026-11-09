'use client'

import { useEffect, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { useHydrated, useSettings } from '@/lib/settings'
import { PRAYER_NAMES, formatCountdown, formatTime, getNextPrayer } from '@/lib/prayer'
import { formatHijri, getOccasion, toHijri } from '@/lib/hijri'
import { updateAutoLocation } from '@/lib/location'
import { useNumberFormat } from '@/lib/numbers'
import { useLanguage } from '@/lib/language-context'

export function NextPrayerCard() {
  const [settings] = useSettings()
  const hydrated = useHydrated()
  const { dict, locale } = useLanguage()
  const { formatValue } = useNumberFormat()

  const [now, setNow] = useState(() => new Date())
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const handleUpdateLocation = async () => {
    if (isUpdatingLocation) return
    setIsUpdatingLocation(true)

    try {
      const result = await updateAutoLocation({ askPermission: true, force: true })

      if (result === 'denied') {
        alert(
          locale === 'ar'
            ? 'تم رفض صلاحية الموقع. يرجى تفعيلها من إعدادات الهاتف لتحديد مدينتك.'
            : 'Location permission denied. Please enable it from phone settings.',
        )
      } else if (result === 'error') {
        alert(
          locale === 'ar'
            ? 'تعذر جلب الموقع. يرجى التأكد من تشغيل نظام تحديد المواقع (GPS).'
            : 'Failed to get location. Please ensure GPS is enabled.',
        )
      }
    } catch (error) {
      console.error('حدث خطأ غير متوقع:', error)
    } finally {
      setIsUpdatingLocation(false)
    }
  }

  if (!hydrated) {
    return <div className="h-52 animate-pulse rounded-3xl bg-primary/80" aria-hidden="true" />
  }

  const next = getNextPrayer(settings, now)
  const hijri = toHijri(now, settings.hijriAdjust)
  const occasion = getOccasion(hijri)

  const getPrayerName = (key: string) => {
    const dictKey = key.toLowerCase() as keyof typeof dict.prayers
    return dict.prayers[dictKey] || PRAYER_NAMES[key as keyof typeof PRAYER_NAMES]
  }

  const formattedNextTime = formatValue(formatTime(next.time))
  const formattedCountdown = formatValue(
    formatCountdown(next.time.getTime() - now.getTime()),
  )

  // ✅ إصلاح التاريخ الميلادي ليستخدم formatValue
  const formattedGregorianDate = formatValue(
    now.toLocaleDateString(
      locale === 'ar' ? 'ar-EG' : 'en-US',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      },
    ),
  )

  return (
    <section
      aria-label={locale === 'ar' ? 'الصلاة القادمة' : 'Next Prayer'}
      className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-md"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full border-[28px] border-primary-foreground/5"
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm opacity-80">{formatHijri(now, settings.hijriAdjust)}</p>
          {/* ✅ استخدام المتغير الجديد */}
          <p className="text-xs opacity-70">{formattedGregorianDate}</p>
        </div>

        <button
          type="button"
          onClick={handleUpdateLocation}
          disabled={isUpdatingLocation}
          className="flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs transition-colors hover:bg-primary-foreground/20 disabled:opacity-70"
          title={
            locale === 'ar'
              ? 'اضغط لتحديد موقعك الحالي تلقائياً'
              : 'Tap to auto-detect location'
          }
        >
          {isUpdatingLocation ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <MapPin className="size-3.5" aria-hidden="true" />
          )}
          <span>
            {isUpdatingLocation
              ? locale === 'ar'
                ? 'جاري التحديد...'
                : 'Locating...'
              : settings.location.city}
          </span>
        </button>
      </div>

      <div className="relative mt-6">
        <p className="text-sm opacity-80">
          {locale === 'ar' ? 'الصلاة القادمة' : 'Next Prayer'}
        </p>

        <div className="mt-1 flex items-end justify-between gap-4">
          <p className="text-4xl font-bold">{getPrayerName(next.key)}</p>
          <p className="text-xl font-medium text-gold">{formattedNextTime}</p>
        </div>

        <p
          className="mt-3 font-mono text-2xl tabular-nums tracking-wider"
          dir="ltr"
          aria-live="off"
        >
          {`- ${formattedCountdown}`}
        </p>
      </div>

      {occasion && (
        <p className="relative mt-4 rounded-xl bg-gold/20 px-3 py-2 text-sm font-medium text-primary-foreground">
          {occasion}
        </p>
      )}
    </section>
  )
}