import { CITIES, COUNTRY_METHOD, type City } from './places'
import type { MethodKey } from './settings'

/** توحيد النص العربي للبحث: يتجاهل التشكيل والهمزات والتاء المربوطة والياء/الألف المقصورة */
export function normalizeArabic(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىئ]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function searchCities(
  query: string,
  list: City[] = CITIES,
): City[] {
  const q = normalizeArabic(query)

  if (!q) {
    return list
  }

  return list.filter(city =>
    normalizeArabic(`${city.name} ${city.country}`).includes(q),
  )
}

function distanceKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371
  const toRad = (x: number) => (x * Math.PI) / 180

  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) *
      Math.cos(toRad(bLat)) *
      Math.sin(dLng / 2) ** 2

  return 2 * R * Math.asin(Math.sqrt(h))
}

/** أقرب مدينة من القائمة المحلية (تُستخدم عند فشل تحديد اسم المدينة بلا إنترنت) */
export function nearestCity(
  lat: number,
  lng: number,
  maxKm = 500, // ✅ تم رفع النطاق إلى 500 كم لضمان التعرف على الدولة وطريقتها الرسمية حتى في المناطق البعيدة
  list: City[] = CITIES,
): City | null {
  let best: City | null = null
  let bestDistance = Number.POSITIVE_INFINITY

  for (const city of list) {
    const distance = distanceKm(lat, lng, city.lat, city.lng)

    if (distance < bestDistance) {
      bestDistance = distance
      best = city
    }
  }

  return best && bestDistance <= maxKm ? best : null
}

export function methodForCountry(
  countryCode: string | undefined,
  fallback: MethodKey = 'MuslimWorldLeague',
): MethodKey {
  if (!countryCode) {
    return fallback
  }

  const normalizedCode = countryCode.trim().toUpperCase()

  return COUNTRY_METHOD[normalizedCode] ?? fallback
}

export interface OnlineCity {
  name: string
  country: string
  cc: string
  lat: number
  lng: number
  admin?: string
}

/** بحث عن أي مدينة في العالم (يحتاج إنترنت). يعيد قائمة فارغة عند أي فشل. */
export async function searchCitiesOnline(
  query: string,
  signal?: AbortSignal,
): Promise<OnlineCity[]> {
  const normalizedQuery = query.trim()

  if (normalizedQuery.length < 2) {
    return []
  }

  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        normalizedQuery,
      )}&count=10&language=ar&format=json`,
      { signal },
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    const results = Array.isArray(data?.results) ? data.results : []

    return results
      .filter(
        (result: any) =>
          typeof result?.latitude === 'number' &&
          typeof result?.longitude === 'number',
      )
      .map((result: any) => ({
        name: String(result.name ?? ''),
        country: String(result.country ?? ''),
        cc: String(result.country_code ?? ''),
        lat: result.latitude,
        lng: result.longitude,
        admin: result.admin1 ? String(result.admin1) : undefined,
      }))
  } catch {
    return []
  }
}
