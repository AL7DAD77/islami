'use client'

import { useState, useEffect } from 'react'
import { Volume2, Play, Square, BatteryWarning, FlaskConical } from 'lucide-react'
import { useSettings, type PrayerKey } from '@/lib/settings'
import { ADHAN_VOICES, getAdhanVoice } from '@/lib/adhan-list'
import { PRAYER_NAMES, PRAYER_ORDER } from '@/lib/prayer'
import { registerPlugin } from '@capacitor/core'
import { isNativePlatform, testNativeAdhan } from '@/lib/native'
import { useLanguage } from '@/lib/language-context'

const SystemSettings = isNativePlatform()
  ? registerPlugin<any>('SystemSettings')
  : null

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
  const [isTesting, setIsTesting] = useState<boolean>(false)
  const { dict, locale } = useLanguage()

  useEffect(() => {
    const checkBattery = async () => {
      try {
        if (!SystemSettings) return

        const res = await SystemSettings.checkBatteryOptimization()
        setBatteryIgnored(res.isIgnored)
      } catch (e) {
        console.log('ليست في بيئة أندرويد', e)
      }
    }

    checkBattery()
  }, [])

  const requestBatteryPermission = async () => {
    try {
      if (!SystemSettings) return

      await SystemSettings.requestIgnoreBatteryOptimizations()

      setTimeout(async () => {
        const res = await SystemSettings.checkBatteryOptimization()
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

  const runAdhanTest = async () => {
    if (!isNativePlatform() || isTesting) return

    setIsTesting(true)
    stopPreview()
    setPlaying(null)

    try {
      await testNativeAdhan(10, 'makkah_al_banna.mp3', 1)
    } catch (error) {
      console.warn('تعذر تشغيل تجربة الأذان:', error)
    } finally {
      setTimeout(() => {
        setIsTesting(false)
      }, 10000)
    }
  }

  // ✅ التعديل الجوهري: حفظ في prayerVoices[key] لكل صلاة على حدة
  const setPrayerVoice = (prayer: PrayerKey, id: string) => {
    stopPreview()
    setPlaying(null)

    update((s) => {
      const nextVoices = { ...s.prayerVoices }

      if (!id) {
        delete nextVoices[prayer]
      } else {
        nextVoices[prayer] = id
      }

      return { prayerVoices: nextVoices }
    })
  }

  const setDefaultVoice = (id: string) => {
    stopPreview()
    setPlaying(null)
    update({ adhanVoice: id })
  }

  const setFajrDefaultVoice = (id: string) => {
    stopPreview()
    setPlaying(null)
    update({ fajrVoice: id })
  }

  const defaultVoice = getAdhanVoice(settings.adhanVoice) || ADHAN_VOICES[0]
  const fajrDefaultVoice = getAdhanVoice(settings.fajrVoice) || ADHAN_VOICES[0]

  const getPrayerName = (key: string) => {
    const dictKey = key.toLowerCase() as keyof typeof dict.prayers
    return dict.prayers[dictKey] || PRAYER_NAMES[key as keyof typeof PRAYER_NAMES]
  }

  return (
    <div className="flex flex-col gap-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* زر تجربة مؤقت */}
      {isNativePlatform() && (
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <FlaskConical className="size-5 text-primary" />
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-foreground">
                تجربة الأذان المؤقتة
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                سيبدأ أذان مكة المكرمة بعد 10 ثوانٍ لاختبار الصوت على الجهاز.
              </p>

              <button
                type="button"
                onClick={runAdhanTest}
                disabled={isTesting}
                className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {isTesting ? 'سيبدأ الأذان بعد 10 ثوانٍ...' : 'تجربة الأذان'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* تنبيه البطارية */}
      {!batteryIgnored && (
        <section className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <BatteryWarning className="mt-0.5 size-6 shrink-0 text-amber-600 dark:text-amber-500" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 dark:text-amber-100">{dict.adhanSettings.batteryTitle}</h3>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                {dict.adhanSettings.batteryDesc}
              </p>
              <button
                type="button"
                onClick={requestBatteryPermission}
                className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-700"
              >
                {dict.adhanSettings.batteryButton}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* أذان كل صلاة */}
      <section aria-labelledby="per-prayer">
        <h3 id="per-prayer" className="mb-1 text-sm font-bold text-muted-foreground">
          {dict.adhanSettings.perPrayerTitle}
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">
          {dict.adhanSettings.perPrayerDesc}
        </p>

        <div className="flex flex-col gap-2">
          {PRAYER_ORDER.map((key: PrayerKey) => {
            const customVoiceId = settings.prayerVoices[key]
            const hasOwn = customVoiceId !== undefined

            const effectiveVoiceId =
              customVoiceId ??
              (key === 'fajr' ? settings.fajrVoice : settings.adhanVoice)

            const voice = getAdhanVoice(effectiveVoiceId) || ADHAN_VOICES[0]
            const isPlaying = playingId === voice.id

            return (
              <div
                key={key}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-foreground">
                    {`${dict.adhanSettings.adhanFor} ${getPrayerName(key)}`}
                  </p>
                  {hasOwn && (
                    <button
                      type="button"
                      onClick={() => setPrayerVoice(key, '')}
                      className="text-xs text-primary underline"
                    >
                      {dict.adhanSettings.useDefault}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={voice.id}
                    onChange={(e) => setPrayerVoice(key, e.target.value)}
                    aria-label={`${dict.adhanSettings.adhanFor} ${getPrayerName(key)}`}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
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
                    aria-label={isPlaying ? dict.adhanSettings.stop : dict.adhanSettings.play}
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

      {/* الصوت الافتراضي */}
      <section aria-labelledby="default-voice">
        <div className="mb-3 rounded-2xl bg-linear-to-l from-emerald-600 to-emerald-700 p-4 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-white/20">
              <Volume2 className="size-5" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="text-xs opacity-80">{dict.adhanSettings.defaultVoiceTitle}</p>
              <p className="font-bold">{defaultVoice.name}</p>
            </div>
          </div>
        </div>

        <h3 id="default-voice" className="mb-2 text-sm font-bold text-muted-foreground">
          {dict.adhanSettings.defaultVoiceSelect}
        </h3>

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3">
          <select
            value={settings.adhanVoice}
            onChange={(e) => setDefaultVoice(e.target.value)}
            aria-label={dict.adhanSettings.defaultVoiceSelect}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
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
            aria-label={playingId === defaultVoice.id ? dict.adhanSettings.stop : dict.adhanSettings.play}
            className={`flex size-10 shrink-0 items-center justify-center rounded-full transition ${
              playingId === defaultVoice.id
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400'
            }`}
          >
            {playingId === defaultVoice.id ? <Square className="size-4" /> : <Play className="size-4" />}
          </button>
        </div>

        {/* ✅ صوت الفجر الافتراضي (منفصل) - بدون مفتاح ترجمة جديد */}
        <h3 className="mb-2 mt-4 text-sm font-bold text-muted-foreground">
          صوت الفجر الافتراضي
        </h3>

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3">
          <select
            value={settings.fajrVoice}
            onChange={(e) => setFajrDefaultVoice(e.target.value)}
            aria-label="صوت الفجر الافتراضي"
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
          >
            {ADHAN_VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => preview(fajrDefaultVoice.id)}
            aria-label={playingId === fajrDefaultVoice.id ? dict.adhanSettings.stop : dict.adhanSettings.play}
            className={`flex size-10 shrink-0 items-center justify-center rounded-full transition ${
              playingId === fajrDefaultVoice.id
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400'
            }`}
          >
            {playingId === fajrDefaultVoice.id ? <Square className="size-4" /> : <Play className="size-4" />}
          </button>
        </div>
      </section>
    </div>
  )
}