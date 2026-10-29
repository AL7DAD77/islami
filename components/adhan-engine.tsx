'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

/* ============================== الثوابت ============================== */

const SCHEDULE_DAYS = 15
const LOCATION_UPDATE_INTERVAL = 30 * 60 * 1000
const LOCATION_UPDATE_COOLDOWN = 60 * 1000
const MIDNIGHT_EVENT_BASE_ID = 100000
const PHASE_EVENT_BASE_ID = 200000
const SALAWAT_EVENT_BASE_ID = 300000
const ADHKAR_EVENT_BASE_ID = 400000

const SHORT_ADHAN_FILE = 'takbeeratain.mp3'
const ADHAN_SPEECH_RATE = 0.9

const MINUTE_MS = 60 * 1000

/* ============================== الأنواع ============================== */

type PrayerKey = keyof typeof PRAYER_NAMES

interface ScheduleContext {
  settings: AppSettings
  now: number
}

/* ============================ أدوات الصوت ============================ */

let globalAudio: HTMLAudioElement | null = null

function getGlobalAudio(): HTMLAudioElement {
  if (!globalAudio) {
    globalAudio = new Audio()
    globalAudio.preload = 'none'
  }

  return globalAudio
}

function stopAdhanAudio(): void {
  const audio = getGlobalAudio()

  if (!audio.paused) {
    audio.pause()
    audio.currentTime = 0
  }
}

function speak(text: string): void {
  try {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      return
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ar-SA'
    utterance.rate = ADHAN_SPEECH_RATE

    window.speechSynthesis.speak(utterance)
  } catch {
    // تجاهل الأجهزة أو المتصفحات غير المدعومة
  }
}

function cancelSpeech(): void {
  try {
    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    ) {
      window.speechSynthesis.cancel()
    }
  } catch {
    // تجاهل الأخطاء
  }
}

async function notify(title: string, body: string): Promise<void> {
  await showNativeNotification(title, body)
}

/* ========================== بناء جدولة الأذان ========================== */

function createMidnightEvents(
  context: ScheduleContext,
  items: ScheduledItem[],
): void {
  const { settings, now } = context

  for (let dayOffset = -1; dayOffset < SCHEDULE_DAYS; dayOffset++) {
    const date = new Date()
    date.setDate(date.getDate() + dayOffset)

    const midnight = new Date(date)
    midnight.setHours(0, 0, 0, 0)

    if (midnight.getTime() <= now) {
      continue
    }

    items.push({
      id: MIDNIGHT_EVENT_BASE_ID + dayOffset + 2,
      at: midnight.getTime(),
      kind: 'time',
      prayer: '',
      title: '',
      body: '',
    })
  }

  void settings
}

function createPrayerEvents(
  context: ScheduleContext,
  items: ScheduledItem[],
): number[] {
  const { settings, now } = context
  const timeline: number[] = []

  for (let dayOffset = -1; dayOffset < SCHEDULE_DAYS; dayOffset++) {
    const date = new Date()
    date.setDate(date.getDate() + dayOffset)

    const times = getPrayerTimes(settings, date)

    PRAYER_ORDER.forEach((key, index) => {
      const prayerTime = times[key].getTime()
      timeline.push(prayerTime)

      const isAdhanEnabled = settings.adhanEnabled[key]
      const prayerName = PRAYER_NAMES[key]

      if (!isAdhanEnabled || prayerTime <= now) {
        items.push({
          id: dayOffset * 10 + index * 2 + 2,
          at: prayerTime,
          kind: 'phase',
          prayer: key,
          title: '',
          body: '',
        })
        return
      }

      // ✅ تم حذف التنبيه المسبق نهائياً، والاكتفاء بالأذان الفعلي فقط
      createAdhanEvent(
        context,
        items,
        key,
        prayerName,
        prayerTime,
        dayOffset,
        index,
      )
    })
  }

  return timeline
}

