import { CalculationMethod, Coordinates, Madhab, PrayerTimes, Qibla } from 'adhan'
import type { AppSettings, MethodKey, PrayerKey } from './settings'

export const PRAYER_NAMES: Record<PrayerKey | 'sunrise', string> = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
}

export const METHODS: { key: MethodKey; label: string }[] = [
  { key: 'UmmAlQura', label: 'أم القرى - مكة المكرمة' },
  { key: 'Egyptian', label: 'الهيئة المصرية العامة للمساحة' },
  { key: 'MuslimWorldLeague', label: 'رابطة العالم الإسلامي' },
  { key: 'Karachi', label: 'جامعة العلوم الإسلامية - كراتشي' },
  { key: 'Dubai', label: 'دبي' },
  { key: 'Kuwait', label: 'الكويت' },
  { key: 'Qatar', label: 'قطر' },
  { key: 'Turkey', label: 'رئاسة الشؤون الدينية - تركيا' },
  { key: 'NorthAmerica', label: 'الجمعية الإسلامية لأمريكا الشمالية' },
  { key: 'MoonsightingCommittee', label: 'لجنة رؤية الهلال' },
  { key: 'Singapore', label: 'سنغافورة' },
  { key: 'Tehran', label: 'طهران' },
]

export interface DayTimes {
  fajr: Date
  sunrise: Date
  dhuhr: Date
  asr: Date
  maghrib: Date
  isha: Date
}

export function getPrayerTimes(settings: AppSettings, date = new Date()): DayTimes {
  const coords = new Coordinates(settings.location.lat, settings.location.lng)
  const params = CalculationMethod[settings.method]()
  params.madhab = settings.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi
  const t = new PrayerTimes(coords, date, params)
  return { fajr: t.fajr, sunrise: t.sunrise, dhuhr: t.dhuhr, asr: t.asr, maghrib: t.maghrib, isha: t.isha }
}

export const PRAYER_ORDER: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

export function getNextPrayer(settings: AppSettings, now = new Date()) {
  const today = getPrayerTimes(settings, now)
  for (const key of PRAYER_ORDER) {
    if (today[key] > now) return { key, time: today[key] }
  }
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return { key: 'fajr' as PrayerKey, time: getPrayerTimes(settings, tomorrow).fajr }
}

export function getQiblaDirection(lat: number, lng: number) {
  return Qibla(new Coordinates(lat, lng))
}

export function formatTime(d: Date) {
  return d.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
