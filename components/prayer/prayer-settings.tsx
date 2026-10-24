'use client'

import { useState, useEffect } from 'react'
import { MapPin, Calculator, Bell, BellRing, ChevronDown, RefreshCw, Check } from 'lucide-react'
import { useSettings, useHydrated, type MethodKey, type PrayerKey } from '@/lib/settings'
import { PRAYER_NAMES, PRAYER_ORDER } from '@/lib/prayer'
import { getAdhanVoice } from '@/lib/adhan-list'
import { CITIES, type City } from '@/lib/places'
import { methodForCountry, searchCities, searchCitiesOnline, normalizeArabic, type OnlineCity } from '@/lib/city-search'
import { updateAutoLocation } from '@/lib/location'
import { toArabicNumber } from '@/lib/quran'
import { cn } from '@/lib/utils'
import {
  requestNativeNotificationPermission,
  showNativeNotification,
  getNotificationStatusAsync,
  registerAppStateListener,
  isNativePlatform,
  isAdhanSchedulerAvailable,
  getNativeAlarmStatus,
  requestExactAlarmPermission,
  setPersistentNotification,
  testNativeAdhan,
} from '@/lib/native'

const METHODS: { id: MethodKey; name: string }[] = [
  { id: 'UmmAlQura', name: 'أم القرى (السعودية)' },
  { id: 'Egyptian', name: 'الهيئة المصرية' },
  { id: 'MuslimWorldLeague', name: 'رابطة العالم الإسلامي' },
  { id: 'JordanAwqaf', name: 'الأردن - وزارة الأوقاف' },
  { id: 'AlgeriaMinistry', name: 'الجزائر - وزارة الشؤون الدينية' },
  { id: 'TunisiaMinistry', name: 'تونس - وزارة الشؤون الدينية' },
  { id: 'MoroccoHabous', name: 'المغرب - وزارة الأوقاف' },
  { id: 'Karachi', name: 'كراتشي (باكستان)' },
  { id: 'Dubai', name: 'دبي' },
  { id: 'Kuwait', name: 'الكويت' },
  { id: 'Qatar', name: 'قطر' },
  { id: 'Turkey', name: 'تركيا' },
  { id: 'NorthAmerica', name: 'أمريكا الشمالية' },
  { id: 'Singapore', name: 'سنغافورة' },
]