function createAdhanEvent(
  context: ScheduleContext,
  items: ScheduledItem[],
  prayerKey: PrayerKey,
  prayerName: string,
  prayerTime: number,
  dayOffset: number,
  prayerIndex: number,
): void {
  const { settings } = context

  const voiceId = voiceIdFor(settings, prayerKey)
  const voice = getAdhanVoice(voiceId)

  const audioFile =
    voiceId === 'takbeeratain'
      ? SHORT_ADHAN_FILE
      : voice?.file

  items.push({
    id: dayOffset * 10 + prayerIndex * 2 + 2,
    at: prayerTime,
    kind: 'adhan',
    prayer: prayerKey,
    title: `حان الآن موعد أذان ${prayerName}`,
    body: `حسب التوقيت المحلي لمدينة ${settings.location.city}`,
    file: audioFile,
    volume: 1,
  })
}

function createPhaseEvents(
  timeline: number[],
  now: number,
  items: ScheduledItem[],
): void {
  const sortedTimeline = [...timeline].sort((a, b) => a - b)

  for (let index = 0; index < sortedTimeline.length - 1; index++) {
    const current = sortedTimeline[index]
    const next = sortedTimeline[index + 1]

    const middleTime = Math.round((current + next) / 2)

    if (middleTime <= now) {
      continue
    }

    items.push({
      id: PHASE_EVENT_BASE_ID + index,
      at: middleTime,
      kind: 'phase',
      prayer: '',
      title: '',
      body: '',
    })
  }
}

function createRepeatedReminderEvents(
  context: ScheduleContext,
  items: ScheduledItem[],
): void {
  const { settings, now } = context

  if (settings.salawatEnabled && settings.salawatInterval > 0) {
    createRepeatedEvents({
      items,
      now,
      baseId: SALAWAT_EVENT_BASE_ID,
      intervalMinutes: settings.salawatInterval,
      prayerKey: 'salawat',
      title: 'صلِّ على النبي ﷺ',
      body: 'اللهم صلِّ وسلم على نبينا محمد',
    })
  }

  if (
    settings.adhkarRemindersEnabled &&
    settings.adhkarRemindersInterval > 0
  ) {
    createRepeatedEvents({
      items,
      now,
      baseId: ADHKAR_EVENT_BASE_ID,
      intervalMinutes: settings.adhkarRemindersInterval,
      prayerKey: 'adhkar',
      title: 'تذكير بالأذكار',
      body: 'لا تنسَ أذكار الصباح والمساء ووردك من القرآن',
    })
  }
}

function createRepeatedEvents(options: {
  items: ScheduledItem[]
  now: number
  baseId: number
  intervalMinutes: number
  prayerKey: string
  title: string
  body: string
}): void {
  const {
    items,
    now,
    baseId,
    intervalMinutes,
    prayerKey,
    title,
    body,
  } = options

  const intervalMs = intervalMinutes * MINUTE_MS
  const totalDurationMs = SCHEDULE_DAYS * 24 * 60 * MINUTE_MS

  const totalReminders = Math.floor(totalDurationMs / intervalMs)

  let nextTime = now + intervalMs

  for (let index = 1; index <= totalReminders; index++) {
    items.push({
      id: baseId + index,
      at: nextTime,
      kind: 'reminder',
      prayer: prayerKey,
      title,
      body,
    })

    nextTime += intervalMs
  }
}

function buildSchedule(settings: AppSettings): ScheduledItem[] {
  const now = Date.now()
  const context: ScheduleContext = { settings, now }

  const items: ScheduledItem[] = []

  createMidnightEvents(context, items)

  const timeline = createPrayerEvents(context, items)

  createPhaseEvents(timeline, now, items)
  createRepeatedReminderEvents(context, items)

  return items.sort((a, b) => a.at - b.at)
}

/* ============================ مكوّن المحرك ============================ */

