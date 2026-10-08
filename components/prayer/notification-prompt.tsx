'use client'

import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'

export function NotificationPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'granted') return
    if (Notification.permission === 'denied') return

    const dismissed = localStorage.getItem('notif-dismissed')
    if (dismissed) return

    // انتظر 3 ثوانٍ ثم اعرض
    const timer = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  const enable = async () => {
    if (typeof Notification === 'undefined') return
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      new Notification('تم تفعيل الإشعارات', {
        body: 'ستصلك تنبيهات الصلاة والأذان في وقتها',
        icon: '/icon-512.png',
        dir: 'rtl',
        lang: 'ar',
      })
    }
    setShow(false)
  }

  const dismiss = () => {
    localStorage.setItem('notif-dismissed', '1')
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
          <p className="mt-1 text-xs opacity-90">
            للتنبيه بمواعيد الصلاة والأذان في وقتها
          </p>
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