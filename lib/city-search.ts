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

export function searchCities(query: string, list: City[] = CITIES): City[] {
  const q = normalizeArabic(query)
  if (!q) return list
  return list.filter((c) => normalizeArabic(`${c.name} ${c.country}`).includes(q))
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** أقرب مدينة من القائمة المحلية (تُستخدم عند فشل تحديد اسم المدينة بلا إنترنت) */
export function nearestCity(lat: number, lng: number, maxKm = 40, list: City[] = CITIES): City | null {
  let best: City | null = null
  let bestD = Infinity
  for (const c of list) {
    const d = distanceKm(lat, lng, c.lat, c.lng)
    if (d < bestD) {
      bestD = d
      best = c
    }
  }
  return best && bestD <= maxKm ? best : null
}

export function methodForCountry(cc: string | undefined, fallback: MethodKey = 'MuslimWorldLeague'): MethodKey {
  return (cc && COUNTRY_METHOD[cc.toUpperCase()]) || fallback
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
export async function searchCitiesOnline(query: string, signal?: AbortSignal): Promise<OnlineCity[]> {
  const q = query.trim()
  if (q.length < 2) return []
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=10&language=ar&format=json`,
      { signal },
    )
    if (!res.ok) return []
    const json = await res.json()
    const rows = Array.isArray(json?.results) ? json.results : []
    return rows
      .filter((r: any) => typeof r.latitude === 'number' && typeof r.longitude === 'number')
      .map((r: any) => ({
        name: String(r.name ?? ''),
        country: String(r.country ?? ''),
        cc: String(r.country_code ?? ''),
        lat: r.latitude,
        lng: r.longitude,
        admin: r.admin1 ? String(r.admin1) : undefined,
      }))
  } catch {
    return []
  }
}