export function AdhanEngine() {
  const [settings] = useSettings()

  const [playing, setPlaying] = useState<PrayerKey | null>(null)

  const firedRef = useRef<Set<string>>(new Set())

  /* ------------------------- تهيئة أولية ------------------------- */

  useEffect(() => {
    let isMounted = true

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(error => {
          console.warn('تعذر تسجيل Service Worker:', error)
        })
    }

    const audio = getGlobalAudio()

    const handleAudioEnd = () => {
      if (isMounted) {
        setPlaying(null)
      }
    }

    audio.addEventListener('ended', handleAudioEnd)

    requestNativeNotificationPermission().catch(() => {
      // المستخدم قد يرفض الإذن، لا حاجة لإظهار خطأ
    })

    return () => {
      isMounted = false
      audio.removeEventListener('ended', handleAudioEnd)
      cancelSpeech()
    }
  }, [])

  /* --------------------- مزامنة حالة التشغيل --------------------- */

  useEffect(() => {
    const cleanup = registerAppStateListener(() => {
      const audio = getGlobalAudio()

      if (audio.paused && playing) {
        setPlaying(null)
      }
    })

    return cleanup
  }, [playing])

  /* ------------------------- تحديث الموقع ------------------------- */

  useEffect(() => {
    if (!settings.location.auto) {
      return
    }

    let permissionAsked = false
    let lastRunAt = 0

    const updateLocation = async (force = false): Promise<void> => {
      const elapsed = Date.now() - lastRunAt

      if (!force && elapsed < LOCATION_UPDATE_COOLDOWN) {
        return
      }

      lastRunAt = Date.now()

      const result = await updateAutoLocation({
        askPermission: !permissionAsked,
      })

      permissionAsked = true

      if (result === 'denied' || result === 'error') {
        return
      }
    }

    updateLocation(true)

    const intervalId = setInterval(() => {
      updateLocation(true)
    }, LOCATION_UPDATE_INTERVAL)

    const removeListener = registerAppStateListener(() => {
      updateLocation()
    })

    return () => {
      clearInterval(intervalId)
      removeListener()
    }
  }, [settings.location.auto])

  /* ------------------------ جدولة الأذان ------------------------ */

  const scheduleKey = useMemo(() => {
    return JSON.stringify([
      settings.location.lat,
      settings.location.lng,
      settings.location.city,
      settings.method,
      settings.madhab,
      settings.adhanEnabled,
      settings.adhanVoice,
      settings.fajrVoice,
      settings.prayerVoices,
      // ✅ تم حذف reminderMinutes من هنا
      settings.persistentNotification,
      settings.salawatEnabled,
      settings.salawatInterval,
      settings.adhkarRemindersEnabled,
      settings.adhkarRemindersInterval,
    ])
  }, [
    settings.location.lat,
    settings.location.lng,
    settings.location.city,
    settings.method,
    settings.madhab,
    settings.adhanEnabled,
    settings.adhanVoice,
    settings.fajrVoice,
    settings.prayerVoices,
    settings.persistentNotification,
    settings.salawatEnabled,
    settings.salawatInterval,
    settings.adhkarRemindersEnabled,
    settings.adhkarRemindersInterval,
  ])

  useEffect(() => {
    if (!isAdhanSchedulerAvailable()) {
      return
    }

    const scheduleAdhans = (): void => {
      const currentSettings = getSettings()

      scheduleNativeAdhans(
        buildSchedule(currentSettings),
        currentSettings.persistentNotification,
        currentSettings.location.city,
      )
    }

    scheduleAdhans()

    return registerAppStateListener(scheduleAdhans)
  }, [scheduleKey])

  /* --------------------------- إيقاف الأذان --------------------------- */

  const handleStopAdhan = useCallback(() => {
    stopAdhanAudio()
    stopNativeAdhan()
    setPlaying(null)
  }, [])

  /* ------------------------------ الواجهة ------------------------------ */

  if (!playing) {
    return null
  }

  return (
    <div
      role="status"
      className="fixed inset-x-3 top-3 z-50 mx-auto flex max-w-sm items-center gap-2 rounded-xl bg-primary px-3 py-2 text-primary-foreground shadow-lg"
    >
      <BellRing
        className="size-5 shrink-0 animate-pulse"
        aria-hidden="true"
      />

      <div className="flex-1">
        <p className="text-sm font-bold leading-tight">
          {`أذان ${PRAYER_NAMES[playing]}`}
        </p>

        <p className="text-xs opacity-80">
          {'حيّ على الصلاة، حيّ على الفلاح'}
        </p>
      </div>

      <button
        type="button"
        onClick={handleStopAdhan}
        className="rounded-full bg-primary-foreground/15 p-2 transition-colors hover:bg-primary-foreground/25"
        aria-label="إيقاف الأذان"
      >
        <X className="size-5" />
      </button>
    </div>
  )
}