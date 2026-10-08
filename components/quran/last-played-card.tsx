'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Play, X } from 'lucide-react'
import { getLastPlayed, clearLastPlayed, type LastPlayed } from '@/lib/last-played'

export function LastPlayedCard() {
  const [last, setLast] = useState<LastPlayed | null>(null)

  useEffect(() => {
    setLast(getLastPlayed())
  }, [])

  if (!last) return null

  const handleClear = () => {
    clearLastPlayed()
    setLast(null)
  }

  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-700 p-4 text-white shadow-md">
      <Link
        href={`/quran/${last.surah}`}
        className="flex flex-1 items-center gap-3"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Play className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block text-xs opacity-80">{'أكمل من حيث توقفت'}</span>
          <span className="block font-bold">سورة {last.surahName}</span>
        </span>
      </Link>
      <button
        type="button"
        onClick={handleClear}
        aria-label="مسح"
        className="flex size-8 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}