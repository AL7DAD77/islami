'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight, Bookmark, Play, Pause, Headphones } from 'lucide-react'
import { saveReadingPosition, useBookmarkState, toggleBookmark, isBookmarked } from '@/lib/bookmarks'
import { toArabicNumber } from '@/lib/quran'
import { useQuranPlayer } from '@/lib/quran-player'

interface MetaData {
  surahNames: string[]
  surahStartPage: number[]
}

export function MushafViewer({ initialSurah }: { initialSurah: number }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pageParam = Number(searchParams.get('page'))
  const initialPage = pageParam > 0 ? pageParam : undefined

  const [currentPage, setCurrentPage] = useState<number>(initialPage || 1)
  const [metaData, setMetaData] = useState<MetaData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  
  // حالة إظهار/إخفاء الأزرار
  const [showControls, setShowControls] = useState(true)
  
  // حالات التكبير والتحريك
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  // مراجع لتتبع اللمس
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const initialPinchDist = useRef<number | null>(null)
  
  const bookmarkState = useBookmarkState()
  const player = useQuranPlayer()

  // إخفاء شريط التنقل السفلي
  useEffect(() => {
    document.body.classList.add('reading-fullscreen')
    return () => {
      document.body.classList.remove('reading-fullscreen')
    }
  }, [])

  // تصفير التكبير عند تغيير الصفحة
  useEffect(() => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }, [currentPage])

  const handlePrev = () => { if (currentPage > 1) setCurrentPage(currentPage - 1) }
  const handleNext = () => { if (currentPage < 604) setCurrentPage(currentPage + 1) }

  // ================= إدارة اللمس (سحب + تكبير) =================
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // بدء التكبير
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      initialPinchDist.current = dist
    } else if (e.touches.length === 1) {
      // بدء السحب أو التحريك
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDist.current) {
      // تنفيذ التكبير
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const newScale = Math.max(1, Math.min(dist / initialPinchDist.current, 3)) // التكبير من 1x إلى 3x
      setScale(newScale)
      if (newScale === 1) setPan({ x: 0, y: 0 })
    } else if (e.touches.length === 1 && scale > 1) {
      // تحريك الصورة المكبرة (Pan)
      if (touchStartX.current !== null && touchStartY.current !== null) {
        const dx = e.touches[0].clientX - touchStartX.current
        const dy = e.touches[0].clientY - touchStartY.current
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }))
        touchStartX.current = e.touches[0].clientX
        touchStartY.current = e.touches[0].clientY
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      if (scale === 1 && touchStartX.current !== null) {
        // السحب الأفقي (فقط عندما تكون الصورة غير مكبرة)
        const distance = touchStartX.current - e.changedTouches[0].clientX
        if (Math.abs(distance) > 50) {
          if (distance > 0) handlePrev()
          else handleNext()
        } else {
          // لمسة خفيفة: إظهار/إخفاء الأزرار
          setShowControls(prev => !prev)
        }
      }
      // تصفير المراجع
      initialPinchDist.current = null
      touchStartX.current = null
      touchStartY.current = null
    }
  }

  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch('/mushaf/meta.json')
        const meta = await res.json()
        setMetaData(meta)
        if (!initialPage) {
          const startPage = meta.surahStartPage[initialSurah - 1] || 1
          setCurrentPage(startPage)
        }
      } catch (error) {
        console.error("خطأ في جلب meta", error)
      } finally {
        setLoading(false)
      }
    }
    loadMeta()
  }, [initialSurah, initialPage])

  useEffect(() => {
    if (currentPage && metaData) {
      saveReadingPosition(initialSurah, metaData.surahNames[initialSurah - 1] || '', currentPage)
    }
  }, [currentPage, metaData, initialSurah])

  const handlePlayToggle = () => {
    if (player.playing && player.surah === initialSurah) {
      player.toggle()
    } else {
      let server = 'https://server8.mp3quran.net/afs/';
      let reciterName = 'مشاري العفاسي';
      try {
        server = localStorage.getItem('selected_reciter_server') || server;
        reciterName = localStorage.getItem('selected_reciter_name') || reciterName;
      } catch (e) {}

      const defaultReciter = { id: 1, name: reciterName, featured: true, moshaf: [{ id: 1, name: 'حفص', server, surahs: [] }] };
      
      player.play(
        initialSurah, 
        metaData?.surahNames[initialSurah - 1] || '', 
        player.reciter || defaultReciter, 
        player.moshafServer || server
      )
    }
  }

  if (loading || !metaData) return <div className="h-screen flex items-center justify-center font-sans text-xl">جاري تحميل المصحف...</div>

  const pageNumberPadded = String(currentPage).padStart(3, '0')
  const surahName = metaData.surahNames[initialSurah - 1] || ''
  const isMarked = isBookmarked(bookmarkState, initialSurah, currentPage)
  const isCurrentSurahPlaying = player.playing && player.surah === initialSurah

  return (
    <div 
      className="h-[100dvh] w-full bg-[#fdfbf7] relative overflow-hidden select-none" 
      dir="rtl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => { if (scale === 1) setShowControls(prev => !prev) }}
    >
      
      {/* ============ الشريط العلوي ============ */}
      <div 
        className={`absolute top-0 left-0 right-0 z-50 flex justify-between items-start p-3 bg-gradient-to-b from-[#fdfbf7] via-[#fdfbf7]/80 to-transparent transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
      >
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md rounded-full px-2 py-1 shadow-sm border border-[#e8dccb]">
          <button onClick={(e) => { e.stopPropagation(); router.back(); }} className="p-1.5 text-[#5a3e1b]">
            <ChevronRight className="size-5" />
          </button>
          <span className="font-bold text-[#5a3e1b] text-sm pr-2 pl-1">{surahName}</span>
        </div>
        
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-full px-2 py-1 shadow-sm border border-[#e8dccb]">
          <button onClick={(e) => { e.stopPropagation(); router.push('/quran/reciters'); }} className="flex items-center gap-1 text-[#5a3e1b] text-[12px] font-bold px-2">
             <Headphones className="size-4" />
             <span>القارئ</span>
          </button>
          
          <button onClick={(e) => { e.stopPropagation(); handlePlayToggle(); }} className="p-1.5 bg-[#0a1f1a] rounded-full text-[#fdfbf7] shadow-sm">
             {isCurrentSurahPlaying ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4" fill="currentColor" />}
          </button>

          <button onClick={(e) => { e.stopPropagation(); toggleBookmark(initialSurah, surahName, currentPage); }} className={`p-1.5 ${isMarked ? 'text-[#d4af37]' : 'text-[#5a3e1b]'}`}>
            <Bookmark className="size-5" fill={isMarked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* ============ منطقة الصورة (تدعم التكبير والتحريك) ============ */}
      <div className="w-full h-full relative overflow-hidden bg-white" style={{ touchAction: 'none' }}>
        <img 
          key={currentPage}
          src={`/mushaf/pages/${pageNumberPadded}.webp`} 
          alt={`صفحة ${currentPage}`}
          className="w-full h-full object-cover pointer-events-none transition-transform duration-75 origin-center"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
          draggable={false}
        />
      </div>

      {/* ============ رقم الصفحة ============ */}
      <div 
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0a1f1a]/80 text-white text-xs font-bold px-5 py-2 rounded-full backdrop-blur-md transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        صفحة {toArabicNumber(currentPage)}
      </div>

    </div>
  )
}