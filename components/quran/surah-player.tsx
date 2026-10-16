'use client';

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Loader2, Pause, Play, Repeat, UserRound } from 'lucide-react'
import type { Reciter } from '@/lib/quran'
import { useSettings } from '@/lib/settings'
import { useQuranPlayer } from '@/lib/quran-player'
import { cn } from '@/lib/utils'

export function SurahPlayer({
  surah,
  surahName,
  reciters,
  onAyahChange,
  totalAyahs,
}: {
  surah: number
  surahName: string
  reciters: Reciter[]
  onAyahChange?: (ayah: number | null) => void
  totalAyahs: number
}) {
  const [settings, update] = useSettings()
  const player = useQuranPlayer()
  
  const lastAyahRef = useRef<number | null>(null)

  const reciter =
    reciters.find((r) => r.id === settings.reciterId) ??
    reciters.find((r) => r.id === 123) ??
    reciters[0]

  const moshaf =
    reciter?.moshaf.find((m) => m.server === settings.reciterServer && m.surahs.includes(surah)) ??
    reciter?.moshaf.find((m) => m.surahs.includes(surah))

  const isCurrent = player.surah === surah
  const state = isCurrent
    ? player.loading
      ? 'loading'
      : player.playing
        ? 'playing'
        : 'paused'
    : 'idle'

  useEffect(() => {
    if (isCurrent && player.progress > 0 && onAyahChange) {
      const estimatedAyah = Math.round((player.progress / 100) * totalAyahs)
      const safeAyah = Math.min(Math.max(estimatedAyah, 1), totalAyahs)

      if (safeAyah !== lastAyahRef.current) {
        lastAyahRef.current = safeAyah
        onAyahChange(safeAyah)
      }
    } else if (!isCurrent && onAyahChange) {
      lastAyahRef.current = null
      onAyahChange(null)
    }
  }, [isCurrent, player.progress, totalAyahs, onAyahChange])

  useEffect(() => {
    const handler = () => {
      player.stop()
    }
    window.addEventListener('adhan-started', handler)
    return () => window.removeEventListener('adhan-started', handler)
  }, [player])

  const toggle = () => {
    // تم إزالة window.alert لتجنب تعليق التطبيق
    if (isCurrent) {
      player.toggle()
    } else if (reciter && moshaf) {
      player.play(surah, surahName, reciter, moshaf.server)
    }
  }

  const featured = reciters.filter((r) => r.featured)

  return (
    <div className="w-full">
      <div className="rounded-2xl bg-primary p-3 text-primary-foreground shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            disabled={!moshaf}
            aria-label={state === 'playing' ? 'إيقاف مؤقت' : 'تشغيل التلاوة'}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold text-foreground disabled:opacity-50"
          >
            {state === 'loading' ? (
              <Loader2 className="size-5 animate-spin" />
            ) : state === 'playing' ? (
              <Pause className="size-5" />
            ) : (
              <Play className="size-5" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <label htmlFor="reciter-select" className="sr-only">
              اختر القارئ
            </label>
            <select
              id="reciter-select"
              value={reciter?.id}
              onChange={(e) => {
                const r = reciters.find((x) => x.id === Number(e.target.value))
                if (r) {
                  update({ reciterId: r.id, reciterServer: r.moshaf[0]?.server ?? null })
                  if (isCurrent) {
                    const m = r.moshaf.find((mm) => mm.surahs.includes(surah)) ?? r.moshaf[0]
                    if (m) player.changeReciter(r, m.server)
                  }
                }
              }}
              className="w-full truncate rounded-lg bg-primary-foreground/10 px-2 py-1 text-sm font-medium focus:outline-none"
            >
              {featured.map((r) => (
                <option key={r.id} value={r.id} className="text-foreground">
                  {r.name}
                </option>
              ))}
              {reciter && !reciter.featured && (
                <option value={reciter.id} className="text-foreground">
                  {reciter.name}
                </option>
              )}
            </select>
            {reciter && reciter.moshaf.length > 1 ? (
              <select
                aria-label="اختر الرواية"
                value={moshaf?.server}
                onChange={(e) => {
                  update({ reciterId: reciter.id, reciterServer: e.target.value })
                  if (isCurrent) player.changeReciter(reciter, e.target.value)
                }}
                className="mt-1 w-full truncate rounded-lg bg-transparent px-2 text-xs opacity-80 focus:outline-none"
              >
                {reciter.moshaf.map((m) => (
                  <option key={m.id} value={m.server} className="text-foreground" disabled={!m.surahs.includes(surah)}>
                    {m.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-1 px-2 text-xs opacity-80">
                {moshaf?.name ?? 'هذه السورة غير متوفرة لهذا القارئ'}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => player.setRepeat(!player.repeat)}
            aria-pressed={player.repeat}
            aria-label="تكرار السورة"
            className={cn(
              'flex size-9 items-center justify-center rounded-full',
              player.repeat ? 'bg-gold text-foreground' : 'bg-primary-foreground/10',
            )}
          >
            <Repeat className="size-4" />
          </button>
          <Link
            href="/quran/reciters"
            aria-label="كل القراء"
            className="flex size-9 items-center justify-center rounded-full bg-primary-foreground/10"
          >
            <UserRound className="size-4" />
          </Link>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-primary-foreground/15" aria-hidden="true">
          <div
            className="h-full bg-gold transition-[width]"
            style={{ width: `${isCurrent ? player.progress : 0}%` }}
          />
        </div>
      </div>
    </div>
  )
}