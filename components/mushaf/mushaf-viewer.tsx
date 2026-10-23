'use client'

import { useEffect, useState } from 'react'
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
  
  const bookmarkState = useBookmarkState()
  const player = useQuranPlayer()

  const handlePrev = () => { if (currentPage > 1) setCurrentPage(currentPage - 1) }
  const handleNext = () => { if (currentPage < 604) setCurrentPage(currentPage + 1) }

  // التنقل بالماوس
  const [mouseStartX, setMouseStartX] = useState<number | null>(null)
  const handleMouseDown = (e: React.MouseEvent) => setMouseStartX(e.clientX)
  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStartX === null) return
    const distance = mouseStartX - e.clientX
    if (distance > 50) handleNext()
    else if (distance < -50) handlePrev()
    setMouseStartX(null)
  }

  // التنقل باللمس
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.targetTouches[0].clientX)
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const distance = touchStartX - e.changedTouches[0].clientX
    if (distance > 50) handleNext()
    else if (distance < -50) handlePrev()
    setTouchStartX(null)
  }

  // التنقل بالأسهم
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleNext()
      if (e.key === 'ArrowRight') handlePrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage])

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
    <div className="h-[100dvh] w-full bg-[#f4ece1] flex flex-col overflow-hidden select-none" dir="rtl">
      
      {/* الشريط العلوي المحدث: يحتوي على اسم السورة والأزرار فقط */}
      <div className="w-full flex justify-between items-center p-2 bg-[#fdfbf7] border-b border-[#b89965] shrink-0 z-20">
        
        {/* اليمين: رجوع واسم السورة */}
        <div className="flex items-center gap-1">
          <button onClick={() => router.back()} className="p-2 bg-[#f4ece1] rounded-full text-[#5a3e1b] hover:bg-[#e8dccb]">
            <ChevronRight className="size-5" />
          </button>
          <span className="font-bold text-[#5a3e1b] text-sm md:text-base mr-1">{surahName}</span>
        </div>
        
        {/* الوسط: أزرار الصوت */}
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/quran/reciters')} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f4ece1] rounded-full text-[#5a3e1b] hover:bg-[#e8dccb] text-[11px] font-bold transition-colors">
             <Headphones className="size-4" />
             <span>القارئ</span>
          </button>
          
          <button onClick={handlePlayToggle} className="p-2 bg-[#0a1f1a] rounded-full text-[#fdfbf7] shadow-md hover:bg-[#0a1f1a]/90 transition-colors">
             {isCurrentSurahPlaying ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4" fill="currentColor" />}
          </button>
        </div>

        {/* اليسار: الحفظ */}
        <button 
          onClick={() => toggleBookmark(initialSurah, surahName, currentPage)}
          className={`p-2 rounded-full transition-colors ${isMarked ? 'bg-[#d4af37] text-white' : 'bg-[#f4ece1] text-[#5a3e1b]'}`}
        >
          <Bookmark className="size-5" fill={isMarked ? "currentColor" : "none"} />
        </button>
      </div>

      {/* منطقة عرض الصورة - تملأ كل الشاشة المتبقية */}
      <div 
        className="w-full flex-grow relative bg-white flex flex-col overflow-y-auto cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <img 
          key={currentPage}
          src={`/mushaf/pages/${pageNumberPadded}.webp`} 
          alt={`صفحة ${currentPage}`}
          className="w-full h-auto animate-in fade-in duration-300 pointer-events-none"
          draggable={false}
        />
      </div>

    </div>
  )
}