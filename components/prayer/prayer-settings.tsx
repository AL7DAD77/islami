'use client'

import { useState, useEffect } from 'react'
import {
  MapPin,
  Calculator,
  Bell,
  BellRing,
  ChevronDown,
  RefreshCw,
  Check,
  Vibrate,
  ShieldAlert,
  Languages,
  Hash,
  AlarmClock,
} from 'lucide-react'
import {
  useSettings,
  useHydrated,
  type MethodKey,
  type PrayerKey,
  type NumberFormat,
} from '@/lib/settings'
import { PRAYER_NAMES, PRAYER_ORDER } from '@/lib/prayer'
import { CITIES, type City } from '@/lib/places'
import {
  methodForCountry,
  searchCities,
  searchCitiesOnline,
  normalizeArabic,
  type OnlineCity,
} from '@/lib/city-search'
import { updateAutoLocation } from '@/lib/location'
import { cn } from '@/lib/utils'
import {
  isNativePlatform,
  setPersistentNotification,
} from '@/lib/native'
import { registerPlugin } from '@capacitor/core'
import { App } from '@capacitor/app'
import { useLanguage } from '@/lib/language-context'

const SystemSettings = isNativePlatform()
  ? registerPlugin<any>('SystemSettings')
  : null

const METHODS: { id: MethodKey }[] = [
  { id: 'UmmAlQura' },
  { id: 'Egyptian' },
  { id: 'MuslimWorldLeague' },
  { id: 'JordanAwqaf' },
  { id: 'AlgeriaMinistry' },
  { id: 'TunisiaMinistry' },
  { id: 'MoroccoHabous' },
  { id: 'Karachi' },
  { id: 'Dubai' },
  { id: 'Kuwait' },
  { id: 'Qatar' },
  { id: 'Turkey' },
  { id: 'NorthAmerica' },
  { id: 'Singapore' },
  { id: 'MoonsightingCommittee' },
]

const PRE_ADHAN_MINUTES = [5, 10, 15, 30]