export function PrayerSettings() {
  const [settings, update] = useSettings()
  const hydrated = useHydrated()
  const [openCityPicker, setOpenCityPicker] = useState(false)
  const [openMethodPicker, setOpenMethodPicker] = useState(false)
  const [locating, setLocating] = useState(false)
  const [notifPermission, setNotifPermission] = useState<string>('checking')

  const [exactAlarmOk, setExactAlarmOk] = useState<boolean | null>(null)
  const [nativeSched, setNativeSched] = useState(false)

  useEffect(() => {
    const refresh = async () => {
      setNotifPermission(await getNotificationStatusAsync())
      const available = isAdhanSchedulerAvailable()
      setNativeSched(available)
      if (available) {
        const st = await getNativeAlarmStatus()
        setExactAlarmOk(st ? st.exactAlarmAllowed : null)
      }
    }
    refresh()
    return registerAppStateListener(refresh)
  }, [])

  const [query, setQuery] = useState('')
  const [online, setOnline] = useState<OnlineCity[]>([])
  const [searching, setSearching] = useState(false)

  const detectLocation = async () => {
    setLocating(true)
    const result = await updateAutoLocation({ force: true, askPermission: true, highAccuracy: true })
    setLocating(false)
    if (result === 'denied') {
      alert(
        isNativePlatform()
          ? '⚠️ لم يُسمح للتطبيق بالوصول إلى الموقع\n\nلتفعيله:\n١. إعدادات الهاتف ← التطبيقات ← إسلامي\n٢. الأذونات ← الموقع\n٣. اختر «السماح أثناء استخدام التطبيق»\n٤. ارجع واضغط «تحديد موقعي تلقائياً»'
          : '⚠️ تم رفض الوصول للموقع\n\nلتفعيله:\n• اضغط على 🔒 بجانب الرابط\n• Site settings → Location → Allow',
      )
    } else if (result === 'error') {
      alert('⚠️ تعذّر تحديد موقعك. تأكد من تشغيل خدمة الموقع (GPS) ثم أعد المحاولة.')
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

  const applyManualCity = (name: string, country: string, cc: string, lat: number, lng: number, method?: MethodKey) => {
    update((s) => {
      const countryChanged = !!cc && cc !== s.location.countryCode
      return {
        locationStatus: 'ok',
        location: { lat, lng, city: name, country, countryCode: cc, auto: false },
        method: countryChanged ? (method ?? methodForCountry(cc, s.method)) : s.method,
      }
    })
    setOpenCityPicker(false)
    setQuery('')
  }

  const selectCity = (c: City) => applyManualCity(c.name, c.country, c.cc, c.lat, c.lng, c.method)
  const selectOnline = (c: OnlineCity) =>
    applyManualCity(c.admin && c.admin !== c.name ? `${c.name} - ${c.admin}` : c.name, c.country, c.cc, c.lat, c.lng)

  const localMatches = searchCities(query)
  const localNames = new Set(localMatches.map((c) => normalizeArabic(c.name)))
  const onlineMatches = online.filter((o) => !localNames.has(normalizeArabic(o.name)))

  const handleEnableNotifications = async () => {
    const result = await requestNativeNotificationPermission()
    setNotifPermission(result)
    if (result === 'granted') {
      await showNativeNotification('تم تفعيل الإشعارات', 'ستصلك تنبيهات الصلاة في وقتها')
    }
  }

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-2xl bg-card" aria-hidden="true" />
  }

  return (
    <div className="flex flex-col gap-4">
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
          {settings.location.auto && settings.locationStatus === 'ok' && (
            <p className="text-xs text-emerald-600">✓ يتم تحديد موقعك تلقائياً وتحديث المواقيت عند سفرك</p>
          )}
          {settings.locationStatus === 'denied' && (
            <p className="rounded-xl bg-amber-100 p-3 text-xs leading-relaxed text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              لم يُسمح بالوصول للموقع، فالمواقيت الحالية لمدينة {settings.location.city}. اضغط «تحديد موقعي تلقائياً» وامنح الإذن، أو اختر مدينتك يدوياً.
            </p>
          )}
          {settings.locationStatus === 'error' && (
            <p className="rounded-xl bg-amber-100 p-3 text-xs leading-relaxed text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              تعذّر تحديد موقعك. تأكد من تشغيل خدمة الموقع (GPS) في الهاتف.
            </p>
          )}
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
            <div className="space-y-2">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن مدينتك (مثال: أسيوط، تبوك، لندن...)"
                aria-label="ابحث عن مدينة"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              />
              <div className="max-h-72 overflow-y-auto rounded-xl border border-border">
                {localMatches.map((c) => (
                  <button
                    key={`${c.cc}-${c.name}`}
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
                {onlineMatches.map((c) => (
                  <button
                    key={`online-${c.lat}-${c.lng}`}
                    type="button"
                    onClick={() => selectOnline(c)}
                    className="flex w-full items-center justify-between border-b border-border px-3 py-2.5 text-right text-sm last:border-0 hover:bg-muted"
                  >
                    <span>
                      {c.name}
                      <span className="text-xs text-muted-foreground">
                        {` - ${[c.admin, c.country].filter(Boolean).join('، ')}`}
                      </span>
                    </span>
                  </button>
                ))}
                {searching && <p className="p-3 text-center text-xs text-muted-foreground">جارٍ البحث في مدن العالم...</p>}
                {!searching && localMatches.length === 0 && onlineMatches.length === 0 && (
                  <p className="p-3 text-center text-xs text-muted-foreground">
                    {query.trim().length < 2 ? 'اكتب حرفين على الأقل' : 'لا توجد نتائج. جرّب كتابة الاسم بطريقة أخرى.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

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
      <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Bell className="size-4" />
          </span>
          <h3 className="font-bold text-zinc-800 dark:text-zinc-100">التنبيه والأذان</h3>
        </div>
        <div className="space-y-4">
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
        </div>
      </section>

      <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <BellRing className="size-4" />
          </span>
          <h3 className="font-bold text-zinc-800 dark:text-zinc-100">الإشعارات</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
            <div className="flex-1">
              <p className="font-medium text-zinc-800 dark:text-zinc-100">
                إشعارات الأذان
              </p>
              <p className="text-xs text-muted-foreground">
                {notifPermission === 'granted'
                  ? 'مُفعّلة ✅'
                  : notifPermission === 'denied'
                    ? 'مرفوضة ❌ (افتح الإعدادات)'
                    : notifPermission === 'unsupported'
                      ? 'غير مدعومة'
                      : notifPermission === 'checking'
                        ? 'جارٍ الفحص…'
                        : 'غير مُفعّلة'}
              </p>
            </div>

            {notifPermission === 'granted' ? (
              <button
                type="button"
                onClick={async () => {
                  await showNativeNotification('اختبار', 'الإشعارات تعمل بنجاح')
                }}
                className="rounded-xl bg-muted px-3 py-2 text-xs"
              >
                تجربة
              </button>
            ) : notifPermission === 'denied' ? (
              <button
                type="button"
                onClick={() => {
                  alert(
                    isNativePlatform()
                      ? 'لتفعيل الإشعارات:\n\n١. افتح إعدادات الهاتف\n٢. التطبيقات ← إسلامي\n٣. الإشعارات ← فعّلها\n٤. ارجع للتطبيق'
                      : 'لتفعيل الإشعارات:\n\n1. اضغط 🔒 بجانب الرابط\n2. Site settings\n3. Notifications → Allow\n4. أعد تحميل الصفحة'
                  )
                }}
                className="rounded-xl bg-muted px-3 py-2 text-xs"
              >
                إعادة التفعيل
              </button>
            ) : notifPermission === 'checking' ? null : (
              <button
                type="button"
                onClick={handleEnableNotifications}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
              >
                تفعيل
              </button>
            )}
          </div>

          {nativeSched && (
            <>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
                <div className="flex-1">
                  <p className="font-medium text-zinc-800 dark:text-zinc-100">إشعار دائم بالصلاة القادمة</p>
                  <p className="text-xs text-muted-foreground">
                    يبقى ظاهراً في الخلفية ويعرض الوقت المتبقي للصلاة القادمة
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.persistentNotification}
                  onClick={() => {
                    const next = !settings.persistentNotification
                    update({ persistentNotification: next })
                    setPersistentNotification(next)
                  }}
                  className={cn(
                    'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                    settings.persistentNotification ? 'bg-emerald-600' : 'bg-zinc-400',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 size-5 rounded-full bg-white transition-all',
                      settings.persistentNotification ? 'right-0.5' : 'right-[1.375rem]',
                    )}
                  />
                </button>
              </div>

              <div className="rounded-xl bg-muted/50 p-3">
                <p className="font-medium text-zinc-800 dark:text-zinc-100">تجربة الأذان</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  اضغط لتشغيل تجربة سريعة للأذان (10 ثوانٍ) حسب المؤذن المختار في القائمة.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const testFile = getAdhanVoice(settings.adhanVoice)?.file || '';
                    testNativeAdhan(10, testFile, 1);
                  }}
                  className="mt-2 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground"
                >
                  تجربة الصوت
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}