'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight, Bookmark, Play, Pause, Headphones, Moon, Sun } from 'lucide-react'
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
  
  // ✅ تم حذف حالة showControls لأن الأزرار ستكون ثابتة
  const [nightMode, setNightMode] = useState(false)

  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const initialPinchDist = useRef<number | null>(null)
  
  const bookmarkState = useBookmarkState()
  const player = useQuranPlayer()

  const vibrate = (ms: number = 10) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms)
      }
    } catch (e) {}
  }

  useEffect(() => {
    const savedMode = localStorage.getItem('mushaf-night-mode')
    if (savedMode === 'true') setNightMode(true)
  }, [])

  const toggleNightMode = (e: React.MouseEvent) => {
    e.stopPropagation()
    vibrate(10)
    setNightMode(prev => {
      const newMode = !prev
      localStorage.setItem('mushaf-night-mode', String(newMode))
      return newMode
    })
  }

  useEffect(() => {
    document.body.classList.add('reading-fullscreen')
    return () => {
      document.body.classList.remove('reading-fullscreen')
    }
  }, [])

  useEffect(() => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }, [currentPage])

  const handlePrev = () => { 
    if (currentPage > 1) {
      vibrate(15)
      setCurrentPage(currentPage - 1) 
    }
  }
  
  const handleNext = () => { 
    if (currentPage < 604) {
      vibrate(15)
      setCurrentPage(currentPage + 1) 
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      initialPinchDist.current = dist
    } else if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDist.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const newScale = Math.max(1, Math.min(dist / initialPinchDist.current, 3))
      setScale(newScale)
      if (newScale === 1) setPan({ x: 0, y: 0 })
    } else if (e.touches.length === 1 && scale > 1) {
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
        const distance = touchStartX.current - e.changedTouches[0].clientX
        if (Math.abs(distance) > 50) {
          if (distance > 0) handlePrev()
          else handleNext()
        }
      }
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
      vibrate(10)
      player.toggle()
    } else {
      vibrate(10)
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

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    vibrate(20)
    toggleBookmark(initialSurah, surahName, currentPage)
  }

  if (loading || !metaData) return <div className="h-screen flex items-center justify-center font-sans text-xl">جاري تحميل المصحف...</div>

  const pageNumberPadded = String(currentPage).padStart(3, '0')
  const surahName = metaData.surahNames[initialSurah - 1] || ''
  const isMarked = isBookmarked(bookmarkState, initialSurah, currentPage)
  const isCurrentSurahPlaying = player.playing && player.surah === initialSurah

  const bgColor = nightMode ? 'bg-[#1a1a1a]' : 'bg-[#fdfbf7]'

  return (
    <div 
      className={`h-[100dvh] w-full ${bgColor} relative overflow-hidden select-none transition-colors duration-300 flex flex-col`} 
      dir="rtl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* ✅ الشريط العلوي: ثابت دائماً في الأعلى ولا يختفي */}
      <div 
        className={`w-full flex justify-between items-start p-3 shrink-0 z-50`}
        style={{ background: nightMode ? '#1a1a1a' : '#fdfbf7' }}
      >
        <div className={`flex items-center gap-1 backdrop-blur-md rounded-full px-2 py-1 shadow-sm border ${nightMode ? 'bg-zinc-800/90 border-zinc-700' : 'bg-white/90 border-[#e8dccb]'}`}>
          <button onClick={() => router.back()} className={`p-1.5 ${nightMode ? 'text-zinc-300' : 'text-[#5a3e1b]'}`}>
            <ChevronRight className="size-5" />
          </button>
          <span className={`font-bold text-sm pr-2 pl-1 ${nightMode ? 'text-zinc-300' : 'text-[#5a3e1b]'}`}>{surahName}</span>
        </div>
        
        <div className={`flex items-center gap-2 backdrop-blur-md rounded-full px-2 py-1 shadow-sm border ${nightMode ? 'bg-zinc-800/90 border-zinc-700' : 'bg-white/90 border-[#e8dccb]'}`}>
          <button onClick={toggleNightMode} className={`p-1.5 ${nightMode ? 'text-[#d4af37]' : 'text-[#5a3e1b]'}`} title="الوضع الليلي">
            {nightMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>

          <button onClick={() => router.push('/quran/reciters')} className={`flex items-center gap-1 text-[12px] font-bold px-2 ${nightMode ? 'text-zinc-300' : 'text-[#5a3e1b]'}`}>
             <Headphones className="size-4" />
             <span>القارئ</span>
          </button>
          
          <button onClick={handlePlayToggle} className={`p-1.5 rounded-full shadow-sm ${nightMode ? 'bg-[#d4af37] text-[#1a1a1a]' : 'bg-[#0a1f1a] text-[#fdfbf7]'}`}>
             {isCurrentSurahPlaying ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4" fill="currentColor" />}
          </button>

          <button onClick={handleBookmark} className={`p-1.5 ${isMarked ? 'text-[#d4af37]' : (nightMode ? 'text-zinc-300' : 'text-[#5a3e1b]')}`}>
            <Bookmark className="size-5" fill={isMarked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* منطقة الصورة (تأخذ المساحة المتبقية) */}
      <div className={`flex-1 w-full relative overflow-hidden ${bgColor}`} style={{ touchAction: 'none' }}>
        <img 
          key={currentPage}
          src={`/mushaf/pages/${pageNumberPadded}.webp`} 
          alt={`صفحة ${currentPage}`}
          className={`w-full h-full object-contain pointer-events-none transition-transform duration-75 origin-center`}
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            filter: nightMode ? 'invert(0.95) hue-rotate(180deg) brightness(1.2) contrast(1.2)' : 'none' 
          }}
          draggable={false}
        />
      </div>

      {/* ✅ رقم الصفحة: ثابت دائماً في الأسفل */}
      <div 
        className={`w-full flex justify-center py-2 shrink-0 z-50`}
        style={{ background: nightMode ? '#1a1a1a' : '#fdfbf7' }}
      >
        <div className={`text-xs font-bold px-5 py-2 rounded-full ${nightMode ? 'bg-[#d4af37]/90 text-[#1a1a1a]' : 'bg-[#0a1f1a]/80 text-white'}`}>
          صفحة {toArabicNumber(currentPage)}
        </div>
      </div>

    </div>
  )
}