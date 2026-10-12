'use client'

import { useEffect, useRef, useState } from 'react'
import { BellRing, X } from 'lucide-react'
import { getSettings, useSettings } from '@/lib/settings'
import { PRAYER_NAMES, PRAYER_ORDER, getPrayerTimes } from '@/lib/prayer'
import { updateAutoLocation } from '@/lib/location'
import { getAdhanVoice } from '@/lib/adhan-list'
import {
  registerAppStateListener,
  showNativeNotification,
  requestNativeNotificationPermission,
  isAdhanSchedulerAvailable,
  scheduleNativeAdhans,
  stopNativeAdhan,
  type ScheduledItem,
} from '@/lib/native'
import type { AppSettings } from '@/lib/settings'

// ============ جدولة الأذان على مستوى النظام (أندرويد) ============
// تُجدول الأذانات والتذكيرات للأيام القادمة، فتعمل والتطبيق مغلق وبدون فتحه.
const SCHEDULE_DAYS = 25

function buildSchedule(s: AppSettings): ScheduledItem[] {
  const items: ScheduledItem[] = []
  const now = Date.now()
  for (let d = 0; d < SCHEDULE_DAYS; d++) {
    const date = new Date()
    date.setDate(date.getDate() + d)
    const times = getPrayerTimes(s, date)
    PRAYER_ORDER.forEach((key, idx) => {
      const t = times[key].getTime()
      if (t <= now) return
      const name = PRAYER_NAMES[key]
      if (s.reminderMinutes > 0 && t - s.reminderMinutes * 60000 > now) {
        items.push({
          id: d * 10 + idx * 2 + 1,
          at: t - s.reminderMinutes * 60000,
          kind: 'reminder',
          prayer: key,
          title: `اقتربت صلاة ${name}`,
          body: `بعد ${s.reminderMinutes} دقائق - ${s.location.city}`,
        })
      }
      if (s.adhanEnabled[key]) {
        const voice = getAdhanVoice(key === 'fajr' ? s.fajrVoice : s.adhanVoice)
        items.push({
          id: d * 10 + idx * 2 + 2,
          at: t,
          kind: 'adhan',
          prayer: key,
          title: `حان الآن موعد أذان ${name}`,
          body: `حسب التوقيت المحلي لمدينة ${s.location.city}`,
          file: voice?.file,
          volume: s.adhanVolume,
        })
      }
    })
  }
  return items.sort((a, b) => a.at - b.at)
}

// ============ Audio Singleton ============
let globalAudio: HTMLAudioElement | null = null

function getGlobalAudio(): HTMLAudioElement {
  if (!globalAudio) {
    globalAudio = new Audio()
    globalAudio.preload = 'none'
  }
  return globalAudio
}

function stopAdhanAudio() {
  const audio = getGlobalAudio()
  if (!audio.paused) {
    audio.pause()
    audio.currentTime = 0
  }
}

// ============ Notify ============
async function notify(title: string, body: string) {
  await showNativeNotification(title, body)
}

