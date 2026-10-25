'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import {
  Bookmark,
  ChevronRight,
  Headphones,
  Loader2,
  Moon,
  Pause,
  Play,
  Sun,
} from 'lucide-react'

import {
  isBookmarked,
  saveReadingPosition,
  toggleBookmark,
  useBookmarkState,
} from '@/lib/bookmarks'

import { toArabicNumber } from '@/lib/quran'
import { useQuranPlayer } from '@/lib/quran-player'

/* ============================== الأنواع ============================== */

interface MushafMetaData {
  surahNames: string[]
  surahStartPage: number[]
}

interface Point {
  x: number
  y: number
}

interface PinchState {
  distance: number
  scale: number
}

interface MushafTheme {
  background: string
  surface: string
  border: string
  text: string
  accent: string
  primary: string
  primaryText: string
}

/* ============================== الثوابت ============================== */

const TOTAL_PAGES = 604
const MIN_SCALE = 1
const MAX_SCALE = 4
const DOUBLE_TAP_SCALE = 2
const SWIPE_THRESHOLD = 45

const META_URL = '/mushaf/meta.json'
const PAGES_URL = '/mushaf/pages'

const NIGHT_MODE_KEY = 'mushaf-night-mode'
const RECITER_SERVER_KEY = 'selected_reciter_server'
const RECITER_NAME_KEY = 'selected_reciter_name'

const DEFAULT_RECITER_SERVER =
  'https://server8.mp3quran.net/afs/'

const DEFAULT_RECITER_NAME = 'مشاري العفاسي'

/* ============================ دوال مساعدة ============================ */

function getPageSource(page: number): string {
  const paddedPage = String(page).padStart(3, '0')

  return `${PAGES_URL}/${paddedPage}.webp`
}

function clampPage(page: number): number {
  return Math.min(Math.max(page, 1), TOTAL_PAGES)
}

function vibrateDevice(duration = 10): void {
  try {
    if (
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator
    ) {
      navigator.vibrate(duration)
    }
  } catch {
    // الجهاز قد لا يدعم الاهتزاز
  }
}

/* ============================== المكوّن ============================== */

