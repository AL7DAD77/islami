'use client'

import { useEffect, useState } from 'react'
import { Compass, MapPin } from 'lucide-react'
import { distanceKm, getQiblaDirection } from '@/lib/prayer'
import { toArabicNumber } from '@/lib/quran'
import { useHydrated, useSettings } from '@/lib/settings'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'

type OrientationEvt = DeviceOrientationEvent & { webkitCompassHeading?: number }
type PermissionCapable = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> }

export function QiblaCompass() {
  const [settings] = useSettings()
  const hydrated = useHydrated()
  const { dict, locale } = useLanguage()

  const [heading, setHeading] = useState<number | null>(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!active) return
    const handler = (e: Event) => {
      const ev = e as OrientationEvt
      if (typeof ev.webkitCompassHeading === 'number') setHeading(ev.webkitCompassHeading)
      else if (ev.absolute && ev.alpha !== null) setHeading((360 - ev.alpha) % 360)
    }
    const eventName = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation'
    window.addEventListener(eventName, handler, true)
    return () => window.removeEventListener(eventName, handler, true)
  }, [active])

  const start = async () => {
    setError(null)
    const DOE = (typeof DeviceOrientationEvent !== 'undefined' ? DeviceOrientationEvent : null) as PermissionCapable | null
    if (!DOE) {
      setError(dict.qiblaPage.sensorError)
      return
    }
    if (typeof DOE.requestPermission === 'function') {
      const res = await DOE.requestPermission().catch(() => 'denied' as const)
      if (res !== 'granted') {
        setError(dict.qiblaPage.permissionError)
        return
      }
    }
    setActive(true)
  }

  if (!hydrated) {
    return <div className="mx-auto aspect-square w-full max-w-xs animate-pulse rounded-full bg-card" aria-hidden="true" />
  }

  const { lat, lng, city } = settings.location
  const qibla = getQiblaDirection(lat, lng)
  const distance = Math.round(distanceKm(lat, lng, 21.4225, 39.8262))
  const dialRotation = heading === null ? 0 : -heading
  const diff = heading === null ? null : Math.abs(((qibla - heading + 540) % 360) - 180)
  const aligned = diff !== null && diff < 5

  const formatNumber = (num: number) => (locale === 'ar' ? toArabicNumber(num) : num.toString())

  return (
    <div className="flex flex-col items-center gap-6">
      {/* إطار البوصلة المجسّم */}
      <div
        className={cn(
          'relative aspect-square w-full max-w-xs rounded-full p-2 transition-all duration-300',
          'bg-gradient-to-br from-stone-200 via-[#d4af37]/45 to-stone-400 dark:from-stone-700 dark:via-[#d4af37]/30 dark:to-stone-900',
          aligned
            ? 'shadow-[0_0_0_5px_rgba(16,185,129,0.22),0_18px_36px_rgba(0,0,0,0.28)]'
            : 'shadow-[0_16px_34px_rgba(0,0,0,0.22)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.65)]',
        )}
      >
        {/* القرص الداخلي الدوار */}
        <div
          className="relative h-full w-full overflow-hidden rounded-full bg-gradient-to-b from-card via-card to-muted/50 shadow-[inset_0_5px_14px_rgba(0,0,0,0.16)] dark:shadow-[inset_0_6px_18px_rgba(0,0,0,0.65)] transition-transform duration-200 ease-out"
          style={{ transform: `rotate(${dialRotation}deg)` }}
        >
          {/* وردة الاتجاهات المجسّمة بـ SVG */}
          <svg
            viewBox="0 0 200 200"
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="roseLight" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#d4af37" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#b89965" stopOpacity="0.08" />
              </linearGradient>
              <linearGradient id="roseDark" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0a1f1a" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#0a1f1a" stopOpacity="0.04" />
              </linearGradient>
              <radialGradient id="capMetal" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#f5e6b3" />
                <stop offset="55%" stopColor="#c59b27" />
                <stop offset="100%" stopColor="#0a1f1a" />
              </radialGradient>
            </defs>

            {/* حلقات دائرية دقيقة داخل القرص */}
            <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeOpacity="0.14" strokeWidth="1" />
            <circle cx="100" cy="100" r="66" fill="none" stroke="#d4af37" strokeOpacity="0.25" strokeWidth="0.9" strokeDasharray="3 3" />

            {/* أشعة الاتجاهات الفرعية المجسّمة (45, 135, 225, 315) */}
            {[45, 135, 225, 315].map((angle) => (
              <g key={angle} transform={`rotate(${angle} 100 100)`}>
                <polygon points="100,34 107,100 100,92" fill="url(#roseLight)" />
                <polygon points="100,34 93,100 100,92" fill="url(#roseDark)" />
              </g>
            ))}

            {/* أشعة الاتجاهات الرئيسية المجسّمة (0, 90, 180, 270) */}
            {[0, 90, 180, 270].map((angle) => (
              <g key={angle} transform={`rotate(${angle} 100 100)`}>
                <polygon
                  points="100,24 109,100 100,88"
                  fill={angle === 0 ? '#dc2626' : '#d4af37'}
                  fillOpacity={angle === 0 ? 0.82 : 0.42}
                />
                <polygon
                  points="100,24 91,100 100,88"
                  fill={angle === 0 ? '#991b1b' : '#0a1f1a'}
                  fillOpacity={angle === 0 ? 0.85 : 0.25}
                />
              </g>
            ))}

            {/* تدريجات الدرجات (72 خطاً كل 5 درجات) */}
            {Array.from({ length: 72 }).map((_, i) => {
              const major = i % 6 === 0
              const y2 = major ? 17 : 13
              return (
                <line
                  key={i}
                  x1="100"
                  y1="8"
                  x2="100"
                  y2={y2}
                  transform={`rotate(${i * 5} 100 100)`}
                  stroke={major ? '#b89965' : 'currentColor'}
                  strokeOpacity={major ? 0.85 : 0.28}
                  strokeWidth={major ? 1.5 : 0.9}
                />
              )
            })}
          </svg>

          {/* حروف الاتجاهات الأربعة */}
          {[dict.qiblaPage.north, dict.qiblaPage.east, dict.qiblaPage.south, dict.qiblaPage.west].map((d, i) => (
            <span
              key={i}
              className={cn(
                'absolute left-1/2 top-1/2 select-none text-sm font-extrabold',
                i === 0 ? 'text-destructive' : 'text-foreground/80',
              )}
              style={{
                transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-5.15rem) rotate(${-i * 90}deg)`,
              }}
            >
              {d}
            </span>
          ))}

          {/* مؤشر القبلة ورمز الكعبة */}
          <div
            className="absolute left-1/2 top-1/2 h-1/2 w-1 origin-top"
            style={{ transform: `translateX(-50%) rotate(${qibla + 180}deg)` }}
          >
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 rotate-180 flex-col items-center">
              <span
                className={cn(
                  'flex size-10 items-center justify-center rounded-xl border border-[#d4af37]/60 bg-[#0a1f1a] text-[10px] font-bold text-[#d4af37] transition-transform duration-300',
                  aligned
                    ? 'scale-110 shadow-[0_0_16px_rgba(212,175,55,0.65)]'
                    : 'shadow-[0_6px_14px_rgba(0,0,0,0.35)]',
                )}
              >
                {dict.qiblaPage.kaaba}
              </span>
            </div>
            <div className="mx-auto h-[calc(100%-4.2rem)] w-[3px] rounded-full bg-gradient-to-b from-primary via-[#b89965] to-[#d4af37] shadow-[0_0_6px_rgba(212,175,55,0.35)]" />
          </div>

          {/* مسمار الارتكاز المعدني في المنتصف */}
          <svg
            viewBox="0 0 40 40"
            className="pointer-events-none absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_3px_6px_rgba(0,0,0,0.4)]"
            aria-hidden="true"
          >
            <circle cx="20" cy="20" r="16" fill="url(#capMetal)" stroke="#f5e6b3" strokeOpacity="0.55" strokeWidth="1.2" />
            <circle cx="20" cy="20" r="6" fill="#0a1f1a" stroke="#d4af37" strokeOpacity="0.6" strokeWidth="1" />
          </svg>
        </div>

        {/* مؤشر الشمال الثابت في أعلى الإطار */}
        <div
          className="pointer-events-none absolute left-1/2 top-1 h-4 w-1.5 -translate-x-1/2 rounded-full bg-destructive shadow-[0_2px_6px_rgba(220,38,38,0.5)]"
          aria-hidden="true"
        />
      </div>

      {/* بطاقات الزاوية والمسافة */}
      <div className="grid w-full grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[#d4af37]/25 bg-card p-4 text-center shadow-sm">
          <p className="text-xs text-muted-foreground">{dict.qiblaPage.qiblaDir}</p>
          <p className="mt-1 text-2xl font-bold text-primary">{`${formatNumber(Math.round(qibla))}°`}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{dict.qiblaPage.fromNorth}</p>
        </div>
        <div className="rounded-2xl border border-[#d4af37]/25 bg-card p-4 text-center shadow-sm">
          <p className="text-xs text-muted-foreground">{dict.qiblaPage.distanceToMakkah}</p>
          <p className="mt-1 text-2xl font-bold text-primary">{formatNumber(distance)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{dict.qiblaPage.km}</p>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="size-4 text-[#b89965] dark:text-[#d4af37]" aria-hidden="true" />
        {city}
      </p>

      {aligned && (
        <p
          className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm"
          role="status"
        >
          {dict.qiblaPage.facingQibla}
        </p>
      )}

      {!active ? (
        <button
          type="button"
          onClick={start}
          className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 font-bold text-primary-foreground shadow-sm active:scale-[0.98]"
        >
          <Compass className="size-5" aria-hidden="true" />
          {dict.qiblaPage.startCompass}
        </button>
      ) : (
        heading === null && <p className="text-center text-sm text-muted-foreground">{dict.qiblaPage.calibrate}</p>
      )}
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        {dict.qiblaPage.instructions}
      </p>
    </div>
  )
}