// ============ Component ============
export function AdhanEngine() {
  const [settings] = useSettings()
  const firedRef = useRef<Set<string>>(new Set())
  const [playing, setPlaying] = useState<string | null>(null)

  // ============ Init ============
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    const audio = getGlobalAudio()
    audio.onended = () => setPlaying(null)

    // اطلب إذن الإشعارات
    requestNativeNotificationPermission().catch(() => {})

    return () => {
      audio.onended = null
    }
  }, [])

  // ============ App State (يعمل في الخلفية) ============
  useEffect(() => {
    const cleanup = registerAppStateListener(() => {
      const audio = getGlobalAudio()
      if (audio.paused && playing) {
        setPlaying(null)
      }
    })
    return cleanup
  }, [playing])

  // ============ Geolocation Auto ============
  // - يطلب الإذن مرة واحدة فقط (لا يكرر النافذة كل بضع دقائق)
  // - يستخدم الموقع التقريبي (يكفي للمدن ويوفر البطارية)
  // - يحدّث عند فتح التطبيق/العودة إليه وكل ٣٠ دقيقة
  useEffect(() => {
    if (!settings.location.auto) return
    let asked = false
    let lastRun = 0

    const run = async (force = false) => {
      if (!force && Date.now() - lastRun < 60_000) return
      lastRun = Date.now()
      const result = await updateAutoLocation({ askPermission: !asked })
      asked = true
      if (result === 'denied' || result === 'error') return
    }

    run(true)
    const id = setInterval(() => run(true), 30 * 60 * 1000)
    const off = registerAppStateListener(() => run())
    return () => {
      clearInterval(id)
      off()
    }
  }, [settings.location.auto])

  // ============ جدولة النظام (تعمل في الخلفية) ============
  const scheduleKey = JSON.stringify([
    settings.location.lat,
    settings.location.lng,
    settings.location.city,
    settings.method,
    settings.madhab,
    settings.adhanEnabled,
    settings.adhanVoice,
    settings.fajrVoice,
    settings.adhanVolume,
    settings.reminderMinutes,
    settings.persistentNotification,
  ])

  useEffect(() => {
    if (!isAdhanSchedulerAvailable()) return
    const run = () => {
      const s = getSettings()
      scheduleNativeAdhans(buildSchedule(s), s.persistentNotification, s.location.city)
    }
    run()
    // أعد الجدولة كلما عاد التطبيق للواجهة (لتمديد الأيام المجدولة)
    return registerAppStateListener(run)
  }, [scheduleKey])

  // ============ Prayer Tick ============
  useEffect(() => {
    const tick = () => {
      // في تطبيق أندرويد الجديد يتولى النظام الأذان والتذكير (حتى والتطبيق مغلق)
      if (isAdhanSchedulerAvailable()) return
      const s = getSettings()
      const now = new Date()
      const times = getPrayerTimes(s, now)
      const day = now.toDateString()

      for (const key of PRAYER_ORDER) {
        const t = times[key].getTime()
        const diff = now.getTime() - t
        const reminderAt = t - s.reminderMinutes * 60000
        const remKey = `${day}-${key}-rem`

        // تذكير قبل الأذان
        if (
          s.reminderMinutes > 0 &&
          now.getTime() >= reminderAt &&
          now.getTime() < t &&
          !firedRef.current.has(remKey)
        ) {
          firedRef.current.add(remKey)
          notify(
            `اقتربت صلاة ${PRAYER_NAMES[key]}`,
            `بعد ${s.reminderMinutes} دقائق - ${s.location.city}`
          )
        }

        // الأذان
        const adhanKey = `${day}-${key}`
        if (diff >= 0 && diff < 90000 && !firedRef.current.has(adhanKey)) {
          firedRef.current.add(adhanKey)
          if (!s.adhanEnabled[key]) continue

          notify(
            `حان الآن موعد أذان ${PRAYER_NAMES[key]}`,
            `حسب التوقيت المحلي لمدينة ${s.location.city}`
          )

          const audio = getGlobalAudio()
          const voiceId = key === 'fajr' ? s.fajrVoice : s.adhanVoice
          const voice = getAdhanVoice(voiceId)

          if (voice) {
            // ⚠️ 1. أوقف أي أذان يعمل حالياً
            stopAdhanAudio()

            // ⚠️ 2. أوقف القرآن
            if (typeof window !== 'undefined' && (window as any).__stopQuran) {
              ;(window as any).__stopQuran()
            }
            window.dispatchEvent(new Event('adhan-started'))

            // ⚠️ 3. شغّل الأذان الجديد
            audio.src = `/audio/adhans/${voice.file}`
            audio.volume = s.adhanVolume
            audio
              .play()
              .then(() => setPlaying(key))
              .catch((e) => console.warn('Adhan play failed:', e))
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
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
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
        <p className="text-sm font-bold leading-tight">
          {`أذان ${PRAYER_NAMES[playing as keyof typeof PRAYER_NAMES]}`}
        </p>
        <p className="text-xs opacity-80">{'حيّ على الصلاة، حيّ على الفلاح'}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          stopAdhanAudio()
          stopNativeAdhan()
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