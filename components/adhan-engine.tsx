'use client'

import { useEffect, useRef, useState } from 'react'
import { BellRing, X } from 'lucide-react'
import { getSettings, updateSettings, useSettings } from '@/lib/settings'
import { PRAYER_NAMES, PRAYER_ORDER, distanceKm, getPrayerTimes } from '@/lib/prayer'
import { COUNTRY_METHOD, reverseGeocode } from '@/lib/places'
import { getAdhanVoice } from '@/lib/adhan-list'

async function notify(title: string, body: string, prayer: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const reg = await navigator.serviceWorker?.getRegistration()
  if (reg?.active) {
    reg.active.postMessage({ type: 'show-adhan', title, body, prayer })
  } else {
    new Notification(title, { body, icon: '/icon-512.png', dir: 'rtl', lang: 'ar' })
  }
}

export function AdhanEngine() {
  const [settings] = useSettings()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const firedRef = useRef<Set<string>>(new Set())
  const [playing, setPlaying] = useState<string | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    const audio = new Audio()
    audio.preload = 'none'
    audio.onended = () => setPlaying(null)
    audioRef.current = audio

    const unlock = () => {
      const voice = getAdhanVoice(getSettings().adhanVoice)
      audio.muted = true
      if (voice) audio.src = `/audio/adhans/${voice.file}`
      audio.play().then(() => {
        audio.pause()
        audio.currentTime = 0
        audio.muted = false
      }).catch(() => { audio.muted = false })
      window.removeEventListener('pointerdown', unlock)
    }
    window.addEventListener('pointerdown', unlock, { once: true })

    return () => {
      window.removeEventListener('pointerdown', unlock)
      audio.pause()
    }
  }, [])

  useEffect(() => {
    if (!settings.location.auto || !('geolocation' in navigator)) return
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const current = getSettings().location
        const moved = distanceKm(current.lat, current.lng, latitude, longitude)
        if (moved < 5 && current.city !== 'مكة المكرمة') return
        try {
          const place = await reverseGeocode(latitude, longitude)
          updateSettings((s) => ({
            location: { ...s.location, lat: latitude, lng: longitude, city: place.city, country: place.country },
            method: COUNTRY_METHOD[place.countryCode] ?? s.method,
          }))
        } catch {
          updateSettings((s) => ({ location: { ...s.location, lat: latitude, lng: longitude, city: 'موقعي الحالي' } }))
        }
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 10 * 60 * 1000, timeout: 30000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [settings.location.auto])

  useEffect(() => {
    const tick = () => {
      const s = getSettings()
      const now = new Date()
      const times = getPrayerTimes(s, now)
      const day = now.toDateString()
      for (const key of PRAYER_ORDER) {
        const t = times[key].getTime()
        const diff = now.getTime() - t
        const reminderAt = t - s.reminderMinutes * 60000
        const remKey = `${day}-${key}-rem`
        if (s.reminderMinutes > 0 && now.getTime() >= reminderAt && now.getTime() < t && !firedRef.current.has(remKey)) {
          firedRef.current.add(remKey)
          notify(`اقتربت صلاة ${PRAYER_NAMES[key]}`, `بعد ${s.reminderMinutes} دقائق - ${s.location.city}`, key)
        }
        const adhanKey = `${day}-${key}`
        if (diff >= 0 && diff < 90000 && !firedRef.current.has(adhanKey)) {
          firedRef.current.add(adhanKey)
          if (!s.adhanEnabled[key]) continue
          notify(`حان الآن موعد أذان ${PRAYER_NAMES[key]}`, `حسب التوقيت المحلي لمدينة ${s.location.city}`, key)
          const audio = audioRef.current
          if (audio) {
            // ✅ إيقاف القرآن مباشرة (بدون انتظار الحدث)
            if (typeof window !== 'undefined' && (window as any).__stopQuran) {
              ;(window as any).__stopQuran()
            }
            // ✅ إطلاق الحدث (كاحتياط للمكونات الأخرى)
            window.dispatchEvent(new Event('adhan-started'))

            const voiceId = key === 'fajr' ? s.fajrVoice : s.adhanVoice
            const voice = getAdhanVoice(voiceId)
            if (voice) {
              audio.src = `/audio/adhans/${voice.file}`
              audio.volume = s.adhanVolume
              audio.play().then(() => setPlaying(key)).catch(() => {})
            }
          }
          if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: `أذان ${PRAYER_NAMES[key]}`,
              artist: s.location.city,
              artwork: [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
            })
          }
        }
      }
    }
    tick()
    const id = window.setInterval(tick, 10000)
    const onVisible = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  if (!playing) return null

  return (
    <div
      role="status"
      className="fixed inset-x-3 top-3 z-50 mx-auto flex max-w-sm items-center gap-2 rounded-xl bg-primary px-3 py-2 text-primary-foreground shadow-lg"
    >
      <BellRing className="size-5 shrink-0 animate-pulse" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm font-bold leading-tight">{`أذان ${PRAYER_NAMES[playing as keyof typeof PRAYER_NAMES]}`}</p>
        <p className="text-xs opacity-80">{'حيّ على الصلاة، حيّ على الفلاح'}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          audioRef.current?.pause()
          setPlaying(null)
        }}
        className="rounded-full bg-primary-foreground/15 p-2 hover:bg-primary-foreground/25"
        aria-label="إيقاف الأذان"
      >
        <X className="size-5" />
      </button>
    </div>
  )
}