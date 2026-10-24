'use client'

import { useEffect, useRef, useState } from 'react'
import { BellRing, X } from 'lucide-react'
import { getSettings, useSettings } from '@/lib/settings'
import { PRAYER_NAMES, PRAYER_ORDER, getPrayerTimes } from '@/lib/prayer'
import { updateAutoLocation } from '@/lib/location'
import { getAdhanVoice, voiceIdFor } from '@/lib/adhan-list'
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

const SCHEDULE_DAYS = 15
const SHORT_ADHAN_FILE = 'takbeeratain.mp3'

function speak(text: string) {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ar-SA'
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  } catch (e) {}
}

function buildSchedule(s: AppSettings): ScheduledItem[] {
  const items: ScheduledItem[] = []
  const now = Date.now()
  const timeline: number[] = []

  // 1. جدولة الصلوات
  for (let d = -1; d < SCHEDULE_DAYS; d++) {
    const date = new Date()
    date.setDate(date.getDate() + d)
    const times = getPrayerTimes(s, date)

    PRAYER_ORDER.forEach((key, idx) => {
      const t = times[key].getTime()
      timeline.push(t)
      const enabled = s.adhanEnabled[key]
      const name = PRAYER_NAMES[key]

      if (!enabled || t <= now) {
        items.push({ id: d * 10 + idx * 2 + 2, at: t, kind: 'phase', prayer: key, title: '', body: '' })
        return
      }
      
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
      
      const voiceId = voiceIdFor(s, key)
      const voice = getAdhanVoice(voiceId)
      // الاعتماد فقط على اختيار المؤذن (إذا اختار تكبيرتان نستخدم الملف القصير)
      const finalFile = voiceId === 'takbeeratain' ? SHORT_ADHAN_FILE : voice?.file;

      items.push({
        id: d * 10 + idx * 2 + 2,
        at: t,
        kind: 'adhan',
        prayer: key,
        title: `حان الآن موعد أذان ${name}`,
        body: `حسب التوقيت المحلي لمدينة ${s.location.city}`,
        file: finalFile,
        volume: 1,
      })
    })
  }

  // 2. جدولة تذكيرات الصلاة على النبي
  if (s.salawatEnabled && s.salawatInterval > 0) {
    let nextTime = now + s.salawatInterval * 60000;
    const totalReminders = Math.floor((SCHEDULE_DAYS * 24 * 60) / s.salawatInterval);
    
    for (let i = 1; i <= totalReminders; i++) {
      items.push({
        id: 300000 + i,
        at: nextTime,
        kind: 'reminder',
        prayer: 'salawat',
        title: 'صلِّ على النبي ﷺ',
        body: 'اللهم صلِّ وسلم على نبينا محمد',
      });
      nextTime += s.salawatInterval * 60000;
    }
  }

  // 3. جدولة تذكيرات الأذكار والقرآن
  if (s.adhkarRemindersEnabled && s.adhkarRemindersInterval > 0) {
    let nextTime = now + s.adhkarRemindersInterval * 60000;
    const totalReminders = Math.floor((SCHEDULE_DAYS * 24 * 60) / s.adhkarRemindersInterval);

    for (let i = 1; i <= totalReminders; i++) {
      items.push({
        id: 400000 + i,
        at: nextTime,
        kind: 'reminder',
        prayer: 'adhkar',
        title: 'تذكير بالأذكار',
        body: 'لا تنسَ أذكار الصباح والمساء ووردك من القرآن',
      });
      nextTime += s.adhkarRemindersInterval * 60000;
    }
  }

  timeline.sort((a, b) => a - b)
  for (let i = 0; i < timeline.length - 1; i++) {
    const mid = Math.round((timeline[i] + timeline[i + 1]) / 2)
    if (mid > now) items.push({ id: 200000 + i, at: mid, kind: 'phase', prayer: '', title: '', body: '' })
  }

  return items.sort((a, b) => a.at - b.at)
}

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

async function notify(title: string, body: string) {
  await showNativeNotification(title, body)
}

export function AdhanEngine() {
  const [settings] = useSettings()
  const firedRef = useRef<Set<string>>(new Set())
  const [playing, setPlaying] = useState<string | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    const audio = getGlobalAudio()
    audio.onended = () => setPlaying(null)

    requestNativeNotificationPermission().catch(() => {})

    return () => {
      audio.onended = null
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    const cleanup = registerAppStateListener(() => {
      const audio = getGlobalAudio()
      if (audio.paused && playing) {
        setPlaying(null)
      }
    })
    return cleanup
  }, [playing])

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

  // مفاتيح الجدولة (تمت إزالة adhanType)
  const scheduleKey = JSON.stringify([
    settings.location.lat,
    settings.location.lng,
    settings.location.city,
    settings.method,
    settings.madhab,
    settings.adhanEnabled,
    settings.adhanVoice,
    settings.fajrVoice,
    JSON.stringify(settings.prayerVoices),
    settings.reminderMinutes,
    settings.persistentNotification,
    settings.salawatEnabled,
    settings.salawatInterval,
    settings.adhkarRemindersEnabled,
    settings.adhkarRemindersInterval,
  ])

  useEffect(() => {
    if (!isAdhanSchedulerAvailable()) return
    const run = () => {
      const s = getSettings()
      scheduleNativeAdhans(buildSchedule(s), s.persistentNotification, s.location.city)
    }
    run()
    return registerAppStateListener(run)
  }, [scheduleKey])

  useEffect(() => {
    const tick = () => {
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

        if (
          s.reminderMinutes > 0 &&
          now.getTime() >= reminderAt &&
          now.getTime() < t &&
          !firedRef.current.has(remKey)
        ) {
          firedRef.current.add(remKey)
          notify(`اقتربت صلاة ${PRAYER_NAMES[key]}`, `بعد ${s.reminderMinutes} دقائق - ${s.location.city}`)
          speak(`اقتربت صلاة ${PRAYER_NAMES[key]}، بعد ${s.reminderMinutes} دقائق.`)
        }

        const adhanKey = `${day}-${key}`
        if (diff >= 0 && diff < 90000 && !firedRef.current.has(adhanKey)) {
          firedRef.current.add(adhanKey)
          if (!s.adhanEnabled[key]) continue

          notify(`حان الآن موعد أذان ${PRAYER_NAMES[key]}`, `حسب التوقيت المحلي لمدينة ${s.location.city}`)

          const audio = getGlobalAudio()
          const voiceId = voiceIdFor(s, key)
          const voice = getAdhanVoice(voiceId)
          const finalFile = voiceId === 'takbeeratain' ? SHORT_ADHAN_FILE : voice?.file;

          if (finalFile) {
            stopAdhanAudio()
            if (typeof window !== 'undefined' && (window as any).__stopQuran) {
              ;(window as any).__stopQuran()
            }
            window.dispatchEvent(new Event('adhan-started'))

            audio.src = `/audio/adhans/${finalFile}`
            audio.volume = 1
            audio
              .play()
              .then(() => setPlaying(key))
              .catch((e) => console.warn('Adhan play failed:', e))
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