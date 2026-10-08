'use client'

import { useState, useEffect } from 'react'
import { MapPin, Calculator, Bell, BellRing, ChevronDown, RefreshCw, Check } from 'lucide-react'
import { useSettings, useHydrated, type MethodKey, type PrayerKey } from '@/lib/settings'
import { PRAYER_NAMES, PRAYER_ORDER } from '@/lib/prayer'
import { COUNTRY_METHOD } from '@/lib/places'
import { toArabicNumber } from '@/lib/quran'
import { cn } from '@/lib/utils'

const METHODS: { id: MethodKey; name: string }[] = [
  { id: 'UmmAlQura', name: 'أم القرى (السعودية)' },
  { id: 'Egyptian', name: 'الهيئة المصرية' },
  { id: 'MuslimWorldLeague', name: 'رابطة العالم الإسلامي' },
  { id: 'Karachi', name: 'كراتشي (باكستان)' },
  { id: 'Dubai', name: 'دبي' },
  { id: 'Kuwait', name: 'الكويت' },
  { id: 'Qatar', name: 'قطر' },
  { id: 'Turkey', name: 'تركيا' },
  { id: 'NorthAmerica', name: 'أمريكا الشمالية' },
  { id: 'Singapore', name: 'سنغافورة' },
]

const CITIES = [
  { name: 'مكة المكرمة', lat: 21.4225, lng: 39.8262, country: 'السعودية' },
  { name: 'المدينة المنورة', lat: 24.4672, lng: 39.6111, country: 'السعودية' },
  { name: 'القاهرة', lat: 30.0444, lng: 31.2357, country: 'مصر' },
  { name: 'الرياض', lat: 24.7136, lng: 46.6753, country: 'السعودية' },
  { name: 'دبي', lat: 25.2048, lng: 55.2708, country: 'الإمارات' },
  { name: 'عمان', lat: 31.9454, lng: 35.9284, country: 'الأردن' },
  { name: 'بغداد', lat: 33.3152, lng: 44.3661, country: 'العراق' },
  { name: 'دمشق', lat: 33.5138, lng: 36.2765, country: 'سوريا' },
  { name: 'بيروت', lat: 33.8938, lng: 35.5018, country: 'لبنان' },
  { name: 'الخرطوم', lat: 15.5007, lng: 32.5599, country: 'السودان' },
  { name: 'الدار البيضاء', lat: 33.5731, lng: -7.5898, country: 'المغرب' },
  { name: 'تونس', lat: 36.8065, lng: 10.1815, country: 'تونس' },
  { name: 'الجزائر', lat: 36.7538, lng: 3.0588, country: 'الجزائر' },
  { name: 'القدس', lat: 31.7683, lng: 35.2137, country: 'فلسطين' },
]

