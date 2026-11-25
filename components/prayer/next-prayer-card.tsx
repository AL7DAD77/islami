'use client'

import { useEffect, useRef, useState } from 'react'
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

  // هل تم تحديد الموقع فعلياً؟ الاسم الافتراضي (مكة) لا يُعد تحديداً
  const locationResolved =
    settings.locationStatus === 'ok' && settings.location.auto

  const autoStarted = useRef(false)

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

  // بدء التحديد تلقائياً مرة واحدة عند أول تشغيل إن لم يكن الموقع محدداً
  useEffect(() => {
    if (!hydrated || autoStarted.current) return
    if (locationResolved) return

    autoStarted.current = true
    handleUpdateLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, locationResolved])

  if (!hydrated) {
    return (
      <div
        className="h-52 animate-pulse rounded-3xl border border-border bg-card/80"
        aria-hidden="true"
      />
    )
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

  // الاسم المعروض: "جارٍ التحديد" أثناء البحث، ثم اسم المدينة المحددة فعلياً
  const cityLabel = isUpdatingLocation
    ? locale === 'ar'
      ? 'جاري التحديد...'
      : 'Locating...'
    : locationResolved
      ? settings.location.city
      : locale === 'ar'
        ? 'جارٍ تحديد الموقع...'
        : 'Detecting location...'

  return (
    <section
      aria-label={locale === 'ar' ? 'الصلاة القادمة' : 'Next Prayer'}
      className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm transition-colors duration-300"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full border-[28px] border-foreground/[0.04]"
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground/85">
            {formatHijri(now, settings.hijriAdjust)}
          </p>
          <p className="text-xs text-muted-foreground">{formattedGregorianDate}</p>
        </div>

        <button
          type="button"
          onClick={handleUpdateLocation}
          disabled={isUpdatingLocation}
          className="flex items-center gap-1.5 rounded-full border border-border bg-muted/80 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-70"
          title={
            locale === 'ar'
              ? 'اضغط لتحديد موقعك الحالي تلقائياً'
              : 'Tap to auto-detect location'
          }
        >
          {isUpdatingLocation ? (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden="true" />
          ) : (
            <MapPin className="size-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
          )}
          <span>{cityLabel}</span>
        </button>
      </div>

      <div className="relative mt-6">
        <p className="text-sm text-muted-foreground">
          {locale === 'ar' ? 'الصلاة القادمة' : 'Next Prayer'}
        </p>

        <div className="mt-1 flex items-end justify-between gap-4">
          <p className="text-4xl font-bold text-foreground">
            {getPrayerName(next.key)}
          </p>
          <p className="rounded-xl border border-amber-600/20 bg-amber-500/10 px-2.5 py-1 text-lg font-semibold text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300">
            {formattedNextTime}
          </p>
        </div>

        <p
          className="mt-3 font-mono text-2xl font-bold tabular-nums tracking-wider text-emerald-800 dark:text-emerald-300"
          dir="ltr"
          aria-live="off"
        >
          {`- ${formattedCountdown}`}
        </p>
      </div>

      {occasion && (
        <p className="relative mt-4 rounded-xl border border-amber-600/20 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
          {occasion}
        </p>
      )}
    </section>
  )
}
