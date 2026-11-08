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
 * يحدّث الموقع ويحفظ الإحداثيات الخام دائماً.
 * - الطريقة تُختار من الدولة المكتشفة من الإحداثيات نفسها، لا من الاختيار السابق.
 * - اسم المدينة يُعاد تحديده فقط عند الحاجة (تحرك أكثر من 5 كم أو اسم غير معروف).
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

  // ✅ تشخيص مؤقت: احذف هذا السطر بعد التحقق
  console.log('[LOCATION-DEBUG] raw', { lat, lng, movedKm, needsPlaceName, savedCountry: savedLocation.countryCode, savedMethod: settings.method })

  let place: { city: string; country: string; countryCode: string } = {
    city: savedLocation.city,
    country: savedLocation.country,
    countryCode: savedLocation.countryCode,
  }

  if (needsPlaceName) {
    place = await resolvePlace(lat, lng)
  }

  updateSettings((latest: AppSettings) => {
    const detectedCountry = place.countryCode || latest.location.countryCode || ''

    // الطريقة تتبع الدولة المكتشفة دائماً عند معرفتها
    const nextMethod = place.countryCode
      ? methodForCountry(place.countryCode, latest.method)
      : latest.method

    return {
      locationStatus: 'ok',
      location: {
        ...latest.location,
        lat,
        lng,
        city: needsPlaceName ? place.city : latest.location.city,
        country: needsPlaceName
          ? place.country || latest.location.country
          : latest.location.country,
        countryCode: detectedCountry,
        auto: true,
      },
      method: nextMethod,
    }
  })

  // ✅ تشخيص مؤقت: احذف هذا السطر بعد التحقق
  console.log('[LOCATION-DEBUG] saved', getSettings().location, getSettings().method)

  return 'ok'
}