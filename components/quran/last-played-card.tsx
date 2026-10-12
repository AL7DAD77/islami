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
    <div className="flex items-center gap-3 rounded-2xl bg-primary p-3 text-primary-foreground shadow-sm">
      <Link href={`/quran/${last.surah}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 text-gold">
          <Play className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] opacity-80">{'أكمل الاستماع من حيث توقفت'}</span>
          <span className="block truncate font-bold">سورة {last.surahName}</span>
        </span>
      </Link>
      <button
        type="button"
        onClick={handleClear}
        aria-label="إخفاء"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
