'use client'

import { useCallback, useEffect, useState } from 'react'

export type MethodKey =
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'Karachi'
  | 'UmmAlQura'
  | 'Dubai'
  | 'Kuwait'
  | 'Qatar'
  | 'Singapore'
  | 'Tehran'
  | 'Turkey'
  | 'NorthAmerica'
  | 'MoonsightingCommittee'
  | 'JordanAwqaf'
  | 'AlgeriaMinistry'
  | 'TunisiaMinistry'
  | 'MoroccoHabous'

export type PrayerKey =
  | 'fajr'
  | 'sunrise'
  | 'dhuhr'
  | 'asr'
  | 'maghrib'
  | 'isha'

export type NumberFormat = 'arabic' | 'english'

export type Madhab = 'shafi' | 'hanafi'

export type LocationStatus = 'unknown' | 'ok' | 'denied' | 'error'

export interface LocationSettings {
  lat: number
  lng: number
  city: string
  country: string
  countryCode: string
  auto: boolean
}

export interface WirdSettings {
  currentPage: number
  pagesPerDay: number
  lastDoneDate: string
  streak: number
}

export interface AppSettings {
  method: MethodKey
  madhab: Madhab

  location: LocationSettings
  locationStatus: LocationStatus

  adhanEnabled: Record<PrayerKey, boolean>

  adhanVoice: string
  fajrVoice: string
  prayerVoices: Partial<Record<PrayerKey, string>>
  adhanVolume: number

  notificationsEnabled: boolean
  persistentNotification: boolean
  vibrationEnabled: boolean

  preAdhanEnabled: boolean
  preAdhanMinutes: number

  numberFormat: NumberFormat

  hijriAdjust: number

  showDailyMessage: boolean

  salawatEnabled: boolean
  salawatInterval: number

  adhkarRemindersEnabled: boolean
  adhkarRemindersInterval: number

  wird: WirdSettings
}

export type SettingsUpdater = (
  current: AppSettings,
) => Partial<AppSettings>

export type SettingsUpdate =
  | Partial<AppSettings>
  | SettingsUpdater

const STORAGE_KEY = 'adhan-app-settings'

export const DEFAULT_SETTINGS: AppSettings = {
  method: 'UmmAlQura',
  madhab: 'shafi',

  location: {
    lat: 21.4225,
    lng: 39.8262,
    city: 'مكة المكرمة',
    country: 'السعودية',
    countryCode: 'SA',
    auto: false,
  },

  locationStatus: 'unknown',

  adhanEnabled: {
    fajr: true,
    sunrise: false,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },

  adhanVoice: 'a1',
  fajrVoice: 'fajr',
  prayerVoices: {},
  adhanVolume: 1,

  notificationsEnabled: true,
  persistentNotification: false,
  vibrationEnabled: true,

  preAdhanEnabled: false,
  preAdhanMinutes: 10,

  numberFormat: 'arabic',

  hijriAdjust: 0,

  showDailyMessage: true,

  salawatEnabled: false,
  salawatInterval: 60,

  adhkarRemindersEnabled: false,
  adhkarRemindersInterval: 60,

  wird: {
    currentPage: 1,
    pagesPerDay: 1,
    lastDoneDate: '',
    streak: 0,
  },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isLocationSettings(value: unknown): value is LocationSettings {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.lat === 'number' &&
    Number.isFinite(value.lat) &&
    typeof value.lng === 'number' &&
    Number.isFinite(value.lng) &&
    typeof value.city === 'string' &&
    typeof value.country === 'string' &&
    typeof value.countryCode === 'string' &&
    typeof value.auto === 'boolean'
  )
}

function normalizeAdhanEnabled(value: unknown): Record<PrayerKey, boolean> {
  const source = isRecord(value) ? value : {}

  return {
    fajr: source.fajr !== false,
    sunrise: source.sunrise === true,
    dhuhr: source.dhuhr !== false,
    asr: source.asr !== false,
    maghrib: source.maghrib !== false,
    isha: source.isha !== false,
  }
}

