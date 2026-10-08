'use client'

import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { SurahPlayer } from '@/components/quran/surah-player'
import { SurahReader } from '@/components/quran/surah-reader'
import { getReciters, getSurah, toArabicNumber, type Ayah, type SurahMeta, type Reciter } from '@/lib/quran'

export default function SurahPage() {
  const params = useParams()
  const n = Number(params.id)

  const [meta, setMeta] = useState<SurahMeta | null>(null)
  const [ayahs, setAyahs] = useState<Ayah[]>([])
  const [reciters, setReciters] = useState<Reciter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!Number.isInteger(n) || n < 1 || n > 114) {
      notFound()
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [surahData, recitersData] = await Promise.all([
          getSurahCached(n),
          getRecitersCached(),
        ])
        if (!cancelled) {
          setMeta(surahData.meta)
          setAyahs(surahData.ayahs)
          setReciters(recitersData)
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [n])

  if (loading || !meta) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="pb-28">
      <PageHeader
        title={meta.name}
        subtitle={`${meta.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} · ${toArabicNumber(meta.numberOfAyahs)} آية${ayahs[0] ? ` · الجزء ${toArabicNumber(ayahs[0].juz)}` : ''}`}
        backHref="/quran"
      />
      <SurahReader surah={n} surahName={meta.name} ayahs={ayahs} />
      <nav className="mt-4 flex items-center justify-between gap-3" aria-label="التنقل بين السور">
        {n > 1 ? (
          <Link href={`/quran/${n - 1}`} className="flex items-center gap-1 rounded-full bg-card px-4 py-2 text-sm shadow-sm ring-1 ring-border">
            <ChevronRight className="size-4" aria-hidden="true" />
            {'السورة السابقة'}
          </Link>
        ) : (
          <span />
        )}
        {n < 114 && (
          <Link href={`/quran/${n + 1}`} className="flex items-center gap-1 rounded-full bg-card px-4 py-2 text-sm shadow-sm ring-1 ring-border">
            {'السورة التالية'}
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Link>
        )}
      </nav>
      <SurahPlayer surah={n} surahName={meta.name} reciters={reciters} />
    </div>
  )
}

// ============ دوال Cache ============
const SURAH_CACHE_PREFIX = 'quran-surah-'
const RECITERS_CACHE_KEY = 'quran-reciters'

async function getSurahCached(id: number) {
  // 1. من localStorage
  const cached = localStorage.getItem(`${SURAH_CACHE_PREFIX}${id}`)
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch {}
  }

  // 2. من API
  const data = await getSurah(id)
  try {
    localStorage.setItem(`${SURAH_CACHE_PREFIX}${id}`, JSON.stringify(data))
  } catch {
    // localStorage full — احذف الأقدم
    console.warn('Storage full')
  }
  return data
}

async function getRecitersCached() {
  // 1. من localStorage
  const cached = localStorage.getItem(RECITERS_CACHE_KEY)
  if (cached) {
    try {
      return JSON.parse(cached) as Reciter[]
    } catch {}
  }

  // 2. من API
  const data = await getReciters()
  try {
    localStorage.setItem(RECITERS_CACHE_KEY, JSON.stringify(data))
  } catch {}
  return data
}