'use client'

import Link from 'next/link'
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Play, X } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { SurahPlayer } from '@/components/quran/surah-player'
import { SurahReader } from '@/components/quran/surah-reader'
import { getReciters, getSurah, toArabicNumber, type Ayah, type SurahMeta, type Reciter } from '@/lib/quran'

export default function SurahPage() {
  const params = useParams()
  const searchParams = useSearchParams() // <--- جديد: لقراءة الرابط
  const n = Number(params.id)
  const router = useRouter()
  
  // قراءة رقم الآية من الرابط (إن وجد)
  const initialAyahParam = searchParams.get('ayah')

  const [meta, setMeta] = useState<SurahMeta | null>(null)
  const [ayahs, setAyahs] = useState<Ayah[]>([])
  const [reciters, setReciters] = useState<Reciter[]>([])
  const [loading, setLoading] = useState(true)
  
  // حالة لإظهار وإخفاء المشغل
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  
  // حالة لحفظ رقم الآية التي يتم تشغيلها حالياً
  const [currentAyah, setCurrentAyah] = useState<number | null>(null)

  // ============ Swipe Navigation ============
  useEffect(() => {
    let startX = 0
    let startY = 0
    let startTime = 0

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0]
      startX = t.clientX
      startY = t.clientY
      startTime = Date.now()
    }

    const onEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      const deltaX = t.clientX - startX
      const deltaY = t.clientY - startY
      const duration = Date.now() - startTime

      if (duration > 500) return
      if (Math.abs(deltaX) < 80) return
      if (Math.abs(deltaY) > Math.abs(deltaX) / 2) return

      if (deltaX > 0 && n > 1) {
        router.push(`/quran/${n - 1}`)
      } else if (deltaX < 0 && n < 114) {
        router.push(`/quran/${n + 1}`)
      }
    }

    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchend', onEnd)
    }
  }, [n, router])

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
    <div className="pb-28 relative">
      <PageHeader
        title={meta.name}
        subtitle={`${meta.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} · ${toArabicNumber(meta.numberOfAyahs)} آية${ayahs[0] ? ` · الجزء ${toArabicNumber(ayahs[0].juz)}` : ''}`}
        backHref="/quran"
      />
      
      {/* نمرر currentAyah و initialAyah هنا */}
      <SurahReader 
        surah={n} 
        surahName={meta.name} 
        ayahs={ayahs} 
        currentAyah={currentAyah} 
        initialAyah={initialAyahParam ? Number(initialAyahParam) : null}
      />
      
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

      {/* ====== الزر العائم (Floating Action Button) ====== */}
      <button
        onClick={() => setIsPlayerOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105 active:scale-95"
        aria-label="فتح مشغل الصوت"
      >
        <Play className="size-6 ml-1" />
      </button>

      {/* ====== نافذة المشغل المنبثقة ====== */}
      {isPlayerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 pb-6 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-card p-2 shadow-2xl border border-border">
            <button 
              onClick={() => setIsPlayerOpen(false)}
              className="absolute -top-12 right-0 flex size-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md"
            >
              <X className="size-5" />
            </button>
            
            {/* نمرر onAyahChange و totalAyahs هنا */}
            <SurahPlayer 
              surah={n} 
              surahName={meta.name} 
              reciters={reciters} 
              onAyahChange={setCurrentAyah} 
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