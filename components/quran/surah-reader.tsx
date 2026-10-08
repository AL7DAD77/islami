'use client'

import { useEffect } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { Ayah } from '@/lib/quran'
import { stripBasmala, toArabicNumber } from '@/lib/quran'
import { useHydrated, useSettings } from '@/lib/settings'

export function SurahReader({ surah, surahName, ayahs }: { surah: number; surahName: string; ayahs: Ayah[] }) {
  const [settings, update] = useSettings()
  const hydrated = useHydrated()
  const fontSize = hydrated ? settings.quranFontSize : 30

  useEffect(() => {
    update({ lastRead: { surah, name: surahName } })
  }, [surah, surahName, update])

  return (
    <article className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border sm:p-8">
      <div className="mb-4 flex items-center justify-end gap-2">
        <span className="text-xs text-muted-foreground">{'حجم الخط'}</span>
        <button
          type="button"
          onClick={() => update((s) => ({ quranFontSize: Math.max(20, s.quranFontSize - 2) }))}
          className="flex size-8 items-center justify-center rounded-full bg-muted"
          aria-label="تصغير الخط"
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => update((s) => ({ quranFontSize: Math.min(48, s.quranFontSize + 2) }))}
          className="flex size-8 items-center justify-center rounded-full bg-muted"
          aria-label="تكبير الخط"
        >
          <Plus className="size-4" />
        </button>
      </div>
      {surah !== 1 && surah !== 9 && (
        <p className="mb-6 text-center font-quran text-3xl text-primary">{'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'}</p>
      )}
      <p className="text-justify font-quran leading-[2.3]" style={{ fontSize }}>
        {ayahs.map((a) => (
          <span key={a.number}>
            {stripBasmala(a.text.replace('\ufeff', ''), surah, a.numberInSurah)}
            <span className="ayah-marker mx-1 whitespace-nowrap" aria-label={`آية ${a.numberInSurah}`}>
              {`﴿${toArabicNumber(a.numberInSurah)}﴾`}
            </span>{' '}
          </span>
        ))}
      </p>
    </article>
  )
}
