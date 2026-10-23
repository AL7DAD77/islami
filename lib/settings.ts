'use client'

import { useCallback, useSyncExternalStore } from 'react'

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'

export type MethodKey =
  | 'Egyptian'
  | 'UmmAlQura'
  | 'MuslimWorldLeague'
  | 'JordanAwqaf'
  | 'AlgeriaMinistry'
  | 'TunisiaMinistry'
  | 'MoroccoHabous'
  | 'Karachi'
  | 'Dubai'
  | 'Kuwait'
  | 'Qatar'
  | 'Turkey'
  | 'NorthAmerica'
  | 'MoonsightingCommittee'
  | 'Singapore'
  | 'Tehran'

export interface AppSettings {
  location: {
    lat: number
    lng: number
    city: string
    country: string
    countryCode?: string
    auto: boolean
  }
  method: MethodKey
  madhab: 'shafi' | 'hanafi'
  hijriAdjust: number
  adhanVoice: string
  fajrVoice: string
  prayerVoices: Partial<Record<PrayerKey, string>>
  adhanEnabled: Record<PrayerKey, boolean>
  adhanVolume: number
  reminderMinutes: number
  reciterId: number | null
  reciterServer: string | null
  quranFontSize: number
  lastRead: { surah: number; name: string } | null
  wird: { pagesPerDay: number; currentPage: number; lastDoneDate: string | null; streak: number }
  dhikrCounter: number
  persistentNotification: boolean
  locationStatus: 'unknown' | 'ok' | 'denied' | 'error'
  quranView: 'scroll' | 'pages'
  quranFitPage: boolean
  showDailyMessage: boolean
  ayahHighlight: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  location: { lat: 21.4225, lng: 39.8262, city: 'مكة المكرمة', country: 'السعودية', auto: true },
  method: 'UmmAlQura',
  madhab: 'shafi',
  hijriAdjust: 0,
  adhanVoice: 'makkah',
  fajrVoice: 'fajr',
  prayerVoices: {},
  adhanEnabled: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
  adhanVolume: 0.9,
  reminderMinutes: 10,
  reciterId: null,
  reciterServer: null,
  quranFontSize: 30,
  lastRead: null,
  wird: { pagesPerDay: 4, currentPage: 1, lastDoneDate: null, streak: 0 },
  dhikrCounter: 0,
  persistentNotification: true,
  locationStatus: 'unknown',
  quranView: 'scroll',
  quranFitPage: true,
  showDailyMessage: true,
  ayahHighlight: true,
}

const KEY = 'noor-settings-v1'
const listeners = new Set<() => void>()
let cached: AppSettings | null = null

function read(): AppSettings {
  if (cached) return cached
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    cached = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      location: { ...DEFAULT_SETTINGS.location, ...parsed.location },
      adhanEnabled: { ...DEFAULT_SETTINGS.adhanEnabled, ...parsed.adhanEnabled },
      prayerVoices: { ...(parsed.prayerVoices ?? {}) },
      wird: { ...DEFAULT_SETTINGS.wird, ...parsed.wird },
    }
  } catch {
    cached = DEFAULT_SETTINGS
  }
  return cached as AppSettings
}

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  return read()
}

export function updateSettings(patch: Partial<AppSettings> | ((s: AppSettings) => Partial<AppSettings>)) {
  const current = read()
  const next = { ...current, ...(typeof patch === 'function' ? patch(current) : patch) }
  cached = next
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {}
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cached = null
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useSettings() {
  const settings = useSyncExternalStore(subscribe, read, () => DEFAULT_SETTINGS)
  const update = useCallback(updateSettings, [])
  return [settings, update] as const
}

const noopSubscribe = () => () => {}
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
}