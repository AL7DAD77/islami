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
    const place = await reverseGeocode(lat, lng)

    if (place.city) {
      return place
    }
  } catch {
    // لا يوجد إنترنت أو فشل خدمة تحديد المدينة
  }

  const near = nearestCity(lat, lng, 40, CITIES)

  if (near) {
    return {
      city: near.name,
      country: near.country,
      countryCode: near.cc,
    }
  }

  return {
    city: PLACEHOLDER,
    country: '',
    countryCode: '',
  }
}

export type AutoLocationResult = 'ok' | 'denied' | 'error' | 'skipped'

/**
 * يحدّث الموقع تلقائياً ويحفظ الحالة.
 * - لا يغيّر طريقة الحساب إلا عند تغيّر الدولة، حتى لا يُلغي اختيار المستخدم اليدوي.
 * - لا يعيد تحديد اسم المدينة إذا لم يتحرك المستخدم أكثر من 5 كم.
 */
export async function updateAutoLocation(
  opts: LocationOptions & { force?: boolean } = {},
): Promise<AutoLocationResult> {
  const current = getSettings()

  if (!current.location.auto && !opts.force) {
    return 'skipped'
  }

  const locationResult = await getNativeLocation({
    askPermission: opts.askPermission,
    highAccuracy: opts.highAccuracy ?? false,
  })

  if (locationResult.status === 'denied') {
    updateSettings({ locationStatus: 'denied' })
    return 'denied'
  }

  if (locationResult.status === 'error') {
    updateSettings({ locationStatus: 'error' })
    return 'error'
  }

  const { lat, lng } = locationResult

  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    updateSettings({ locationStatus: 'error' })
    return 'error'
  }

  const settings = getSettings()
  const savedLocation = settings.location

  const movedKm = distanceKm(
    savedLocation.lat,
    savedLocation.lng,
    lat,
    lng,
  )

  const needsPlaceName =
    movedKm >= 5 ||
    !savedLocation.countryCode ||
    savedLocation.city === PLACEHOLDER ||
    (savedLocation.city === 'مكة المكرمة' && movedKm >= 1)

  if (!needsPlaceName) {
    updateSettings({
      locationStatus: 'ok',
      location: {
        ...savedLocation,
        lat,
        lng,
      },
    })

    return 'ok'
  }

  const place = await resolvePlace(lat, lng)

  updateSettings((settings: AppSettings) => {
    const countryCode =
      place.countryCode || settings.location.countryCode || ''

    const countryChanged =
      !!place.countryCode &&
      place.countryCode !== settings.location.countryCode

    const nextMethod = countryChanged
      ? methodForCountry(place.countryCode, 'MuslimWorldLeague')
      : settings.method

    return {
      locationStatus: 'ok',
      location: {
        ...settings.location,
        lat,
        lng,
        city: place.city,
        country: place.country || settings.location.country,
        countryCode,
        auto: true,
      },
      method: nextMethod,
    }
  })

  return 'ok'
}