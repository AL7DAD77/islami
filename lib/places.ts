import type { MethodKey } from './settings'

export interface City {
  name: string
  country: string
  lat: number
  lng: number
  method: MethodKey
}

export const CITIES: City[] = [
  { name: 'مكة المكرمة', country: 'السعودية', lat: 21.4225, lng: 39.8262, method: 'UmmAlQura' },
  { name: 'المدينة المنورة', country: 'السعودية', lat: 24.4672, lng: 39.6111, method: 'UmmAlQura' },
  { name: 'الرياض', country: 'السعودية', lat: 24.7136, lng: 46.6753, method: 'UmmAlQura' },
  { name: 'جدة', country: 'السعودية', lat: 21.5433, lng: 39.1728, method: 'UmmAlQura' },
  { name: 'القاهرة', country: 'مصر', lat: 30.0444, lng: 31.2357, method: 'Egyptian' },
  { name: 'الإسكندرية', country: 'مصر', lat: 31.2001, lng: 29.9187, method: 'Egyptian' },
  { name: 'دبي', country: 'الإمارات', lat: 25.2048, lng: 55.2708, method: 'Dubai' },
  { name: 'أبوظبي', country: 'الإمارات', lat: 24.4539, lng: 54.3773, method: 'Dubai' },
  { name: 'الكويت', country: 'الكويت', lat: 29.3759, lng: 47.9774, method: 'Kuwait' },
  { name: 'الدوحة', country: 'قطر', lat: 25.2854, lng: 51.531, method: 'Qatar' },
  { name: 'المنامة', country: 'البحرين', lat: 26.2285, lng: 50.586, method: 'UmmAlQura' },
  { name: 'مسقط', country: 'عمان', lat: 23.588, lng: 58.3829, method: 'UmmAlQura' },
  { name: 'عمّان', country: 'الأردن', lat: 31.9454, lng: 35.9284, method: 'MuslimWorldLeague' },
  { name: 'القدس', country: 'فلسطين', lat: 31.7683, lng: 35.2137, method: 'MuslimWorldLeague' },
  { name: 'دمشق', country: 'سوريا', lat: 33.5138, lng: 36.2765, method: 'MuslimWorldLeague' },
  { name: 'بيروت', country: 'لبنان', lat: 33.8938, lng: 35.5018, method: 'MuslimWorldLeague' },
  { name: 'بغداد', country: 'العراق', lat: 33.3152, lng: 44.3661, method: 'MuslimWorldLeague' },
  { name: 'صنعاء', country: 'اليمن', lat: 15.3694, lng: 44.191, method: 'UmmAlQura' },
  { name: 'الخرطوم', country: 'السودان', lat: 15.5007, lng: 32.5599, method: 'Egyptian' },
  { name: 'طرابلس', country: 'ليبيا', lat: 32.8872, lng: 13.1913, method: 'Egyptian' },
  { name: 'تونس', country: 'تونس', lat: 36.8065, lng: 10.1815, method: 'MuslimWorldLeague' },
  { name: 'الجزائر', country: 'الجزائر', lat: 36.7538, lng: 3.0588, method: 'MuslimWorldLeague' },
  { name: 'الرباط', country: 'المغرب', lat: 34.0209, lng: -6.8416, method: 'MuslimWorldLeague' },
  { name: 'الدار البيضاء', country: 'المغرب', lat: 33.5731, lng: -7.5898, method: 'MuslimWorldLeague' },
  { name: 'نواكشوط', country: 'موريتانيا', lat: 18.0735, lng: -15.9582, method: 'MuslimWorldLeague' },
  { name: 'إسطنبول', country: 'تركيا', lat: 41.0082, lng: 28.9784, method: 'Turkey' },
  { name: 'كراتشي', country: 'باكستان', lat: 24.8607, lng: 67.0011, method: 'Karachi' },
  { name: 'جاكرتا', country: 'إندونيسيا', lat: -6.2088, lng: 106.8456, method: 'Singapore' },
  { name: 'كوالالمبور', country: 'ماليزيا', lat: 3.139, lng: 101.6869, method: 'Singapore' },
  { name: 'لندن', country: 'المملكة المتحدة', lat: 51.5074, lng: -0.1278, method: 'MoonsightingCommittee' },
  { name: 'باريس', country: 'فرنسا', lat: 48.8566, lng: 2.3522, method: 'MuslimWorldLeague' },
  { name: 'برلين', country: 'ألمانيا', lat: 52.52, lng: 13.405, method: 'MuslimWorldLeague' },
  { name: 'نيويورك', country: 'الولايات المتحدة', lat: 40.7128, lng: -74.006, method: 'NorthAmerica' },
  { name: 'تورونتو', country: 'كندا', lat: 43.6532, lng: -79.3832, method: 'NorthAmerica' },
]

export const COUNTRY_METHOD: Record<string, MethodKey> = {
  SA: 'UmmAlQura', YE: 'UmmAlQura', BH: 'UmmAlQura', OM: 'UmmAlQura',
  EG: 'Egyptian', SD: 'Egyptian', LY: 'Egyptian', SY: 'Egyptian', IQ: 'Egyptian', LB: 'Egyptian',
  AE: 'Dubai', KW: 'Kuwait', QA: 'Qatar', TR: 'Turkey', PK: 'Karachi', IN: 'Karachi', BD: 'Karachi', AF: 'Karachi',
  MY: 'Singapore', SG: 'Singapore', ID: 'Singapore', IR: 'Tehran',
  US: 'NorthAmerica', CA: 'NorthAmerica', GB: 'MoonsightingCommittee',
}

export const ADHAN_VOICES = [
  { id: 'a1', label: 'الأذان - الصوت الأول' },
  { id: 'a2', label: 'الأذان - الصوت الثاني' },
  { id: 'a3', label: 'الأذان - الصوت الثالث' },
  { id: 'a4', label: 'الأذان - الصوت الرابع' },
  { id: 'a5', label: 'الأذان - الصوت الخامس' },
  { id: 'a6', label: 'الأذان - الصوت السادس' },
  { id: 'a7', label: 'الأذان - الصوت السابع' },
  { id: 'a8', label: 'الأذان - الصوت الثامن' },
  { id: 'a9', label: 'الأذان - الصوت التاسع' },
  { id: 'a10', label: 'الأذان - الصوت العاشر' },
]

export function adhanUrl(id: string) {
  return `https://cdn.aladhan.com/audio/adhans/${id}.mp3`
}

export async function reverseGeocode(lat: number, lng: number) {
  const res = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ar`,
  )
  if (!res.ok) throw new Error('geocode failed')
  const data = await res.json()
  return {
    city: (data.city || data.locality || data.principalSubdivision || 'موقعي الحالي') as string,
    country: (data.countryName || '') as string,
    countryCode: (data.countryCode || '') as string,
  }
}
