'use client'

import { useEffect, useState } from 'react'
import { Bell, Check, MapPin, BatteryCharging } from 'lucide-react'
import { updateAutoLocation } from '@/lib/location'
import { requestNativeNotificationPermission, isNativePlatform } from '@/lib/native'
import { useHydrated, useSettings } from '@/lib/settings'
import { registerPlugin } from '@capacitor/core'

const SystemSettings = isNativePlatform()
  ? registerPlugin<any>('SystemSettings')
  : null

const DONE_KEY = 'setup-done-v1'
const LOCATION_GRANTED_KEY = 'setup-location-granted-v1'
const NOTIF_GRANTED_KEY = 'setup-notif-granted-v1'
const BATTERY_GRANTED_KEY = 'setup-battery-granted-v1'

export function FirstRun() {
  const hydrated = useHydrated()
  const [settings] = useSettings()
  const [open, setOpen] = useState(false)
  const [locMsg, setLocMsg] = useState<string | null>(null)
  const [notifOk, setNotifOk] = useState<boolean | null>(null)
  const [batteryOk, setBatteryOk] = useState<boolean | null>(null)
  const [busy, setBusy] = useState<'loc' | 'notif' | 'battery' | null>(null)

  useEffect(() => {
    if (!hydrated) return
    try {
      if (!localStorage.getItem(DONE_KEY)) {
        setOpen(true)
      } else {
        // إذا كانت الشاشة قد أُكملت سابقاً، نتحقق من حالة الصلاحيات
        setNotifOk(localStorage.getItem(NOTIF_GRANTED_KEY) === 'true')
        setBatteryOk(localStorage.getItem(BATTERY_GRANTED_KEY) === 'true')
      }
    } catch {}
  }, [hydrated])

  if (!open) return null

  const finish = () => {
    try {
      localStorage.setItem(DONE_KEY, '1')
    } catch {}
    setOpen(false)
  }

  const askLocation = async () => {
    setBusy('loc')
    const r = await updateAutoLocation({ force: true, askPermission: true, highAccuracy: true })
    setBusy(null)
    
    if (r === 'ok') {
      setLocMsg('تم تحديد موقعك ومواقيت مدينتك بنجاح.')
      try {
        localStorage.setItem(LOCATION_GRANTED_KEY, 'true')
      } catch {}
    } else if (r === 'denied') {
      setLocMsg('لم يُمنح إذن الموقع. يمكنك اختيار مدينتك يدوياً من الإعدادات.')
    } else {
      setLocMsg('تعذّر تحديد الموقع. تأكد من تفعيل الـ GPS واحتفاظ التطبيق بالإذن.')
    }
  }

  const askNotifications = async () => {
    setBusy('notif')
    const p = await requestNativeNotificationPermission()
    setBusy(null)
    const isGranted = p === 'granted'
    setNotifOk(isGranted)
    try {
      localStorage.setItem(NOTIF_GRANTED_KEY, String(isGranted))
    } catch {}
  }

  const askBattery = async () => {
    if (!SystemSettings) return
    setBusy('battery')
    try {
      await SystemSettings.requestIgnoreBatteryOptimizations()
      // انتظار قصير للسماح للمستخدم بالعودة
      setTimeout(async () => {
        try {
          const res = await SystemSettings.checkBatteryOptimization()
          setBatteryOk(res.isIgnored)
          localStorage.setItem(BATTERY_GRANTED_KEY, String(res.isIgnored))
        } catch {}
        setBusy(null)
      }, 1500)
    } catch (e) {
      console.log(e)
      setBusy(null)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-title"
      dir="rtl"
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-3 sm:items-center"
    >
      <div className="w-full max-w-md rounded-2xl bg-background p-5 shadow-2xl ring-1 ring-border max-h-[90vh] overflow-y-auto">
        <h2 id="setup-title" className="text-lg font-bold">
          {'أهلاً بك في إسلامي'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {'ثلاث خطوات سريعة لتحديد مواقيت الصلاة بدقة وتفعيل الأذان.'}
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {/* قسم تحديد الموقع */}
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="flex items-start gap-3">
              <MapPin
                className="mt-0.5 size-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div className="flex-1">
                <p className="font-bold">{'موقعك الجغرافي'}</p>
                <p className="text-xs text-muted-foreground">
                  {'لحساب مواقيت الصلاة واتجاه القبلة لمدينتك الفعلية تلقائياً.'}
                </p>
                {locMsg && (
                  <p className="mt-2 text-xs font-semibold text-primary">
                    {locMsg}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={askLocation}
              disabled={busy !== null}
              className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-60"
            >
              {busy === 'loc'
                ? 'جارٍ التحديد...'
                : locMsg
                ? 'إعادة التحديد'
                : 'تحديد موقعي الآن'}
            </button>
          </div>

          {/* قسم الإشعارات والأذان */}
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="flex items-start gap-3">
              <Bell
                className="mt-0.5 size-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div className="flex-1">
                <p className="font-bold">{'الإشعارات والأذان'}</p>
                <p className="text-xs text-muted-foreground">
                  {'لتنبيهك بمواعيد الصلاة والأذان في وقتها المحدد.'}
                </p>
                {notifOk !== null && (
                  <p className="mt-2 text-xs font-semibold text-primary">
                    {notifOk
                      ? 'الإشعارات مفعّلة بنجاح.'
                      : 'لم تُفعَّل الإشعارات. يمكنك تفعيلها لاحقاً من إعدادات التطبيق.'}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={askNotifications}
              disabled={busy !== null || notifOk === true}
              className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-60"
            >
              {busy === 'notif'
                ? 'جارٍ التفعيل...'
                : notifOk
                ? 'مفعّلة'
                : 'تفعيل الإشعارات والأذان'}
            </button>
          </div>

          {/* قسم البطارية (العمل في الخلفية) */}
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="flex items-start gap-3">
              <BatteryCharging
                className="mt-0.5 size-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div className="flex-1">
                <p className="font-bold">{'العمل في الخلفية'}</p>
                <p className="text-xs text-muted-foreground">
                  {'لضمان عمل الأذان بدقة حتى لو أُغلق التطبيق أو أُطفئت الشاشة.'}
                </p>
                {batteryOk !== null && (
                  <p className="mt-2 text-xs font-semibold text-primary">
                    {batteryOk
                      ? 'تم تفعيل العمل في الخلفية.'
                      : 'لم يتم التفعيل. يرجى السماح بذلك من إعدادات الهاتف.'}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={askBattery}
              disabled={busy !== null || batteryOk === true}
              className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-60"
            >
              {busy === 'battery'
                ? 'جارٍ التفعيل...'
                : batteryOk
                ? 'مفعّلة'
                : 'السماح بالعمل في الخلفية'}
            </button>
          </div>
        </div>

        {/* أزرار الإنهاء والتخطي */}
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={finish}
            className="flex-1 rounded-xl bg-muted py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted/80"
          >
            {'تخطي'}
          </button>
          <button
            type="button"
            onClick={finish}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Check className="size-4" aria-hidden="true" />
            {'متابعة'}
          </button>
        </div>

        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          {`المدينة المحددة حالياً: ${settings.location.city}`}
        </p>
      </div>
    </div>
  )
}