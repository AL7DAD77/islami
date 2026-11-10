'use client'

import { getNativeLocation, type LocationOptions } from '@/lib/native'
import { CITIES, reverseGeocode } from '@/lib/places'
import { methodForCountry, nearestCity } from '@/lib/city-search'
import { distanceKm } from '@/lib/prayer'
import { getSettings, updateSettings, type AppSettings } from '@/lib/settings'

const PLACEHOLDER = 'موقعي الحالي'

/** 
 * اسم المدينة: يتم البحث بدقة عن أقرب مدينة حقيقية للإحداثيات الفعلية،
 * مع منع الاعتماد نهائياً على أي قيمة افتراضية مثل مكة المكرمة.
 */
export async function resolvePlace(lat: number, lng: number) {
  try {
    const place = await reverseGeocode(lat, lng)

    if (place.city && place.city !== 'مكة المكرمة') {
      return place
    }
  } catch {
    // لا يوجد إنترنت أو فشل خدمة تحديد المدينة عبر الإنترنت
  }

  // البحث في أقرب مدينة مسجلة بغض النظر عن النطاق الضيق لضمان الدقة وعدم الوقوع في الخطأ
  const near = nearestCity(lat, lng, 500, CITIES)

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
 * يحدّث الموقع ويحفظ الإحداثيات الخام بدقة تامة.
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
    highAccuracy: opts.highAccuracy ?? true, // رفع دقة GPS لضمان التطابق الفعلي
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

  // إذا كانت المدينة القديمة خاطئة أو افتراضية (مثل مكة خطأً)، نجبر التحديث فورا
  const isDefaultOrWrong = 
    savedLocation.city === 'مكة المكرمة' || 
    savedLocation.city === PLACEHOLDER ||
    !savedLocation.countryCode

  const needsPlaceName =
    movedKm >= 5 ||
    isDefaultOrWrong ||
    opts.force

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

    // ضبط طريقة الحساب تلقائياً بناءً على الدولة المكتشفة إحداثياً
    const nextMethod = place.countryCode
      ? methodForCountry(place.countryCode, latest.method)
      : latest.method

    return {
      locationStatus: 'ok',
      location: {
        ...latest.location,
        lat,
        lng,
        city: (needsPlaceName && place.city !== PLACEHOLDER) ? place.city : latest.location.city,
        country: needsPlaceName ? place.country || latest.location.country : latest.location.country,
        countryCode: detectedCountry,
        auto: true,
      },
      method: nextMethod,
    }
  })

  return 'ok'
}