export function PrayerSettings() {
  const [settings, update] = useSettings()
  const hydrated = useHydrated()
  const [openCityPicker, setOpenCityPicker] = useState(false)
  const [openMethodPicker, setOpenMethodPicker] = useState(false)
  const [locating, setLocating] = useState(false)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotifPermission(Notification.permission)
    }
  }, [])

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-2xl bg-card" aria-hidden="true" />
  }

  const detectLocation = () => {
    if (!('geolocation' in navigator)) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=ar`
          )
          const data = await res.json()
          const countryCode = data.countryCode
          update((s) => ({
            location: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              city: data.city || data.locality || 'موقعي',
              country: data.countryName || '',
              auto: true,
            },
            method: COUNTRY_METHOD[countryCode] ?? s.method,
          }))
        } catch {
          update((s) => ({
            location: { ...s.location, lat: pos.coords.latitude, lng: pos.coords.longitude, city: 'موقعي الحالي', auto: true },
          }))
        }
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 15000 }
    )
  }

  const selectCity = (city: (typeof CITIES)[0]) => {
    update({
      location: { lat: city.lat, lng: city.lng, city: city.name, country: city.country, auto: false },
    })
    setOpenCityPicker(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* الموقع */}
      <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <MapPin className="size-4" />
          </span>
          <h3 className="font-bold text-zinc-800 dark:text-zinc-100">الموقع</h3>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">المدينة الحالية</p>
            <p className="font-bold text-zinc-800 dark:text-zinc-100">
              {settings.location.city}
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
              {locating ? <RefreshCw className="size-4 animate-spin" /> : <MapPin className="size-4" />}
              {locating ? 'جارٍ التحديد...' : 'تحديد موقعي تلقائياً'}
            </button>
            <button
              type="button"
              onClick={() => setOpenCityPicker(!openCityPicker)}
              className="flex items-center justify-center gap-2 rounded-xl bg-muted px-3 py-2.5 text-sm"
            >
              <ChevronDown className={cn('size-4 transition', openCityPicker && 'rotate-180')} />
              اختيار يدوي
            </button>
          </div>
          {openCityPicker && (
            <div className="max-h-60 overflow-y-auto rounded-xl border border-border">
              {CITIES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => selectCity(c)}
                  className="flex w-full items-center justify-between border-b border-border px-3 py-2.5 text-right text-sm last:border-0 hover:bg-muted"
                >
                  <span>
                    {c.name} <span className="text-xs text-muted-foreground">- {c.country}</span>
                  </span>
                  {settings.location.city === c.name && <Check className="size-4 text-emerald-600" />}
                </button>
              ))}
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
          <h3 className="font-bold text-zinc-800 dark:text-zinc-100">طريقة الحساب</h3>
        </div>
        <button
          type="button"
          onClick={() => setOpenMethodPicker(!openMethodPicker)}
          className="flex w-full items-center justify-between rounded-xl bg-muted/50 px-3 py-3 text-right"
        >
          <span className="font-medium">
            {METHODS.find((m) => m.id === settings.method)?.name ?? 'أم القرى'}
          </span>
          <ChevronDown className={cn('size-4 transition', openMethodPicker && 'rotate-180')} />
        </button>
        {openMethodPicker && (
          <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-border">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  update({ method: m.id })
                  setOpenMethodPicker(false)
                }}
                className="flex w-full items-center justify-between border-b border-border px-3 py-2.5 text-right text-sm last:border-0 hover:bg-muted"
              >
                <span>{m.name}</span>
                {settings.method === m.id && <Check className="size-4 text-emerald-600" />}
              </button>
            ))}
          </div>
        )}
        <div className="mt-3">
          <p className="mb-2 text-xs text-muted-foreground">مذهب حساب العصر</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => update({ madhab: 'shafi' })}
              className={cn(
                'flex-1 rounded-xl px-3 py-2 text-sm',
                settings.madhab === 'shafi' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}
            >
              شافعي / مالكي / حنبلي
            </button>
            <button
              type="button"
              onClick={() => update({ madhab: 'hanafi' })}
              className={cn(
                'flex-1 rounded-xl px-3 py-2 text-sm',
                settings.madhab === 'hanafi' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}
            >
              حنفي
            </button>
          </div>
        </div>
      </section>

      {/* التنبيه والأذان */}
      <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Bell className="size-4" />
          </span>
          <h3 className="font-bold text-zinc-800 dark:text-zinc-100">التنبيه والأذان</h3>
        </div>
        <div className="space-y-3">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              التنبيه قبل الأذان ({toArabicNumber(settings.reminderMinutes)} دقيقة)
            </p>
            <input
              type="range"
              min={0}
              max={30}
              step={5}
              value={settings.reminderMinutes}
              onChange={(e) => update({ reminderMinutes: Number(e.target.value) })}
              className="w-full accent-emerald-600"
            />
          </div>
          <div>
            <p className="mb-2 text-xs text-muted-foreground">تفعيل صوت الأذان</p>
            <div className="grid grid-cols-5 gap-2">
              {PRAYER_ORDER.map((key: PrayerKey) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    update((s) => ({
                      adhanEnabled: { ...s.adhanEnabled, [key]: !s.adhanEnabled[key] },
                    }))
                  }
                  className={cn(
                    'rounded-xl px-2 py-2 text-xs font-medium transition',
                    settings.adhanEnabled[key]
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {PRAYER_NAMES[key]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              مستوى الصوت ({Math.round(settings.adhanVolume * 100)}٪)
            </p>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={settings.adhanVolume}
              onChange={(e) => update({ adhanVolume: Number(e.target.value) })}
              className="w-full accent-emerald-600"
            />
          </div>
        </div>
      </section>

      {/* الإشعارات */}
      <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <BellRing className="size-4" />
          </span>
          <h3 className="font-bold text-zinc-800 dark:text-zinc-100">الإشعارات</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
            <div>
              <p className="font-medium text-zinc-800 dark:text-zinc-100">
                إشعارات الأذان
              </p>
              <p className="text-xs text-muted-foreground">
                {notifPermission === 'granted'
                  ? 'مُفعّلة ✅'
                  : notifPermission === 'denied'
                    ? 'مرفوضة ❌ (فعّلها من إعدادات المتصفح)'
                    : 'غير مُفعّلة'}
              </p>
            </div>
            {notifPermission !== 'granted' && notifPermission !== 'denied' && (
              <button
                type="button"
                onClick={async () => {
                  if (typeof Notification === 'undefined') return
                  const p = await Notification.requestPermission()
                  setNotifPermission(p)
                  if (p === 'granted') {
                    new Notification('تم تفعيل الإشعارات', {
                      body: 'ستصلك تنبيهات الصلاة في وقتها',
                      icon: '/icon-512.png',
                      dir: 'rtl',
                      lang: 'ar',
                    })
                  }
                }}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
              >
                تفعيل
              </button>
            )}
            {notifPermission === 'granted' && (
              <button
                type="button"
                onClick={() => {
                  new Notification('اختبار', {
                    body: 'الإشعارات تعمل بنجاح',
                    icon: '/icon-512.png',
                    dir: 'rtl',
                  })
                }}
                className="rounded-xl bg-muted px-3 py-2 text-xs"
              >
                تجربة
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}