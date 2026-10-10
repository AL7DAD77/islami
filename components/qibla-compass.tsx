'use client'

import { useEffect, useState } from 'react'
import { Compass, MapPin } from 'lucide-react'
import { distanceKm, getQiblaDirection } from '@/lib/prayer'
import { toArabicNumber } from '@/lib/quran'
import { useHydrated, useSettings } from '@/lib/settings'
import { cn } from '@/lib/utils'

type OrientationEvt = DeviceOrientationEvent & { webkitCompassHeading?: number }
type PermissionCapable = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> }

export function QiblaCompass() {
  const [settings] = useSettings()
  const hydrated = useHydrated()
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
      setError('جهازك لا يدعم مستشعر البوصلة. استخدم اتجاه القبلة بالدرجات أدناه.')
      return
    }
    if (typeof DOE.requestPermission === 'function') {
      const res = await DOE.requestPermission().catch(() => 'denied' as const)
      if (res !== 'granted') {
        setError('لم يتم السماح بالوصول إلى مستشعر الاتجاه.')
        return
      }
    }
    setActive(true)
  }

  if (!hydrated) return <div className="mx-auto aspect-square w-full max-w-xs animate-pulse rounded-full bg-card" aria-hidden="true" />

  const { lat, lng, city } = settings.location
  const qibla = getQiblaDirection(lat, lng)
  const distance = Math.round(distanceKm(lat, lng, 21.4225, 39.8262))
  const dialRotation = heading === null ? 0 : -heading
  const diff = heading === null ? null : Math.abs(((qibla - heading + 540) % 360) - 180)
  const aligned = diff !== null && diff < 5

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className={cn(
          'relative aspect-square w-full max-w-xs rounded-full bg-card shadow-lg ring-8 transition-colors',
          aligned ? 'ring-primary' : 'ring-secondary',
        )}
      >
        <div className="absolute inset-0 transition-transform duration-200" style={{ transform: `rotate(${dialRotation}deg)` }}>
          {['ش', 'شر', 'ج', 'غ'].map((d, i) => (
            <span
              key={d}
              className={cn('absolute left-1/2 top-1/2 text-sm font-bold', i === 0 ? 'text-destructive' : 'text-muted-foreground')}
              style={{ transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-8.5rem) rotate(${-i * 90}deg)` }}
            >
              {d}
            </span>
          ))}
          {Array.from({ length: 72 }).map((_, i) => (
            <span
              key={i}
              className={cn('absolute left-1/2 top-1/2 w-px origin-bottom bg-border', i % 6 === 0 ? 'h-3 bg-muted-foreground' : 'h-1.5')}
              style={{ transform: `translate(-50%, -100%) rotate(${i * 5}deg) translateY(-7.4rem)` }}
              aria-hidden="true"
            />
          ))}
          <div className="absolute left-1/2 top-1/2 h-1/2 w-1 origin-top" style={{ transform: `translateX(-50%) rotate(${qibla + 180}deg)` }}>
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 rotate-180 flex-col items-center">
              <span className="flex size-10 items-center justify-center rounded-lg bg-foreground text-[10px] font-bold text-gold shadow-md">
                {'الكعبة'}
              </span>
            </div>
            <div className="mx-auto h-[calc(100%-4.5rem)] w-1 rounded-full bg-primary" />
          </div>
        </div>
        <div className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-4 ring-card" />
        <div className="absolute left-1/2 top-2 h-5 w-1 -translate-x-1/2 rounded-full bg-destructive" aria-hidden="true" />
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4 text-center shadow-sm ring-1 ring-border">
          <p className="text-xs text-muted-foreground">{'اتجاه القبلة'}</p>
          <p className="text-2xl font-bold text-primary">{`${toArabicNumber(Math.round(qibla))}°`}</p>
          <p className="text-xs text-muted-foreground">{'من الشمال'}</p>
        </div>
        <div className="rounded-2xl bg-card p-4 text-center shadow-sm ring-1 ring-border">
          <p className="text-xs text-muted-foreground">{'المسافة إلى مكة'}</p>
          <p className="text-2xl font-bold text-primary">{toArabicNumber(Math.round(distance))}</p>
          <p className="text-xs text-muted-foreground">{'كيلومتر'}</p>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="size-4" aria-hidden="true" />
        {city}
      </p>

      {aligned && <p className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground" role="status">{'أنت متجه نحو القبلة'}</p>}

      {!active ? (
        <button
          type="button"
          onClick={start}
          className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 font-bold text-primary-foreground shadow-sm"
        >
          <Compass className="size-5" aria-hidden="true" />
          {'تشغيل البوصلة'}
        </button>
      ) : (
        heading === null && <p className="text-center text-sm text-muted-foreground">{'حرّك هاتفك على شكل رقم ٨ لمعايرة البوصلة...'}</p>
      )}
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        {'ضع الهاتف بشكل أفقي بعيداً عن المعادن والأجهزة الكهربائية للحصول على دقة أعلى.'}
      </p>
    </div>
  )
}
