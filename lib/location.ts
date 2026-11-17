'use client'

import { getNativeLocation, type LocationOptions } from '@/lib/native'
import { CITIES, reverseGeocode } from '@/lib/places'
import { methodForCountry, nearestCity } from '@/lib/city-search'
import { distanceKm } from '@/lib/prayer'
import { getSettings, updateSettings, type AppSettings } from '@/lib/settings'

const PLACEHOLDER = 'موقعي الحالي'
const LOCAL_NAME_RADIUS_KM = 25
const MIN_MOVE_TO_REFRESH_KM = 0.3

interface PlaceName {
  city: string
  country: string
  countryCode: string
}

interface NominatimAddress {
  neighbourhood?: string
  suburb?: string
  quarter?: string
  city_district?: string
  village?: string
  town?: string
  city?: string
  county?: string
  state?: string
  country?: string
  country_code?: string
}

/**
 * يجلب الحي أو المنطقة الدقيقة (مثل أم أذينة أو الروابي) قبل اسم المدينة الكبرى.
 * يعيد null عند غياب الإنترنت أو فشل الخدمة، فيتم الانتقال للبديل.
 */
async function resolveDistrict(lat: number, lng: number): Promise<PlaceName | null> {
  const url =
    'https://nominatim.openstreetmap.org/reverse?format=jsonv2' +
    `&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1&accept-language=ar`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    if (!res.ok) return null

    const data = await res.json()
    const a: NominatimAddress = data?.address ?? {}

    // الحي أولاً، ثم المدينة الكبرى إن لم يوجد حي
    const district =
      a.neighbourhood ||
      a.suburb ||
      a.quarter ||
      a.city_district ||
      a.village ||
      ''

    const city = a.city || a.town || a.county || a.state || ''
    const name = district || city

    if (!name) return null

    return {
      city: name,
      country: a.country ?? '',
      countryCode: (a.country_code ?? '').toUpperCase(),
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * الأولوية: الحي من الخدمة الدقيقة، ثم خدمة التحديد العامة،
 * ثم أقرب مدينة مسجلة ضمن نطاق قريب، وأخيراً "موقعي الحالي".
 */
export async function resolvePlace(lat: number, lng: number): Promise<PlaceName> {
  const detailed = await resolveDistrict(lat, lng)

  if (detailed && detailed.countryCode) {
    return detailed
  }

  let general: PlaceName | null = null

  try {
    const place = await reverseGeocode(lat, lng)
    if (place.city && place.city !== 'مكة المكرمة') {
      general = place
    }
  } catch {
    // لا يوجد إنترنت، ننتقل للبديل المحلي
  }

  if (detailed) {
    return {
      city: detailed.city,
      country: detailed.country || general?.country || '',
      countryCode: general?.countryCode ?? '',
    }
  }

  if (general) {
    return general
  }

  const near = nearestCity(lat, lng, LOCAL_NAME_RADIUS_KM, CITIES)

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

export async function updateAutoLocation(
  opts: LocationOptions & { force?: boolean } = {},
): Promise<AutoLocationResult> {
  const current = getSettings()

  if (!current.location.auto && !opts.force) {
    return 'skipped'
  }

  const locationResult = await getNativeLocation({
    askPermission: opts.askPermission,
    highAccuracy: opts.highAccuracy ?? true,
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

  const isDefaultOrWrong =
    savedLocation.city === 'مكة المكرمة' ||
    savedLocation.city === PLACEHOLDER ||
    !savedLocation.countryCode

  // نعيد تحديد الاسم عند كل تشغيل قسري، أو تحرك ولو يسيراً، أو إذا كان الاسم خاطئاً
  const needsPlaceName =
    opts.force ||
    isDefaultOrWrong ||
    movedKm >= MIN_MOVE_TO_REFRESH_KM

  let place: PlaceName = {
    city: savedLocation.city,
    country: savedLocation.country,
    countryCode: savedLocation.countryCode,
  }

  if (needsPlaceName) {
    place = await resolvePlace(lat, lng)
  }

  updateSettings((latest: AppSettings) => {
    const detectedCountry = place.countryCode || latest.location.countryCode || ''

    const nextMethod =
      place.countryCode && !latest.methodManual
        ? methodForCountry(place.countryCode, latest.method)
        : latest.method

    return {
      locationStatus: 'ok',
      location: {
        ...latest.location,
        lat,
        lng,
        city:
          needsPlaceName && place.city !== PLACEHOLDER
            ? place.city
            : needsPlaceName
              ? PLACEHOLDER
              : latest.location.city,
        country: needsPlaceName
          ? place.country || latest.location.country
          : latest.location.country,
        countryCode: detectedCountry,
        auto: true,
      },
      method: nextMethod,
    }
  })

  return 'ok'
}