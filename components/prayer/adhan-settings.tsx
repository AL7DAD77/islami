'use client'

import { useState, useEffect } from 'react'
import { Volume2, Play, Square, BatteryWarning } from 'lucide-react'
import { useSettings, type PrayerKey } from '@/lib/settings'
import { ADHAN_VOICES, getAdhanVoice, voiceIdFor } from '@/lib/adhan-list'
import { PRAYER_NAMES, PRAYER_ORDER } from '@/lib/prayer'
import { registerPlugin } from '@capacitor/core'

// تعريف الإضافة للتواصل مع الجافا
const AdhanScheduler = registerPlugin<any>('AdhanScheduler')

let previewAudio: HTMLAudioElement | null = null
let previewId: string | null = null

function stopPreview() {
  if (previewAudio) {
    previewAudio.pause()
    previewAudio.currentTime = 0
    previewAudio = null
  }
  previewId = null
}

export function AdhanSettings() {
  const [settings, update] = useSettings()
  const [playingId, setPlayingId] = useState<string | null>(previewId)
  const [batteryIgnored, setBatteryIgnored] = useState<boolean>(true) 

  useEffect(() => {
    const checkBattery = async () => {
      try {
        const res = await AdhanScheduler.checkBatteryOptimization()
        setBatteryIgnored(res.isIgnored)
      } catch (e) {
        console.log("ليست في بيئة أندرويد", e)
      }
    }
    checkBattery()
  }, [])

  const requestBatteryPermission = async () => {
    try {
      await AdhanScheduler.requestIgnoreBatteryOptimizations()
      setTimeout(async () => {
        const res = await AdhanScheduler.checkBatteryOptimization()
        setBatteryIgnored(res.isIgnored)
      }, 1000)
    } catch (e) {
      console.log(e)
    }
  }

  const setPlaying = (id: string | null) => setPlayingId(id)

  const preview = (id: string) => {
    const voice = getAdhanVoice(id)
    if (!voice) return
    if (previewId === id) {
      stopPreview()
      setPlaying(null)
      return
    }
    stopPreview()
    const audio = new Audio(`/audio/adhans/${voice.file}`)
    audio.volume = 1 
    audio.onended = () => {
      previewAudio = null
      previewId = null
      setPlaying(null)
    }
    audio.play().then(() => {
      previewAudio = audio
      previewId = id
      setPlaying(id)
    }).catch(() => {
      previewAudio = null
      previewId = null
      setPlaying(null)
    })
  }

  const setPrayerVoice = (prayer: PrayerKey, id: string) => {
    stopPreview()
    setPlaying(null)
    update((s) => ({ prayerVoices: { ...s.prayerVoices, [prayer]: id } }))
  }

  const setDefaultVoice = (id: string) => {
    stopPreview()
    setPlaying(null)
    update({ adhanVoice: id })
  }

  const defaultVoice = getAdhanVoice(settings.adhanVoice) || ADHAN_VOICES[0]

  return (
    <div className="flex flex-col gap-6">
      
      {/* تنبيه البطارية (يظهر فقط إذا كانت هناك مشكلة) */}
      {!batteryIgnored && (
        <section className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <BatteryWarning className="mt-0.5 size-6 shrink-0 text-amber-600 dark:text-amber-500" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 dark:text-amber-100">تفعيل العمل في الخلفية</h3>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                لكي يعمل الأذان في وقته تماماً ولا يتوقف عند إغلاق الشاشة، يرجى السماح للتطبيق بالعمل في الخلفية (تجاهل تحسين البطارية).
              </p>
              <button
                type="button"
                onClick={requestBatteryPermission}
                className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-700"
              >
                السماح بالعمل في الخلفية
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============ أذان كل صلاة ============ */}
      <section aria-labelledby="per-prayer">
        <h3 id="per-prayer" className="mb-1 text-sm font-bold text-muted-foreground">
          {'أذان كل صلاة'}
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">
          {'اختر لكل صلاة الأذان الذي تريده. الصلاة التي لم تختر لها شيئاً تأخذ الصوت الافتراضي.'}
        </p>

        <div className="flex flex-col gap-2">
          {PRAYER_ORDER.map((key: PrayerKey) => {
            const chosen = voiceIdFor(settings, key)
            const voice = getAdhanVoice(chosen) || ADHAN_VOICES[0]
            const isPlaying = playingId === voice.id
            const hasOwn = !!settings.prayerVoices?.[key]
            return (
              <div
                key={key}
                className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-zinc-800 dark:text-zinc-100">{`أذان ${PRAYER_NAMES[key]}`}</p>
                  {hasOwn && (
                    <button
                      type="button"
                      onClick={() => setPrayerVoice(key, '')}
                      className="text-xs text-emerald-700 underline dark:text-emerald-400"
                    >
                      {'استخدم الافتراضي'}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={voice.id}
                    onChange={(e) => setPrayerVoice(key, e.target.value)}
                    aria-label={`صوت أذان ${PRAYER_NAMES[key]}`}
                    className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    {ADHAN_VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => preview(voice.id)}
                    aria-label={isPlaying ? 'إيقاف' : 'تجربة'}
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full transition ${
                      isPlaying
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400'
                    }`}
                  >
                    {isPlaying ? <Square className="size-4" /> : <Play className="size-4" />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ============ الصوت الافتراضي (محدث إلى قائمة منسدلة) ============ */}
      <section aria-labelledby="default-voice">
        <div className="mb-3 rounded-2xl bg-linear-to-l from-emerald-600 to-emerald-700 p-4 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-white/20">
              <Volume2 className="size-5" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="text-xs opacity-80">{'الصوت الافتراضي للصلوات التي لم تختر لها'}</p>
              <p className="font-bold">{defaultVoice.name}</p>
            </div>
          </div>
        </div>

        <h3 id="default-voice" className="mb-2 text-sm font-bold text-muted-foreground">
          {'اختر الصوت الافتراضي'}
        </h3>
        
        {/* التصميم الجديد: قائمة منسدلة بدلاً من القائمة الطويلة */}
        <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <select
            value={settings.adhanVoice}
            onChange={(e) => setDefaultVoice(e.target.value)}
            aria-label="اختر الصوت الافتراضي"
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            {ADHAN_VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => preview(defaultVoice.id)}
            aria-label={playingId === defaultVoice.id ? 'إيقاف' : 'تجربة'}
            className={`flex size-10 shrink-0 items-center justify-center rounded-full transition ${
              playingId === defaultVoice.id
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400'
            }`}
          >
            {playingId === defaultVoice.id ? <Square className="size-4" /> : <Play className="size-4" />}
          </button>
        </div>
      </section>

    </div>
  )
}