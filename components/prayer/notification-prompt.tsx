'use client'

import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import {
  getNotificationStatusAsync,
  requestNativeNotificationPermission,
  showNativeNotification,
  registerAppStateListener,
} from '@/lib/native'
import { useLanguage } from '@/lib/language-context'

const DISMISS_KEY = 'notif-dismissed-v2'
const SETUP_NOTIF_GRANTED_KEY = 'setup-notif-granted-v1'

export function NotificationPrompt() {
  const [show, setShow] = useState(false)
  const { dict, locale } = useLanguage()

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    const check = async () => {
      // ✅ لا نعرض النافذة إذا وافق المستخدم في FirstRun
      try {
        if (localStorage.getItem(SETUP_NOTIF_GRANTED_KEY) === 'true') {
          setShow(false)
          return
        }
      } catch {}

      const status = await getNotificationStatusAsync()
      if (cancelled) return
      if (status === 'granted' || status === 'unsupported') {
        setShow(false)
        return
      }
      if (status === 'denied') return 
      try {
        if (localStorage.getItem(DISMISS_KEY)) return
      } catch {}
      timer = setTimeout(() => !cancelled && setShow(true), 3000)
    }

    check()
    const off = registerAppStateListener(check)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      off()
    }
  }, [])

  const enable = async () => {
    const permission = await requestNativeNotificationPermission()
    if (permission === 'granted') {
      // ✅ حفظ حالة الموافقة
      try {
        localStorage.setItem(SETUP_NOTIF_GRANTED_KEY, 'true')
      } catch {}
      await showNativeNotification(dict.notificationPrompt.successTitle, dict.notificationPrompt.successBody)
    }
    setShow(false)
  }

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {}
    setShow(false)
  }

  if (!show) return null

  return (
    <div 
      className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-700 p-4 text-white shadow-2xl"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label={dict.common.close}
        className={`absolute top-2 flex size-7 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 ${locale === 'ar' ? 'left-2' : 'right-2'}`}
      >
        <X className="size-3.5" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Bell className="size-5" />
        </div>
        <div className="flex-1">
          <p className="font-bold">{dict.notificationPrompt.title}</p>
          <p className="mt-1 text-xs opacity-90">{dict.notificationPrompt.desc}</p>
          <button
            type="button"
            onClick={enable}
            className="mt-3 w-full rounded-xl bg-white py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
          >
            {dict.notificationPrompt.enable}
          </button>
        </div>
      </div>
    </div>
  )
}