function normalizePrayerVoices(
  value: unknown,
): Partial<Record<PrayerKey, string>> {
  if (!isRecord(value)) {
    return {}
  }

  const result: Partial<Record<PrayerKey, string>> = {}

  const keys: PrayerKey[] = [
    'fajr',
    'sunrise',
    'dhuhr',
    'asr',
    'maghrib',
    'isha',
  ]

  keys.forEach(key => {
    const voice = value[key]

    if (typeof voice === 'string' && voice) {
      result[key] = voice
    }
  })

  return result
}

function normalizeWird(value: unknown): WirdSettings {
  if (!isRecord(value)) {
    return structuredClone(DEFAULT_SETTINGS.wird)
  }

  const currentPage =
    typeof value.currentPage === 'number' &&
    Number.isFinite(value.currentPage)
      ? Math.max(1, Math.round(value.currentPage))
      : DEFAULT_SETTINGS.wird.currentPage

  const pagesPerDay =
    typeof value.pagesPerDay === 'number' &&
    Number.isFinite(value.pagesPerDay)
      ? Math.max(1, Math.round(value.pagesPerDay))
      : DEFAULT_SETTINGS.wird.pagesPerDay

  const lastDoneDate =
    typeof value.lastDoneDate === 'string'
      ? value.lastDoneDate
      : DEFAULT_SETTINGS.wird.lastDoneDate

  const streak =
    typeof value.streak === 'number' &&
    Number.isFinite(value.streak)
      ? Math.max(0, Math.round(value.streak))
      : DEFAULT_SETTINGS.wird.streak

  return {
    currentPage,
    pagesPerDay,
    lastDoneDate,
    streak,
  }
}

function normalizeSettings(value: unknown): AppSettings {
  if (!isRecord(value)) {
    return structuredClone(DEFAULT_SETTINGS)
  }

  const method =
    typeof value.method === 'string' ? value.method : DEFAULT_SETTINGS.method

  const madhab =
    value.madhab === 'hanafi' ? 'hanafi' : 'shafi'

  const location = isLocationSettings(value.location)
    ? value.location
    : structuredClone(DEFAULT_SETTINGS.location)

  const locationStatus =
    value.locationStatus === 'ok' ||
    value.locationStatus === 'denied' ||
    value.locationStatus === 'error'
      ? value.locationStatus
      : 'unknown'

  const numberFormat =
    value.numberFormat === 'english' ? 'english' : 'arabic'

  const hijriAdjust =
    typeof value.hijriAdjust === 'number' &&
    Number.isFinite(value.hijriAdjust)
      ? Math.round(value.hijriAdjust)
      : DEFAULT_SETTINGS.hijriAdjust

  const showDailyMessage =
    typeof value.showDailyMessage === 'boolean'
      ? value.showDailyMessage
      : DEFAULT_SETTINGS.showDailyMessage

  const fajrVoice =
    typeof value.fajrVoice === 'string' && value.fajrVoice
      ? value.fajrVoice
      : DEFAULT_SETTINGS.fajrVoice

  const prayerVoices = normalizePrayerVoices(value.prayerVoices)

  const salawatEnabled =
    typeof value.salawatEnabled === 'boolean'
      ? value.salawatEnabled
      : DEFAULT_SETTINGS.salawatEnabled

  const salawatInterval =
    typeof value.salawatInterval === 'number' &&
    Number.isFinite(value.salawatInterval)
      ? Math.max(1, Math.round(value.salawatInterval))
      : DEFAULT_SETTINGS.salawatInterval

  const adhkarRemindersEnabled =
    typeof value.adhkarRemindersEnabled === 'boolean'
      ? value.adhkarRemindersEnabled
      : DEFAULT_SETTINGS.adhkarRemindersEnabled

  const adhkarRemindersInterval =
    typeof value.adhkarRemindersInterval === 'number' &&
    Number.isFinite(value.adhkarRemindersInterval)
      ? Math.max(1, Math.round(value.adhkarRemindersInterval))
      : DEFAULT_SETTINGS.adhkarRemindersInterval

  const wird = normalizeWird(value.wird)

  return {
    method: method as MethodKey,
    madhab,

    location,

    locationStatus,

    adhanEnabled: normalizeAdhanEnabled(value.adhanEnabled),

    adhanVoice:
      typeof value.adhanVoice === 'string'
        ? value.adhanVoice
        : DEFAULT_SETTINGS.adhanVoice,

    fajrVoice,

    prayerVoices,

    adhanVolume:
      typeof value.adhanVolume === 'number' &&
      Number.isFinite(value.adhanVolume)
        ? Math.min(1, Math.max(0, value.adhanVolume))
        : DEFAULT_SETTINGS.adhanVolume,

    notificationsEnabled:
      typeof value.notificationsEnabled === 'boolean'
        ? value.notificationsEnabled
        : DEFAULT_SETTINGS.notificationsEnabled,

    persistentNotification:
      typeof value.persistentNotification === 'boolean'
        ? value.persistentNotification
        : DEFAULT_SETTINGS.persistentNotification,

    vibrationEnabled:
      typeof value.vibrationEnabled === 'boolean'
        ? value.vibrationEnabled
        : DEFAULT_SETTINGS.vibrationEnabled,

    preAdhanEnabled:
      typeof value.preAdhanEnabled === 'boolean'
        ? value.preAdhanEnabled
        : DEFAULT_SETTINGS.preAdhanEnabled,

    preAdhanMinutes:
      typeof value.preAdhanMinutes === 'number' &&
      Number.isFinite(value.preAdhanMinutes)
        ? Math.min(120, Math.max(1, Math.round(value.preAdhanMinutes)))
        : DEFAULT_SETTINGS.preAdhanMinutes,

    numberFormat,

    hijriAdjust,

    showDailyMessage,

    salawatEnabled,

    salawatInterval,

    adhkarRemindersEnabled,

    adhkarRemindersInterval,

    wird,
  }
}

function readStoredSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return structuredClone(DEFAULT_SETTINGS)
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return structuredClone(DEFAULT_SETTINGS)
    }

    return normalizeSettings(JSON.parse(raw))
  } catch {
    return structuredClone(DEFAULT_SETTINGS)
  }
}

function writeStoredSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings),
    )
  } catch {
    // قد يكون التخزين محظوراً أو ممتلئاً؛ لا نوقف التطبيق
  }
}

let currentSettings: AppSettings | null = null

export function getSettings(): AppSettings {
  if (!currentSettings) {
    currentSettings = readStoredSettings()
  }

  return currentSettings
}

export function updateSettings(update: SettingsUpdate): AppSettings {
  const current = getSettings()

  const patch: Partial<AppSettings> =
    typeof update === 'function' ? update(current) : update

  const next: AppSettings = {
    ...current,
    ...patch,

    location: {
      ...current.location,
      ...(patch.location ?? {}),
    },

    adhanEnabled: {
      ...current.adhanEnabled,
      ...(patch.adhanEnabled ?? {}),
    },

    prayerVoices: {
      ...current.prayerVoices,
      ...(patch.prayerVoices ?? {}),
    },

    wird: {
      ...current.wird,
      ...(patch.wird ?? {}),
    },
  }

  currentSettings = normalizeSettings(next)
  writeStoredSettings(currentSettings)

  return currentSettings
}

export function resetSettings(): AppSettings {
  currentSettings = structuredClone(DEFAULT_SETTINGS)
  writeStoredSettings(currentSettings)

  return currentSettings
}

export type UseSettingsResult = [
  AppSettings,
  (update: SettingsUpdate) => void,
]

export function useSettings(): UseSettingsResult {
  const [settings, setState] = useState<AppSettings>(() =>
    structuredClone(DEFAULT_SETTINGS),
  )

  const update = useCallback((value: SettingsUpdate) => {
    const next = updateSettings(value)
    setState(next)
  }, [])

  useEffect(() => {
    setState(getSettings())

    const handleStorage = () => {
      setState(getSettings())
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  return [settings, update]
}

export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return hydrated
}