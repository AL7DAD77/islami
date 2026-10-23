'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Play, X } from 'lucide-react'
import { getLastPlayed, clearLastPlayed, type LastPlayed } from '@/lib/last-played'
import { useQuranPlayer } from '@/lib/quran-player'

export function LastPlayedCard() {
  const [last, setLast] = useState<LastPlayed | null>(null)
  const player = useQuranPlayer()
  const router = useRouter()

  useEffect(() => {
    setLast(getLastPlayed())
  }, [])

  if (!last) return null

  const handleClear = () => {
    clearLastPlayed()
    setLast(null)
  }

  const handlePlay = (e: React.MouseEvent) => {
    if (player.playing && player.surah === last.surah) return
    e.preventDefault()

    let server = 'https://server8.mp3quran.net/afs/'
    let reciterName = 'مشاري العفاسي'
    try {
      server = localStorage.getItem('selected_reciter_server') || server;
      reciterName = localStorage.getItem('selected_reciter_name') || reciterName;
    } catch (e) {}

    const defaultReciter = { id: 1, name: reciterName, featured: true, moshaf: [{ id: 1, name: 'حفص', server, surahs: [] }] }

    player.play(last.surah, last.surahName, player.reciter || defaultReciter, player.moshafServer || server)
    router.push(`/quran/${last.surah}`)
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-primary p-3 text-primary-foreground shadow-sm">
      <Link 
        href={`/quran/${last.surah}`} 
        onClick={handlePlay}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
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