'use client'

import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import {
  getNotificationStatusAsync,
  requestNativeNotificationPermission,
  showNativeNotification,
  registerAppStateListener,
} from '@/lib/native'

const DISMISS_KEY = 'notif-dismissed-v2'

export function NotificationPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    const check = async () => {
      // الحالة الفعلية من النظام (وليس من متغير المتصفح) حتى لا يظهر الطلب بعد التفعيل
      const status = await getNotificationStatusAsync()
      if (cancelled) return
      if (status === 'granted' || status === 'unsupported') {
        setShow(false)
        return
      }
      if (status === 'denied') return // لا فائدة من الطلب، والأزرار في الإعدادات تشرح الطريقة
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
      await showNativeNotification('تم تفعيل الإشعارات', 'ستصلك تنبيهات الصلاة والأذان في وقتها')
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
    <div className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-700 p-4 text-white shadow-2xl">
      <button
        type="button"
        onClick={dismiss}
        aria-label="إغلاق"
        className="absolute top-2 left-2 flex size-7 items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
      >
        <X className="size-3.5" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Bell className="size-5" />
        </div>
        <div className="flex-1">
          <p className="font-bold">تفعيل إشعارات الأذان</p>
          <p className="mt-1 text-xs opacity-90">للتنبيه بمواعيد الصلاة والأذان في وقتها</p>
          <button
            type="button"
            onClick={enable}
            className="mt-3 w-full rounded-xl bg-white py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
          >
            تفعيل الإشعارات
          </button>
        </div>
      </div>
    </div>
  )
}
