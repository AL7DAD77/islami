'use client'

import { useState } from 'react'
import { Volume2, Check, Play } from 'lucide-react'
import { useSettings } from '@/lib/settings'
import { ADHAN_VOICES, getAdhanVoice } from '@/lib/adhan-list'

// ⚠️ Audio Singleton — يبقى عبر تغيير الصفحات
let previewAudio: HTMLAudioElement | null = null
let previewVoiceId: string | null = null

function stopPreview() {
  if (previewAudio) {
    previewAudio.pause()
    previewAudio.currentTime = 0
    previewAudio = null
  }
  previewVoiceId = null
}

export function AdhanSettings() {
  const [settings, update] = useSettings()
  const [playingId, setPlayingId] = useState<string | null>(previewVoiceId)

  const currentVoice = getAdhanVoice(settings.adhanVoice) || ADHAN_VOICES[0]

  const playPreview = (id: string, file: string) => {
    // ⚠️ 1. أوقف أي صوت سابق (حتى لو في الخلفية)
    stopPreview()

    // ⚠️ 2. إذا كان نفس الصوت → إيقاف فقط
    if (playingId === id) {
      setPlayingId(null)
      return
    }

    // ⚠️ 3. شغّل الجديد
    const audio = new Audio(`/audio/adhans/${file}`)
    audio.volume = 0.5
    audio.onended = () => {
      previewAudio = null
      previewVoiceId = null
      setPlayingId(null)
    }

    audio
      .play()
      .then(() => {
        previewAudio = audio
        previewVoiceId = id
        setPlayingId(id)
      })
      .catch(() => {
        previewAudio = null
        previewVoiceId = null
        setPlayingId(null)
      })
  }

  const selectVoice = (id: string) => {
    update({ adhanVoice: id })
    stopPreview()
    setPlayingId(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-700 p-5 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-white/20">
            <Volume2 className="size-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs opacity-80">{'صوت الأذان الحالي'}</p>
            <p className="text-lg font-bold">{currentVoice.name}</p>
            <p className="text-xs opacity-80">{currentVoice.reciter}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-muted-foreground">
          {'اختر صوت الأذان'}
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
                  onClick={() => selectVoice(voice.id)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800"
                  aria-label={selected ? 'مختار' : 'اختيار'}
                >
                  {selected ? (
                    <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <span className="size-3 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => selectVoice(voice.id)}
                  className="flex-1 text-right"
                >
                  <p className="font-bold text-zinc-800 dark:text-zinc-100">
                    {voice.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {voice.reciter}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => playPreview(voice.id, voice.file)}
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full transition ${
                    isPlaying
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400'
                  }`}
                  aria-label={isPlaying ? 'إيقاف' : 'تجربة'}
                >
                  {isPlaying ? (
                    <span className="flex gap-0.5">
                      <span className="h-3 w-0.5 bg-white" />
                      <span className="h-3 w-0.5 bg-white" />
                    </span>
                  ) : (
                    <Play className="size-4" />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}