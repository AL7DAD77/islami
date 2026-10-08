'use client'

import { useEffect, useState } from 'react'

export function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // انتظر 1.5 ثانية ثم ابدأ التلاشي
    const fadeTimer = setTimeout(() => setFading(true), 1500)
    // انتظر 0.5 ثانية إضافية للتلاشي الكامل
    const hideTimer = setTimeout(() => setVisible(false), 2000)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-gradient-to-b from-emerald-700 to-emerald-900 transition-opacity duration-500 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
      aria-hidden="true"
    >
      {/* الشعار */}
      <div className="mb-6 flex size-32 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm">
        <img
          src="/icon-512.png"
          alt="إسلامي"
          className="size-24 rounded-2xl"
        />
      </div>

      {/* الاسم */}
      <h1 className="text-3xl font-bold text-white">إسلامي</h1>

      {/* الوصف */}
      <p className="mt-2 text-sm text-emerald-100">رفيقك في العبادة والذكر</p>

      {/* مؤشر التحميل */}
      <div className="mt-8 flex gap-1.5">
        <span className="size-2 animate-pulse rounded-full bg-white/60" style={{ animationDelay: '0ms' }} />
        <span className="size-2 animate-pulse rounded-full bg-white/60" style={{ animationDelay: '150ms' }} />
        <span className="size-2 animate-pulse rounded-full bg-white/60" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}