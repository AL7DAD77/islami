'use client'

import Link from 'next/link'
import { MapPinOff, Loader2 } from 'lucide-react'
import { useHydrated, useSettings } from '@/lib/settings'
import { useLanguage } from '@/lib/language-context'

/**
 * تنبيه أعلى صفحة الصلاة.
 * - إن لم يُحدَّد الموقع بعد: يظهر أن المواقيت الحالية قد لا تكون لمدينة المستخدم.
 * - إن فشل التحديد: يظهر السبب مع اسم المدينة المعروضة.
 * - إن كان الموقع محدداً: لا يظهر شيء.
 */
export function LocationBanner() {
  const [settings] = useSettings()
  const hydrated = useHydrated()
  const { dict, locale } = useLanguage()

  if (!hydrated) return null

  const resolved = settings.locationStatus === 'ok' && settings.location.auto
  if (resolved) return null

  const failed =
    settings.locationStatus === 'denied' || settings.locationStatus === 'error'

  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-3 rounded-2xl bg-amber-100 p-4 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      {failed ? (
        <MapPinOff className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      ) : (
        <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin" aria-hidden="true" />
      )}

      <div className="text-sm leading-relaxed">
        <p className="font-bold">
          {failed
            ? dict.locationBanner.notDetermined
            : 'جارٍ تحديد موقعك...'}
        </p>

        {failed ? (
          <p>
            {`${dict.locationBanner.message} ${settings.location.city}${dict.locationBanner.messageEnd}`}
          </p>
        ) : (
          <p>
            {'المواقيت المعروضة الآن قد لا تكون لمدينتك حتى يكتمل تحديد الموقع.'}
          </p>
        )}

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