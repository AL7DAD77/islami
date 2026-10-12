'use client'

import Link from 'next/link'
import { MapPinOff } from 'lucide-react'
import { useHydrated, useSettings } from '@/lib/settings'

/** تنبيه أعلى صفحة الصلاة: يوضح أن المواقيت المعروضة قد لا تكون لمدينتك لأن الموقع لم يُحدَّد. */
export function LocationBanner() {
  const [settings] = useSettings()
  const hydrated = useHydrated()
  if (!hydrated) return null
  if (!settings.location.auto) return null
  if (settings.locationStatus !== 'denied' && settings.locationStatus !== 'error') return null

  return (
    <div role="alert" className="mb-4 flex items-start gap-3 rounded-2xl bg-amber-100 p-4 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
      <MapPinOff className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="text-sm leading-relaxed">
        <p className="font-bold">لم يتم تحديد موقعك</p>
        <p>
          المواقيت المعروضة الآن لمدينة {settings.location.city}. فعّل إذن الموقع أو اختر مدينتك يدوياً.
        </p>
        <Link
          href="/prayer/settings"
          className="mt-2 inline-block rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white"
        >
          فتح إعدادات الموقع
        </Link>
      </div>
    </div>
  )
}
