'use client'

import { useEffect, useState } from 'react'
import { Bell, Check, MapPin } from 'lucide-react'
import { updateAutoLocation } from '@/lib/location'
import { requestNativeNotificationPermission } from '@/lib/native'
import { useHydrated, useSettings } from '@/lib/settings'

const DONE_KEY = 'setup-done-v1'

/**
 * شاشة إعداد أولى تظهر مرة واحدة: الموقع ثم الإشعارات، مع شرح سبب كل إذن.
 * كل خطوة اختيارية، ويمكن تخطي الشاشة كلها. لا تطلب أي إذن قبل ضغط المستخدم.
 */
export function FirstRun() {
  const hydrated = useHydrated()
  const [settings] = useSettings()
  const [open, setOpen] = useState(false)
  const [locMsg, setLocMsg] = useState<string | null>(null)
  const [notifOk, setNotifOk] = useState<boolean | null>(null)
  const [busy, setBusy] = useState<'loc' | 'notif' | null>(null)

  useEffect(() => {
    if (!hydrated) return
    try {
      if (!localStorage.getItem(DONE_KEY)) setOpen(true)
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
    const r = await updateAutoLocation({ force: true, askPermission: true, highAccuracy: false })
    setBusy(null)
    if (r === 'ok') setLocMsg('تم تحديد موقعك، والمواقيت الآن لمدينتك.')
    else if (r === 'denied') setLocMsg('لم يُمنح الإذن. يمكنك اختيار مدينتك يدوياً من الإعدادات.')
    else setLocMsg('تعذّر تحديد الموقع. تأكد من تشغيل خدمة الموقع ثم أعد المحاولة من الإعدادات.')
  }

  const askNotifications = async () => {
    setBusy('notif')
    const p = await requestNativeNotificationPermission()
    setBusy(null)
    setNotifOk(p === 'granted')
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="setup-title" dir="rtl" className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-3 sm:items-center">
      <div className="w-full max-w-md rounded-3xl bg-background p-5 shadow-2xl ring-1 ring-border">
        <h2 id="setup-title" className="text-lg font-bold">{'أهلاً بك في إسلامي'}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{'خطوتان سريعتان لتجربة أفضل، ويمكنك تخطيهما.'}</p>

        <div className="mt-4 flex flex-col gap-3">
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-bold">{'موقعك'}</p>
                <p className="text-xs text-muted-foreground">{'لحساب مواقيت الصلاة واتجاه القبلة لمدينتك. نستخدم موقعك التقريبي فقط.'}</p>
                {locMsg && <p className="mt-2 text-xs text-primary">{locMsg}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={askLocation}
              disabled={busy !== null}
              className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy === 'loc' ? 'جارٍ التحديد...' : locMsg ? 'تم' : 'تحديد موقعي'}
            </button>
          </div>

          <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="flex items-start gap-3">
              <Bell className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-bold">{'الإشعارات والأذان'}</p>
                <p className="text-xs text-muted-foreground">{'لتصلك تنبيهات الصلاة والأذان في وقتها. لا نرسل إشعارات تسويقية.'}</p>
                {notifOk !== null && (
                  <p className="mt-2 text-xs text-primary">
                    {notifOk ? 'الإشعارات مفعّلة.' : 'لم تُفعَّل الإشعارات. يمكنك تفعيلها لاحقاً من إعدادات الصلاة.'}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={askNotifications}
              disabled={busy !== null || notifOk === true}
              className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy === 'notif' ? 'جارٍ...' : notifOk ? 'مفعّلة' : 'تفعيل الإشعارات'}
            </button>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button type="button" onClick={finish} className="flex-1 rounded-xl bg-muted py-2.5 text-sm font-bold">
            {'تخطي'}
          </button>
          <button type="button" onClick={finish} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground">
            <Check className="size-4" aria-hidden="true" />
            {'ابدأ'}
          </button>
        </div>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">{`المدينة الحالية: ${settings.location.city}`}</p>
      </div>
    </div>
  )
}
