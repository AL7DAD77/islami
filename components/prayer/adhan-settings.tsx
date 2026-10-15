'use client'

import { useState } from 'react'
import { Volume2, Check, Play, Square } from 'lucide-react'
import { useSettings, type PrayerKey } from '@/lib/settings'
import { ADHAN_VOICES, getAdhanVoice, voiceIdFor } from '@/lib/adhan-list'
import { PRAYER_NAMES, PRAYER_ORDER } from '@/lib/prayer'

// ⚠️ صوت معاينة واحد فقط في كل الصفحة (يبقى عبر تغيير الصفحات)
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

  const setPlaying = (id: string | null) => setPlayingId(id)

  const preview = (id: string) => {
    const voice = getAdhanVoice(id)
    if (!voice) return
    // نفس الصوت يعمل ثم يتوقف عند الضغط عليه مجدداً
    if (previewId === id) {
      stopPreview()
      setPlaying(null)
      return
    }
    stopPreview()
    const audio = new Audio(`/audio/adhans/${voice.file}`)
    audio.volume = 0.5
    audio.onended = () => {
      previewAudio = null
      previewId = null
      setPlaying(null)
    }
    audio
      .play()
      .then(() => {
        previewAudio = audio
        previewId = id
        setPlaying(id)
      })
      .catch(() => {
        // الملف غير موجود (مثل تنبيه التكبيرتين قبل وضعه) أو تعذّر التشغيل
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
        <div className="mb-3 rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-700 p-4 text-white shadow-md">
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