export function MushafViewer({
  initialSurah,
}: {
  initialSurah: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const pageParam = Number(searchParams.get('page'))
  const initialPage = pageParam > 0 ? pageParam : undefined

  const [currentPage, setCurrentPage] = useState<number>(
    initialPage || 1,
  )

  const [metaData, setMetaData] =
    useState<MushafMetaData | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isNightMode, setIsNightMode] = useState(false)

  const [scale, setScale] = useState(MIN_SCALE)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })

  const containerRef = useRef<HTMLDivElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const pointerStartRef = useRef<Point | null>(null)
  const pinchStartRef = useRef<PinchState | null>(null)

  const bookmarkState = useBookmarkState()
  const player = useQuranPlayer()

  // ✅ تم نقل تعريف surahName إلى هنا ليكون متاحاً للدوال التي تليه
  const surahName = useMemo(
    () => metaData?.surahNames[initialSurah - 1] || '',
    [initialSurah, metaData]
  )

  /* ------------------------- الوضع الليلي ------------------------- */

  useEffect(() => {
    const savedMode = localStorage.getItem(NIGHT_MODE_KEY)
    if (savedMode === 'true') {
      setIsNightMode(true)
    }
  }, [])

  /* ------------------------- وضع القراءة ------------------------- */

  useEffect(() => {
    document.body.classList.add('reading-fullscreen')
    return () => {
      document.body.classList.remove('reading-fullscreen')
    }
  }, [])

  /* --------------------------- بيانات المصحف --------------------------- */

  useEffect(() => {
    let isActive = true

    const loadMetaData = async () => {
      try {
        const response = await fetch(META_URL)
        if (!response.ok) {
          throw new Error(
            `تعذر تحميل بيانات المصحف: ${response.status}`,
          )
        }
        const data: MushafMetaData = await response.json()

        if (!isActive) return

        setMetaData(data)

        if (!initialPage) {
          const startPage =
            data.surahStartPage[initialSurah - 1] || 1
          setCurrentPage(clampPage(startPage))
        }
      } catch (error) {
        console.error('خطأ في تحميل بيانات المصحف:', error)
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadMetaData()

    return () => {
      isActive = false
    }
  }, [initialPage, initialSurah])

  /* ---------------------- إعادة الضبط عند تغيير الصفحة ---------------------- */

  useEffect(() => {
    setScale(MIN_SCALE)
    setPan({ x: 0, y: 0 })
    setIsPageLoading(true)
    setHasError(false)
  }, [currentPage])

  /* --------------------------- تحميل مسبق --------------------------- */

  useEffect(() => {
    const previousPage = currentPage - 1
    const nextPage = currentPage + 1
    const preloadedImages: HTMLImageElement[] = []

    if (previousPage >= 1) {
      const image = new Image()
      image.src = getPageSource(previousPage)
      preloadedImages.push(image)
    }

    if (nextPage <= TOTAL_PAGES) {
      const image = new Image()
      image.src = getPageSource(nextPage)
      preloadedImages.push(image)
    }

    return () => {
      preloadedImages.forEach(image => {
        image.src = ''
      })
    }
  }, [currentPage])

  /* --------------------------- حفظ الموضع --------------------------- */

  useEffect(() => {
    if (!currentPage || !metaData) return

    saveReadingPosition(initialSurah, surahName, currentPage)
  }, [currentPage, initialSurah, metaData, surahName])

  /* ------------------------------ التنقل ------------------------------ */

  const handlePreviousPage = useCallback(() => {
    setCurrentPage(previousPage => {
      if (previousPage <= 1) return previousPage
      vibrateDevice(12)
      return previousPage - 1
    })
  }, [])

  const handleNextPage = useCallback(() => {
    setCurrentPage(previousPage => {
      if (previousPage >= TOTAL_PAGES) return previousPage
      vibrateDevice(12)
      return previousPage + 1
    })
  }, [])

  /* ------------------------- التكبير والتحريك ------------------------- */

  const clampPan = useCallback(
    (nextPan: Point, nextScale: number): Point => {
      const container = containerRef.current
      const image = imageRef.current

      if (!container || !image || nextScale <= MIN_SCALE) {
        return { x: 0, y: 0 }
      }

      const containerRect = container.getBoundingClientRect()
      const imageRect = image.getBoundingClientRect()

      const overflowX = Math.max(0, imageRect.width * nextScale - containerRect.width) / 2
      const overflowY = Math.max(0, imageRect.height * nextScale - containerRect.height) / 2

      return {
        x: Math.min(Math.max(nextPan.x, -overflowX), overflowX),
        y: Math.min(Math.max(nextPan.y, -overflowY), overflowY),
      }
    },
    [],
  )

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (event.touches.length === 2) {
        const firstTouch = event.touches[0]
        const secondTouch = event.touches[1]

        pinchStartRef.current = {
          distance: Math.hypot(
            firstTouch.clientX - secondTouch.clientX,
            firstTouch.clientY - secondTouch.clientY,
          ),
          scale,
        }

        pointerStartRef.current = null
        return
      }

      if (event.touches.length === 1) {
        pointerStartRef.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        }
      }
    },
    [scale],
  )

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (event.touches.length === 2 && pinchStartRef.current) {
        const firstTouch = event.touches[0]
        const secondTouch = event.touches[1]

        const currentDistance = Math.hypot(
          firstTouch.clientX - secondTouch.clientX,
          firstTouch.clientY - secondTouch.clientY,
        )

        const distanceRatio = currentDistance / pinchStartRef.current.distance
        const nextScale = Math.min(
          Math.max(pinchStartRef.current.scale * distanceRatio, MIN_SCALE),
          MAX_SCALE,
        )

        setScale(nextScale)
        setPan(previousPan => clampPan(previousPan, nextScale))
        return
      }

      if (event.touches.length === 1 && scale > MIN_SCALE && pointerStartRef.current) {
        const touch = event.touches[0]
        const deltaX = touch.clientX - pointerStartRef.current.x
        const deltaY = touch.clientY - pointerStartRef.current.y

        pointerStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
        }

        setPan(previousPan =>
          clampPan(
            {
              x: previousPan.x + deltaX,
              y: previousPan.y + deltaY,
            },
            scale,
          ),
        )
      }
    },
    [clampPan, scale],
  )

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (event.touches.length > 0) return

      if (scale === MIN_SCALE && pointerStartRef.current) {
        const startX = pointerStartRef.current.x
        const endX = event.changedTouches[0].clientX
        const swipeDistance = startX - endX

        if (Math.abs(swipeDistance) > SWIPE_THRESHOLD) {
          if (swipeDistance > 0) handlePreviousPage()
          else handleNextPage()
        }
      }

      pointerStartRef.current = null
      pinchStartRef.current = null
    },
    [handleNextPage, handlePreviousPage, scale],
  )

  const handleDoubleClick = useCallback(() => {
    vibrateDevice(15)
    if (scale > MIN_SCALE) {
      setScale(MIN_SCALE)
      setPan({ x: 0, y: 0 })
      return
    }
    setScale(DOUBLE_TAP_SCALE)
    setPan({ x: 0, y: 0 })
  }, [scale])

  /* ------------------------------ التلاوة ------------------------------ */

  const handlePlayToggle = useCallback(() => {
    if (player.playing && player.surah === initialSurah) {
      vibrateDevice(10)
      player.toggle()
      return
    }

    vibrateDevice(10)
    let server = DEFAULT_RECITER_SERVER
    let reciterName = DEFAULT_RECITER_NAME

    try {
      server = localStorage.getItem(RECITER_SERVER_KEY) || server
      reciterName = localStorage.getItem(RECITER_NAME_KEY) || reciterName
    } catch {}

    const defaultReciter = {
      id: 1,
      name: reciterName,
      featured: true,
      moshaf: [{ id: 1, name: 'حفص', server, surahs: [] }],
    }

    player.play(
      initialSurah,
      surahName, // ✅ استخدام المتغير المعرّف بالأعلى
      player.reciter || defaultReciter,
      player.moshafServer || server,
    )
  }, [initialSurah, surahName, player])

  /* ----------------------------- العلامة المرجعية ----------------------------- */

  const handleBookmark = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      vibrateDevice(18)
      toggleBookmark(initialSurah, surahName, currentPage)
    },
    [currentPage, initialSurah, surahName],
  )

  const handleRetry = useCallback(() => {
    setHasError(false)
    setIsPageLoading(true)
  }, [])

  const handleNightModeToggle = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      vibrateDevice(10)

      setIsNightMode(previousMode => {
        const nextMode = !previousMode
        localStorage.setItem(NIGHT_MODE_KEY, String(nextMode))
        return nextMode
      })
    },
    [],
  )

  /* ------------------------------ قيم مشتقة ------------------------------ */

  const pageSource = useMemo(() => getPageSource(currentPage), [currentPage])
  
  const isBookmarkedPage = isBookmarked(bookmarkState, initialSurah, currentPage)
  const isCurrentSurahPlaying = player.playing && player.surah === initialSurah

  const theme: MushafTheme = isNightMode
    ? {
        background: '#101010',
        surface: 'rgba(24, 24, 27, 0.88)',
        border: 'rgba(63, 63, 70, 0.7)',
        text: '#e4e4e7',
        accent: '#d4af37',
        primary: '#d4af37',
        primaryText: '#101010',
      }
    : {
        background: '#fdfbf7',
        surface: 'rgba(255, 255, 255, 0.88)',
        border: '#e8dccb',
        text: '#5a3e1b',
        accent: '#d4af37',
        primary: '#0a1f1a',
        primaryText: '#fdfbf7',
      }

  /* ------------------------------ شاشة التحميل ------------------------------ */

  if (isLoading || !metaData) {
    return (
      // ✅ تعديل h-[100dvh] إلى h-dvh
      <div dir="rtl" className="flex h-dvh w-full items-center justify-center bg-[#fdfbf7]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-7 animate-spin text-[#5a3e1b]" />
          <p className="text-lg font-semibold text-[#5a3e1b]">جاري تحميل المصحف...</p>
        </div>
      </div>
    )
  }

  /* ------------------------------ الواجهة ------------------------------ */

  return (
    <div
      dir="rtl"
      // ✅ تعديل h-[100dvh] إلى h-dvh
      className="relative h-dvh w-full select-none overflow-hidden"
      style={{ backgroundColor: theme.background, touchAction: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* منطقة المصحف: تملأ الشاشة بالكامل */}
      <div ref={containerRef} className="absolute inset-0 flex items-center justify-center overflow-hidden">
        {isPageLoading && !hasError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <Loader2 className="size-7 animate-spin" style={{ color: theme.text }} />
          </div>
        )}

        {hasError ? (
          <div className="flex flex-col items-center gap-4 px-8 text-center">
            <p className="text-lg font-semibold" style={{ color: theme.text }}>تعذر تحميل صفحة المصحف</p>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-full px-6 py-2 text-sm font-bold transition-opacity active:opacity-70"
              style={{ backgroundColor: theme.primary, color: theme.primaryText }}
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <img
            key={currentPage}
            ref={imageRef}
            src={pageSource}
            alt={`صفحة ${toArabicNumber(currentPage)}`}
            draggable={false}
            decoding="async"
            loading="eager"
            onLoad={() => setIsPageLoading(false)}
            onError={() => { setIsPageLoading(false); setHasError(true) }}
            onDoubleClick={handleDoubleClick}
            className="pointer-events-none block h-full w-full object-contain"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
              transformOrigin: 'center center',
              transition: scale === MIN_SCALE ? 'transform 180ms ease-out' : 'transform 60ms linear',
              filter: isNightMode ? 'invert(0.94) hue-rotate(180deg) brightness(1.08) contrast(1.08)' : 'none',
            }}
          />
        )}
      </div>

      {/* الشريط العلوي العائم */}
      <header
        className="absolute inset-x-0 top-0 z-50 flex items-start justify-between gap-3 p-3"
        style={{
          paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
          background: isNightMode
            ? 'linear-gradient(to bottom, rgba(16,16,16,0.90), rgba(16,16,16,0))'
            : 'linear-gradient(to bottom, rgba(253,251,247,0.92), rgba(253,251,247,0))',
        }}
      >
        <div className="flex items-center gap-1 rounded-full border px-2 py-1 shadow-sm backdrop-blur-md" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
          <button type="button" onClick={() => router.back()} className="rounded-full p-1.5 transition-opacity active:opacity-60" style={{ color: theme.text }} aria-label="رجوع">
            <ChevronRight className="size-5" />
          </button>
          <span className="pl-1 pr-2 text-sm font-bold" style={{ color: theme.text }}>{surahName}</span>
        </div>

        <div className="flex items-center gap-1 rounded-full border px-2 py-1 shadow-sm backdrop-blur-md" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
          <button type="button" onClick={handleNightModeToggle} className="rounded-full p-1.5 transition-opacity active:opacity-60" style={{ color: theme.accent }} aria-label={isNightMode ? 'الوضع النهاري' : 'الوضع الليلي'}>
            {isNightMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
          <button type="button" onClick={() => router.push('/quran/reciters')} className="flex items-center gap-1 rounded-full px-2 py-1.5 text-[12px] font-bold transition-opacity active:opacity-60" style={{ color: theme.text }}>
            <Headphones className="size-4" />
            <span>القارئ</span>
          </button>
          <button type="button" onClick={handlePlayToggle} className="rounded-full p-2 shadow-sm transition-opacity active:opacity-70" style={{ backgroundColor: theme.primary, color: theme.primaryText }} aria-label={isCurrentSurahPlaying ? 'إيقاف التلاوة' : 'تشغيل التلاوة'}>
            {isCurrentSurahPlaying ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4" fill="currentColor" />}
          </button>
          <button type="button" onClick={handleBookmark} className="rounded-full p-1.5 transition-opacity active:opacity-60" style={{ color: isBookmarkedPage ? theme.accent : theme.text }} aria-label="إضافة علامة مرجعية">
            <Bookmark className="size-5" fill={isBookmarkedPage ? 'currentColor' : 'none'} />
          </button>
        </div>
      </header>

      {/* رقم الصفحة العائم */}
      <footer
        className="absolute inset-x-0 bottom-0 z-50 flex justify-center pb-3 pt-6"
        style={{
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          background: isNightMode
            ? 'linear-gradient(to top, rgba(16,16,16,0.90), rgba(16,16,16,0))'
            : 'linear-gradient(to top, rgba(253,251,247,0.92), rgba(253,251,247,0))',
        }}
      >
        <div
          className="rounded-full px-5 py-2 text-xs font-bold shadow-sm"
          style={{
            backgroundColor: isNightMode ? 'rgba(212, 175, 55, 0.92)' : 'rgba(10, 31, 26, 0.82)',
            color: isNightMode ? '#101010' : '#ffffff',
          }}
        >
          صفحة {toArabicNumber(currentPage)}
        </div>
      </footer>
    </div>
  )
}