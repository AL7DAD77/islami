'use client'

import Link from 'next/link'
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Play, X } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { SurahPlayer } from '@/components/quran/surah-player'
import { SurahReader } from '@/components/quran/surah-reader'
import { getReciters, getSurah, toArabicNumber, type Ayah, type SurahMeta, type Reciter } from '@/lib/quran'
import { useQuranPlayer } from '@/lib/quran-player'
import { useSettings } from '@/lib/settings'
import { estimateAyah } from '@/lib/ayah-sync'
import { useHorizontalSwipe } from '@/lib/use-swipe'

export default function SurahPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const n = Number(params.id)
  const router = useRouter()
  
  const initialAyahParam = searchParams.get('ayah')

  const [meta, setMeta] = useState<SurahMeta | null>(null)
  const [ayahs, setAyahs] = useState<Ayah[]>([])
  const [reciters, setReciters] = useState<Reciter[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)

  // ============ تظليل الآية الجارية ============
  // يُحسب مباشرة من مشغّل القرآن العام، فيعمل حتى بعد إغلاق نافذة المشغّل
  // (سابقاً كان يتجمد عند إغلاقها، ويُحسب خطياً بغض النظر عن طول الآيات).
  const player = useQuranPlayer()
  const [settings] = useSettings()
  const activeHere = player.surah === n && (player.playing || player.progress > 0)
  const currentAyah = useMemo(
    () => (activeHere && settings.ayahHighlight && ayahs.length ? estimateAyah(ayahs, n, player.progress / 100) : null),
    [activeHere, settings.ayahHighlight, ayahs, n, player.progress],
  )

  // ============ سحب للانتقال بين السور (وضع التمرير فقط؛ في وضع الصفحات السحب لتقليب الصفحات) ============
  useHorizontalSwipe({
    enabled: settings.quranView !== 'pages' || ayahs.length === 0,
    minDistance: 120,
    onSwipe: (dir) => {
      if (dir === 'right' && n > 1) router.push(`/quran/${n - 1}`)
      else if (dir === 'left' && n < 114) router.push(`/quran/${n + 1}`)
    },
  })

  // ============ Load Surah ============
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
    <div 
      className="w-full min-h-screen pb-44 overscroll-contain touch-pan-y"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <PageHeader
        title={meta.name}
        subtitle={`${meta.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} · ${toArabicNumber(meta.numberOfAyahs)} آية${ayahs[0] ? ` · الجزء ${toArabicNumber(ayahs[0].juz)}` : ''}`}
        backHref="/quran"
      />
      
      <SurahReader 
        surah={n} 
        surahName={meta.name} 
        ayahs={ayahs} 
        currentAyah={currentAyah} 
        initialAyah={initialAyahParam ? Number(initialAyahParam) : null}
      />
      
      <nav className="mt-6 flex items-center justify-between gap-3 px-2 pb-12" aria-label="التنقل بين السور">
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

      {/* ====== الزر العائم ====== */}
      <button
        onClick={() => setIsPlayerOpen(true)}
        className="fixed bottom-20 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform hover:scale-105 active:scale-95"
        aria-label="فتح مشغل الصوت"
      >
        <Play className="size-6 ml-1" />
      </button>

      {/* ====== نافذة المشغل المنبثقة ====== */}
      {isPlayerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 pb-20 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-card p-2 shadow-2xl border border-border">
            <button 
              onClick={() => setIsPlayerOpen(false)}
              className="absolute -top-12 right-0 flex size-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md"
            >
              <X className="size-5" />
            </button>
            
            <SurahPlayer 
              surah={n} 
              surahName={meta.name} 
              reciters={reciters} 
              totalAyahs={ayahs.length}
            />
          </div>
        </div>
      )}

    </div>
  )
}

// ============ دوال Cache ============
const SURAH_CACHE_PREFIX = 'quran-surah-'
const RECITERS_CACHE_KEY = 'quran-reciters'

async function getSurahCached(id: number) {
  const cached = localStorage.getItem(`${SURAH_CACHE_PREFIX}${id}`)
  if (cached) {
    try { return JSON.parse(cached) } catch {}
  }
  const data = await getSurah(id)
  try { localStorage.setItem(`${SURAH_CACHE_PREFIX}${id}`, JSON.stringify(data)) } catch { console.warn('Storage full') }
  return data
}

async function getRecitersCached() {
  const cached = localStorage.getItem(RECITERS_CACHE_KEY)
  if (cached) {
    try { return JSON.parse(cached) as Reciter[] } catch {}
  }
  const data = await getReciters()
  try { localStorage.setItem(RECITERS_CACHE_KEY, JSON.stringify(data)) } catch {}
  return data
}