export function PrayerSettings() {
  const [settings, update] = useSettings()
  const hydrated = useHydrated()
  const { locale, setLocale, dict } = useLanguage()

  const [openCityPicker, setOpenCityPicker] = useState(false)
  const [openMethodPicker, setOpenMethodPicker] = useState(false)
  const [locating, setLocating] = useState(false)
  const [isNotifPending, setIsNotifPending] = useState(false)

  const [hasOverlay, setHasOverlay] = useState(true)

  const [query, setQuery] = useState('')
  const [online, setOnline] = useState<OnlineCity[]>([])
  const [searching, setSearching] = useState(false)

  const checkOverlayStatus = async () => {
    try {
      if (SystemSettings) {
        const res = await SystemSettings.checkOverlayPermission()
        setHasOverlay(res.granted)
      }
    } catch (e) {
      console.log('Failed to check overlay permission', e)
    }
  }

  useEffect(() => {
    const syncNativeSettings = async () => {
      try {
        if (SystemSettings) {
          const res = await SystemSettings.getPreference({
            key: 'vibration_enabled',
          })

          if (res && res.value !== settings.vibrationEnabled) {
            update({ vibrationEnabled: res.value })
          }
        }
      } catch (e) {
        console.log('Failed to sync Android settings', e)
      }
    }

    if (hydrated) {
      syncNativeSettings()
      checkOverlayStatus()
    }

    let listener: any = null

    if (isNativePlatform()) {
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          checkOverlayStatus()
        }
      }).then(l => {
        listener = l
      })
    }

    return () => {
      if (listener) listener.remove()
    }
  }, [hydrated])

  const detectLocation = async () => {
    setLocating(true)

    const result = await updateAutoLocation({
      force: true,
      askPermission: true,
      highAccuracy: true,
    })

    setLocating(false)

    if (result === 'denied') {
      alert(
        isNativePlatform()
          ? dict.prayerSettingsPage.alerts.locationDenied
          : dict.prayerSettingsPage.alerts.locationDeniedWeb,
      )
    } else if (result === 'error') {
      alert(dict.prayerSettingsPage.alerts.locationError)
    }
  }

  useEffect(() => {
    if (!openCityPicker) return

    const q = query.trim()

    if (q.length < 2) {
      setOnline([])
      return
    }

    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      setSearching(true)

      const rows = await searchCitiesOnline(q, ctrl.signal)

      if (!ctrl.signal.aborted) {
        setOnline(rows)
        setSearching(false)
      }
    }, 450)

    return () => {
      clearTimeout(t)
      ctrl.abort()
      setSearching(false)
    }
  }, [query, openCityPicker])

  const applyManualCity = (
    name: string,
    country: string,
    cc: string,
    lat: number,
    lng: number,
    method?: MethodKey,
  ) => {
    update(s => {
      const countryChanged = !!cc && cc !== s.location.countryCode

      return {
        locationStatus: 'ok',
        location: {
          lat,
          lng,
          city: name,
          country,
          countryCode: cc,
          auto: false,
        },
        method: countryChanged
          ? (method ?? methodForCountry(cc, s.method))
          : s.method,
      }
    })

    setOpenCityPicker(false)
    setQuery('')
  }

  const selectCity = (c: City) =>
    applyManualCity(c.name, c.country, c.cc, c.lat, c.lng, c.method)

  const selectOnline = (c: OnlineCity) =>
    applyManualCity(
      c.admin && c.admin !== c.name ? `${c.name} - ${c.admin}` : c.name,
      c.country,
      c.cc,
      c.lat,
      c.lng,
    )

  const localMatches = searchCities(query)
  const localNames = new Set(localMatches.map(c => normalizeArabic(c.name)))
  const onlineMatches = online.filter(
    o => !localNames.has(normalizeArabic(o.name)),
  )

  const toggleVibration = async () => {
    const nextValue = !settings.vibrationEnabled

    update({ vibrationEnabled: nextValue })

    if (!SystemSettings) return

    try {
      await SystemSettings.setPreference({
        key: 'vibration_enabled',
        value: nextValue,
      })
    } catch (e) {
      console.log('Failed to save vibration setting on Android', e)
    }
  }

  const requestOverlayPermission = async () => {
    try {
      if (SystemSettings) {
        await SystemSettings.requestOverlayPermission()
      }
    } catch (e) {
      console.log('Failed to open overlay permission screen', e)
      alert(dict.prayerSettingsPage.alerts.overlayManual)
    }
  }

  const setNumberFormat = (format: NumberFormat) => {
    update({ numberFormat: format })
  }

  const togglePreAdhan = () => {
    update(s => ({
      preAdhanEnabled: !s.preAdhanEnabled,
    }))
  }

  const setPreAdhanMinutes = (minutes: number) => {
    update({ preAdhanMinutes: minutes })
  }

  if (!hydrated) {
    return (
      <div
        className="h-96 animate-pulse rounded-2xl bg-card"
        aria-hidden="true"
      />
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
      {/* الموقع */}
      <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <MapPin className="size-4" />
          </span>
          <h3 className="font-bold text-foreground">
            {dict.prayerSettingsPage.location}
          </h3>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              {dict.prayerSettingsPage.currentCity}
            </p>
            <p className="font-bold text-foreground">
              {settings.location.city}{' '}
              {settings.location.country && ` - ${settings.location.country}`}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={detectLocation}
              disabled={locating}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {locating ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <MapPin className="size-4" />
              )}
              {locating
                ? dict.prayerSettingsPage.detecting
                : dict.prayerSettingsPage.detectLocation}
            </button>

            <button
              type="button"
              onClick={() => setOpenCityPicker(!openCityPicker)}
              className="flex items-center justify-center gap-2 rounded-xl bg-muted px-3 py-2.5 text-sm text-foreground"
            >
              <ChevronDown
                className={cn(
                  'size-4 transition',
                  openCityPicker && 'rotate-180',
                )}
              />
              {dict.prayerSettingsPage.manualSelect}
            </button>
          </div>

          {openCityPicker && (
            <div className="mt-2 space-y-2">
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={dict.prayerSettingsPage.searchCityPlaceholder}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
              />

              <div className="max-h-72 overflow-y-auto rounded-xl border border-border">
                {localMatches.map(c => (
                  <button
                    key={`${c.cc}-${c.name}`}
                    type="button"
                    onClick={() => selectCity(c)}
                    className="flex w-full items-center justify-between border-b border-border px-3 py-2.5 text-right text-sm last:border-0 hover:bg-muted"
                  >
                    <span>
                      {c.name}{' '}
                      <span className="text-xs text-muted-foreground">
                        - {c.country}
                      </span>
                    </span>
                  </button>
                ))}

                {onlineMatches.map(c => (
                  <button
                    key={`online-${c.lat}-${c.lng}`}
                    type="button"
                    onClick={() => selectOnline(c)}
                    className="flex w-full items-center justify-between border-b border-border px-3 py-2.5 text-right text-sm last:border-0 hover:bg-muted"
                  >
                    <span>
                      {c.name}{' '}
                      <span className="text-xs text-muted-foreground">
                        {` - ${[c.admin, c.country].filter(Boolean).join(', ')}`}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* طريقة الحساب */}
      <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Calculator className="size-4" />
          </span>
          <h3 className="font-bold text-foreground">
            {dict.prayerSettingsPage.calcMethod}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setOpenMethodPicker(!openMethodPicker)}
          className="flex w-full items-center justify-between rounded-xl bg-muted/50 px-3 py-3 text-right text-foreground"
        >
          <span className="font-medium">
            {(dict.prayerSettingsPage.methods as Record<string, string>)[
              settings.method
            ] ?? dict.prayerSettingsPage.methods.UmmAlQura}
          </span>
          <ChevronDown
            className={cn(
              'size-4 transition',
              openMethodPicker && 'rotate-180',
            )}
          />
        </button>

        {openMethodPicker && (
          <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-border">
            {METHODS.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  update({ method: m.id })
                  setOpenMethodPicker(false)
                }}
                className="flex w-full items-center justify-between border-b border-border px-3 py-2.5 text-right text-sm text-foreground last:border-0 hover:bg-muted"
              >
                <span>
                  {
                    (dict.prayerSettingsPage.methods as Record<string, string>)[
                      m.id
                    ]
                  }
                </span>
                {settings.method === m.id && (
                  <Check className="size-4 text-emerald-600" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3">
          <p className="mb-2 text-xs text-muted-foreground">
            {dict.prayerSettingsPage.asrMadhab}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => update({ madhab: 'shafi' })}
              className={cn(
                'flex-1 rounded-xl px-3 py-2 text-sm',
                settings.madhab === 'shafi'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground',
              )}
            >
              {dict.prayerSettingsPage.shafiMalikiHanbali}
            </button>

            <button
              type="button"
              onClick={() => update({ madhab: 'hanafi' })}
              className={cn(
                'flex-1 rounded-xl px-3 py-2 text-sm',
                settings.madhab === 'hanafi'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground',
              )}
            >
              {dict.prayerSettingsPage.hanafi}
            </button>
          </div>
        </div>
      </section>

      {/* تفعيل الأذان */}
      <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Bell className="size-4" />
          </span>
          <h3 className="font-bold text-foreground">
            {dict.prayerSettingsPage.adhanActivation}
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              {dict.prayerSettingsPage.adhanSelectPrayers}
            </p>

            <div className="grid grid-cols-5 gap-2">
              {PRAYER_ORDER.map((key: PrayerKey) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    update(s => ({
                      adhanEnabled: {
                        ...s.adhanEnabled,
                        [key]: !s.adhanEnabled[key],
                      },
                    }))
                  }
                  className={cn(
                    'rounded-xl px-2 py-2 text-xs font-medium transition',
                    settings.adhanEnabled[key]
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {PRAYER_NAMES[key]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* تنبيه قبل الأذان */}
      <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <AlarmClock className="size-4" />
          </span>
          <h3 className="font-bold text-foreground">
            {dict.prayerSettingsPage.preAdhanTitle}
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {dict.prayerSettingsPage.preAdhanEnable}
              </p>
              <p className="text-xs text-muted-foreground">
                {dict.prayerSettingsPage.preAdhanEnableDesc}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={settings.preAdhanEnabled}
              onClick={togglePreAdhan}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                settings.preAdhanEnabled
                  ? 'bg-emerald-600'
                  : 'bg-zinc-400',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 size-5 rounded-full bg-white transition-all',
                  settings.preAdhanEnabled
                    ? 'right-0.5'
                    : 'right-5.5',
                )}
              />
            </button>
          </div>

          {settings.preAdhanEnabled && (
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="mb-2 text-xs text-muted-foreground">
                {dict.prayerSettingsPage.preAdhanMinutesTitle}
              </p>

              <div className="grid grid-cols-4 gap-2">
                {PRE_ADHAN_MINUTES.map(minutes => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setPreAdhanMinutes(minutes)}
                    className={cn(
                      'rounded-xl px-2 py-2 text-xs font-medium transition',
                      settings.preAdhanMinutes === minutes
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {
                      (dict.prayerSettingsPage.preAdhanMinutes as Record<
                        string,
                        string
                      >)[String(minutes)]
                    }
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* الإشعارات والاهتزاز */}
      <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <BellRing className="size-4" />
          </span>
          <h3 className="font-bold text-foreground">
            {dict.prayerSettingsPage.notifications}
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {dict.prayerSettingsPage.persistentNotification}
              </p>
              <p className="text-xs text-muted-foreground">
                {dict.prayerSettingsPage.persistentNotificationDesc}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={settings.persistentNotification}
              disabled={isNotifPending}
              onClick={async () => {
                setIsNotifPending(true)

                const next = !settings.persistentNotification

                update({ persistentNotification: next })

                try {
                  await setPersistentNotification(next)
                } catch (e) {
                  update({ persistentNotification: !next })
                  alert(dict.prayerSettingsPage.alerts.notificationError)
                } finally {
                  setIsNotifPending(false)
                }
              }}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                settings.persistentNotification
                  ? 'bg-emerald-600'
                  : 'bg-zinc-400',
                isNotifPending && 'opacity-50',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 size-5 rounded-full bg-white transition-all',
                  settings.persistentNotification
                    ? 'right-0.5'
                    : 'right-5.5',
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
            <div className="flex flex-1 items-center gap-2">
              <Vibrate className="size-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">
                  {dict.prayerSettingsPage.vibration}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dict.prayerSettingsPage.vibrationDesc}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={settings.vibrationEnabled}
              onClick={toggleVibration}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                settings.vibrationEnabled
                  ? 'bg-emerald-600'
                  : 'bg-zinc-400',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 size-5 rounded-full bg-white transition-all',
                  settings.vibrationEnabled ? 'right-0.5' : 'right-5.5',
                )}
              />
            </button>
          </div>

          {!hasOverlay && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30 animate-in fade-in">
              <div className="flex flex-1 items-center gap-2">
                <ShieldAlert className="size-5 text-amber-600 dark:text-amber-500" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    {dict.prayerSettingsPage.overlayPermission}
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    {dict.prayerSettingsPage.overlayPermissionDesc}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={requestOverlayPermission}
                className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-amber-700 active:scale-95"
              >
                {dict.prayerSettingsPage.enable}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3 mt-4 border border-border">
            <div className="flex items-center gap-2 flex-1">
              <Languages className="size-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">
                  {dict.prayerSettingsPage.appLanguage}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dict.prayerSettingsPage.appLanguageDesc}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition active:scale-95 shadow-sm"
            >
              {locale === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
        </div>
      </section>

      {/* تنسيق الأرقام */}
      <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Hash className="size-4" />
          </span>
          <h3 className="font-bold text-foreground">
            تنسيق الأرقام
          </h3>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setNumberFormat('arabic')}
            className={cn(
              'flex-1 rounded-xl px-3 py-2 text-sm font-medium transition',
              settings.numberFormat === 'arabic'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground',
            )}
          >
            ١٢٣ عربية
          </button>

          <button
            type="button"
            onClick={() => setNumberFormat('english')}
            className={cn(
              'flex-1 rounded-xl px-3 py-2 text-sm font-medium transition',
              settings.numberFormat === 'english'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground',
            )}
          >
            123 إنجليزية
          </button>
        </div>
      </section>
    </div>
  )
}