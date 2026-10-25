'use client'

import { getNativeLocation, type LocationOptions } from '@/lib/native'
import { CITIES, reverseGeocode } from '@/lib/places'
import { methodForCountry, nearestCity } from '@/lib/city-search'
import { distanceKm } from '@/lib/prayer'
import { getSettings, updateSettings, type AppSettings } from '@/lib/settings'

const PLACEHOLDER = 'موقعي الحالي'

/** اسم المدينة: من الإنترنت، وإن فشل فأقرب مدينة معروفة، وإلا «موقعي الحالي». */
export async function resolvePlace(lat: number, lng: number) {
  try {
    const p = await reverseGeocode(lat, lng)
    if (p.city) return p
  } catch {}
  const near = nearestCity(lat, lng, 40, CITIES)
  if (near) return { city: near.name, country: near.country, countryCode: near.cc }
  return { city: PLACEHOLDER, country: '', countryCode: '' }
}

export type AutoLocationResult = 'ok' | 'denied' | 'error' | 'skipped'

/**
 * يحدّث الموقع تلقائياً ويحفظ الحالة.
 * - لا يغيّر طريقة الحساب إلا عند تغيّر الدولة (فلا يُلغي اختيار المستخدم اليدوي لها).
 * - لا يعيد تحديد اسم المدينة إذا لم يتحرك المستخدم أكثر من ٥ كم.
 */
export async function updateAutoLocation(
  opts: LocationOptions & { force?: boolean } = {},
): Promise<AutoLocationResult> {
  const current = getSettings()
  if (!current.location.auto && !opts.force) return 'skipped'

  const result = await getNativeLocation({
    askPermission: opts.askPermission,
    highAccuracy: opts.highAccuracy ?? false,
  })

  if (result.status === 'denied') {
    updateSettings({ locationStatus: 'denied' })
    return 'denied'
  }
  if (result.status === 'error') {
    updateSettings({ locationStatus: 'error' })
    return 'error'
  }

  const { lat, lng } = result
  const loc = getSettings().location
  const moved = distanceKm(loc.lat, loc.lng, lat, lng)
  const needsName =
    moved >= 5 ||
    !loc.countryCode ||
    loc.city === PLACEHOLDER ||
    (loc.city === 'مكة المكرمة' && moved >= 1)

  if (!needsName) {
    updateSettings({ locationStatus: 'ok' })
    return 'ok'
  }

  const place = await resolvePlace(lat, lng)
  updateSettings((s: AppSettings) => {
    const cc = place.countryCode || s.location.countryCode || ''
    const countryChanged = !!place.countryCode && place.countryCode !== s.location.countryCode
    return {
      locationStatus: 'ok',
      location: {
        ...s.location,
        lat,
        lng,
        city: place.city,
        country: place.country || s.location.country,
        countryCode: cc,
        auto: true,
      },
      method: countryChanged ? methodForCountry(place.countryCode, s.method) : s.method,
    }
  })
  return 'ok'
}