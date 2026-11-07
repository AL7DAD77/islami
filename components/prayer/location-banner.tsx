'use client'

import Link from 'next/link'
import { MapPinOff } from 'lucide-react'
import { useHydrated, useSettings } from '@/lib/settings'
import { useLanguage } from '@/lib/language-context' // ✅ استيراد مزود اللغة

/** تنبيه أعلى صفحة الصلاة: يوضح أن المواقيت المعروضة قد لا تكون لمدينتك لأن الموقع لم يُحدَّد. */
export function LocationBanner() {
  const [settings] = useSettings()
  const hydrated = useHydrated()
  const { dict, locale } = useLanguage() // ✅ جلب اللغة
  
  if (!hydrated) return null
  if (!settings.location.auto) return null
  if (settings.locationStatus !== 'denied' && settings.locationStatus !== 'error') return null

  return (
    <div 
      role="alert" 
      className="mb-4 flex items-start gap-3 rounded-2xl bg-amber-100 p-4 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <MapPinOff className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="text-sm leading-relaxed">
        <p className="font-bold">{dict.locationBanner.notDetermined}</p>
        <p>
          {/* ✅ ترجمة الرسالة مع اسم المدينة */}
          {`${dict.locationBanner.message} ${settings.location.city}${dict.locationBanner.messageEnd}`}
        </p>
        <Link
          href="/prayer/settings"
          className="mt-2 inline-block rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-700"
        >
          {dict.locationBanner.openSettings}
        </Link>
      </div>
    </div>
  )
}