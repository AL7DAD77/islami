'use client'

import { useState, useEffect } from 'react'
import { Volume2, Check, Play, Square, BatteryWarning, ShieldCheck } from 'lucide-react'
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
  const [volume, setVolume] = useState<number>(70)
  const [batteryIgnored, setBatteryIgnored] = useState<boolean>(true) // افتراضي true حتى نتأكد

  // استرجاع مستوى الصوت وحالة البطارية
  useEffect(() => {
    const savedVolume = localStorage.getItem('adhan_volume')
    if (savedVolume !== null) {
      setVolume(Number(savedVolume))
    }

    // فحص حالة البطارية من الأندرويد
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

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    localStorage.setItem('adhan_volume', String(newVolume))
    if (previewAudio) previewAudio.volume = newVolume / 100
  }

  const requestBatteryPermission = async () => {
    try {
      await AdhanScheduler.requestIgnoreBatteryOptimizations()
      // سنقوم بتحديث الحالة بعد ثانية (لأن المستخدم قد يستغرق وقتاً في الشاشة)
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
    audio.volume = volume / 100
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
      
      {/* ============ إذن البطارية (جديد) ============ */}
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

      {batteryIgnored && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          <ShieldCheck className="size-4" />
          <span>التطبيق يعمل في الخلفية بشكل مثالي (الأذان مضمون).</span>
        </div>
      )}

      {/* ============ مستوى الصوت ============ */}
      <section aria-labelledby="volume-setting">
        <div className="mb-3 flex items-center justify-between">
          <h3 id="volume-setting" className="text-sm font-bold text-muted-foreground flex items-center gap-2">
            <Volume2 className="size-4" />
            {'مستوى صوت الأذان'}
          </h3>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {volume}%
          </span>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={volume} 
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-full accent-emerald-600 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
          />
          <div className="flex justify-between text-xs text-zinc-400 mt-2">
            <span>صامت</span>
            <span>عالي</span>
          </div>
        </div>
      </section>

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

      {/* ============ الصوت الافتراضي ============ */}
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
        <div className="flex flex-col gap-2">
          {ADHAN_VOICES.map((voice) => {
            const selected = settings.adhanVoice === voice.id
            const isPlaying = playingId === voice.id
            return (
              <div
                key={voice.id}
                className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                  selected
                    ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
                    : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setDefaultVoice(voice.id)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800"
                  aria-label={selected ? 'مختار' : 'اختيار'}
                >
                  {selected ? (
                    <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <span className="size-3 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />
                  )}
                </button>
                <button type="button" onClick={() => setDefaultVoice(voice.id)} className="flex-1 text-right">
                  <p className="font-bold text-zinc-800 dark:text-zinc-100">{voice.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{voice.reciter}</p>
                </button>
                <button
                  type="button"
                  onClick={() => preview(voice.id)}
                  aria-label={isPlaying ? 'إيقاف' : 'تجربة'}
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full transition ${
                    isPlaying
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400'
                  }`}
                >
                  {isPlaying ? <Square className="size-3.5" /> : <Play className="size-4" />}
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}