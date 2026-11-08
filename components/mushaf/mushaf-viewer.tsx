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
  ChevronLeft,
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
import { useSettings } from '@/lib/settings'
import { SURAH_INFO } from '@/lib/quran-info'

// ================= أنواع البيانات =================

interface MushafMetaData {
  surahNames: string[]
  surahStartPage: number[]
  juzStartPage: number[]
}

interface Word {
  code: number
  char: string
  font: string
  text: string
  type:
    | 'word'
    | 'end'
    | 'surah_header'
    | 'bismillah'
    | 'quarter'
  sura?: number
  verse_key?: string
  position?: number | null
}

interface Line {
  line: number
  words: Word[]
}

interface PageData {
  page: number
  font: string
  surahs: {
    id: number
    name: string
    name_arabic: string
    verse_start: number
    verse_end: number
  }[]
  lines: Line[]
}

interface QuarterIndexItem {
  quarter: number
  page: number
  verseKey: string
}

interface Point {
  x: number
  y: number
}

interface PinchState {
  distance: number
  scale: number
}

const TOTAL_PAGES = 604
const MIN_SCALE = 1
const MAX_SCALE = 4
const DOUBLE_TAP_SCALE = 2
const SWIPE_THRESHOLD = 45

const REFERENCE_FONT_SIZE = 100
// 🛡️ حاجز أمان بنسبة 2% لمنع التصاق النص بالحواف
const FIT_PADDING = 0.98

// ارتفاع كل سطر نصي = حجم الخط × هذه النسبة.
// زد القيمة لتباعد الأسطر أكثر (يحمي التنوين من التداخل مع السطر الأعلى).
// جرّب: 1.4 أو 1.5 أو 1.6
const LINE_HEIGHT_RATIO = 1.45

const TEXT_THIN_STROKE = 0.3
const HEADER_THIN_STROKE = 0

const META_URL = '/mushaf/meta.json'
const PAGES_URL = '/mushaf-qcf4/pages'
const QUARTER_INDEX_URL = '/mushaf/quarter-index.json'

const NIGHT_MODE_KEY = 'mushaf-night-mode'
const RECITER_SERVER_KEY = 'selected_reciter_server'
const RECITER_NAME_KEY = 'selected_reciter_name'

const DEFAULT_RECITER_SERVER =
  'https://server8.mp3quran.net/afs/'

const DEFAULT_RECITER_NAME = 'مشاري العفاسي'

function clampPage(page: number): number {
  return Math.min(Math.max(page, 1), TOTAL_PAGES)
}

function isHeaderLine(line: Line): boolean {
  return (
    line.words.length === 1 &&
    line.words[0].type === 'surah_header'
  )
}

function isBismillahLine(line: Line): boolean {
  return (
    line.words.length === 1 &&
    line.words[0].type === 'bismillah'
  )
}

function fontOf(word: Word): string {
  if (
    word.type === 'surah_header' ||
    word.type === 'bismillah'
  ) {
    return 'QCF4_QBSML'
  }

  return word.font
}

function glyphOf(word: Word): string {
  if (word.char) {
    return word.char
  }

  return String.fromCodePoint(word.code)
}

function Qcf4Fonts() {
  useEffect(() => {
    const styleId = 'qcf4-fonts-style'

    if (document.getElementById(styleId)) {
      return
    }

    const fontNames = [
      ...Array.from(
        { length: 47 },
        (_, index) =>
          `QCF4_Hafs_${String(index + 1).padStart(2, '0')}`,
      ),
      'QCF4_QBSML',
    ]

    const css = fontNames
      .map((name) => {
        const fontFile =
          name === 'QCF4_QBSML'
            ? 'QCF4_QBSML'
            : `${name}_W`

        return `
@font-face {
  font-family: '${name}';
  src: url('/fonts/qcf4/${fontFile}.woff2') format('woff2');
  font-display: block;
  font-weight: normal;
  font-style: normal;
}
        `
      })
      .join('\n')

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = css

    document.head.appendChild(style)
  }, [])

  return null
}

export function MushafViewer({
  initialSurah,
}: {
  initialSurah: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [settings] = useSettings()
  const vibrationEnabled = settings.vibrationEnabled

  const pageParam = Number(searchParams.get('page'))
  const initialPage =
    pageParam > 0 ? pageParam : undefined

  const [currentPage, setCurrentPage] = useState<number>(
    initialPage || 1,
  )

  const [metaData, setMetaData] =
    useState<MushafMetaData | null>(null)

  const [pageData, setPageData] =
    useState<PageData | null>(null)

  const [quarterIndex, setQuarterIndex] = useState<
    QuarterIndexItem[]
  >([])

  const [isLoading, setIsLoading] = useState(true)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isNightMode, setIsNightMode] = useState(false)

  const [pageScale, setPageScale] = useState(1)
  const [isPageMeasured, setIsPageMeasured] = useState(false)

  const [showUi, setShowUi] = useState(true)
  const [pageInfoToast, setPageInfoToast] = useState<
    string | null
  >(null)

  const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pageInfoTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [userScale, setUserScale] = useState(MIN_SCALE)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })

  const containerRef = useRef<HTMLDivElement | null>(null)
  const pageWrapperRef = useRef<HTMLDivElement | null>(null)
  const pageContentRef = useRef<HTMLDivElement | null>(null)

  const pointerStartRef = useRef<Point | null>(null)
  const pinchStartRef = useRef<PinchState | null>(null)

  const vibrationEnabledRef = useRef(vibrationEnabled)

  useEffect(() => {
    vibrationEnabledRef.current = vibrationEnabled
  }, [vibrationEnabled])

  const vibrateDevice = useCallback(
    (duration = 10): void => {
      if (!vibrationEnabledRef.current) return

      try {
        if (
          typeof navigator !== 'undefined' &&
          'vibrate' in navigator
        ) {
          navigator.vibrate(duration)
        }
      } catch {
        // تجاهل أخطاء الاهتزاز
      }
    },
    [],
  )

  const bookmarkState = useBookmarkState()
  const player = useQuranPlayer()

  const currentSurahIndex = useMemo(() => {
    if (!metaData?.surahStartPage) return 0

    let index = 0

    for (
      let i = 0;
      i < metaData.surahStartPage.length;
      i++
    ) {
      if (currentPage >= metaData.surahStartPage[i]) {
        index = i
      } else {
        break
      }
    }

    return index
  }, [currentPage, metaData])

  const surahName = useMemo(() => {
    return metaData?.surahNames[currentSurahIndex] || ''
  }, [currentSurahIndex, metaData])

  const currentSurahInfo = SURAH_INFO[currentSurahIndex]

  const currentJuzNumber = useMemo(() => {
    if (!metaData?.juzStartPage) return 1

    let juzIndex = 0

    for (
      let i = 0;
      i < metaData.juzStartPage.length;
      i++
    ) {
      if (currentPage >= metaData.juzStartPage[i]) {
        juzIndex = i
      } else {
        break
      }
    }

    return juzIndex + 1
  }, [currentPage, metaData])

  const currentQuarter = useMemo(() => {
    if (quarterIndex.length === 0) return null

    let result: QuarterIndexItem | null = null

    for (const item of quarterIndex) {
      if (item.page <= currentPage) {
        result = item
      } else {
        break
      }
    }

    return result
  }, [currentPage, quarterIndex])

  // تحميل meta.json
  useEffect(() => {
    let isActive = true

    const loadData = async () => {
      try {
        const response = await fetch(META_URL)

        if (!response.ok) {
          throw new Error('فشل تحميل meta.json')
        }

        const meta: MushafMetaData =
          await response.json()

        if (!isActive) return

        setMetaData(meta)

        if (!initialPage) {
          const startPage =
            meta.surahStartPage[initialSurah - 1] || 1

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

    loadData()

    return () => {
      isActive = false
    }
  }, [initialPage, initialSurah])

  // تحميل فهرس أرباع الأحزاب
  useEffect(() => {
    let isActive = true

    const loadQuarterIndex = async () => {
      try {
        const response = await fetch(QUARTER_INDEX_URL)

        if (!response.ok) {
          throw new Error('فشل تحميل فهرس أرباع الأحزاب')
        }

        const data: QuarterIndexItem[] =
          await response.json()

        if (isActive) {
          setQuarterIndex(data)
        }
      } catch (error) {
        console.error(
          'خطأ في تحميل فهرس أرباع الأحزاب:',
          error,
        )
      }
    }

    loadQuarterIndex()

    return () => {
      isActive = false
    }
  }, [])

  // تحميل صفحة المصحف
  useEffect(() => {
    let isActive = true

    setIsPageLoading(true)
    setHasError(false)
    setIsPageMeasured(false)
    setPageScale(1)

    const paddedPage = String(currentPage).padStart(3, '0')

    fetch(`${PAGES_URL}/${paddedPage}.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('فشل تحميل صفحة المصحف')
        }

        return response.json()
      })
      .then((json: PageData) => {
        if (!isActive) return

        setPageData(json)
        setIsPageLoading(false)
      })
      .catch((error) => {
        console.error('خطأ في تحميل صفحة QCF4:', error)

        if (!isActive) return

        setHasError(true)
        setIsPageLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [currentPage])

  // انتظار تحميل الخطوط قبل القياس
  useEffect(() => {
    if (!pageData) return

    let isActive = true

    const loadFonts = async () => {
      const fontNames = Array.from(
        new Set([
          ...pageData.lines.flatMap((line) =>
            line.words.map((word) => fontOf(word)),
          ),
          'QCF4_QBSML',
        ]),
      ).filter(Boolean)

      try {
        await Promise.all(
          fontNames.map((fontName) =>
            document.fonts.load(
              `${REFERENCE_FONT_SIZE}px "${fontName}"`,
            ),
          ),
        )

        await document.fonts.ready
      } catch {
        // تجاهل أخطاء تحميل الخطوط
      }

      if (isActive) {
        setIsPageMeasured(true)
      }
    }

    loadFonts()

    return () => {
      isActive = false
    }
  }, [pageData])

  // قياس الصفحة الفعلي ثم تحجيمها لملء الشاشة
  useEffect(() => {
    if (!isPageMeasured) return
    if (!pageWrapperRef.current) return
    if (!pageContentRef.current) return

    const wrapper = pageWrapperRef.current
    const content = pageContentRef.current

    const measurePage = () => {
      const availableWidth = wrapper.clientWidth
      const availableHeight = wrapper.clientHeight

      const contentWidth = content.offsetWidth
      const contentHeight = content.offsetHeight

      if (
        availableWidth <= 0 ||
        availableHeight <= 0 ||
        contentWidth <= 0 ||
        contentHeight <= 0
      ) {
        return
      }

      const widthScale =
        (availableWidth * FIT_PADDING) / contentWidth

      const heightScale =
        (availableHeight * FIT_PADDING) / contentHeight

      // أصغر النسبتين: لا تُقص الحواف الجانبية أبداً،
      // والتحجيم موحد لكل الصفحة فلا تتحرك الكلمات أو التنوين
      const nextScale = Math.min(widthScale, heightScale)

      if (
        !Number.isFinite(nextScale) ||
        nextScale <= 0
      ) {
        return
      }

      setPageScale(nextScale)
    }

    const firstFrame = requestAnimationFrame(() => {
      measurePage()

      const secondFrame = requestAnimationFrame(() => {
        measurePage()
      })

      return () =>
        cancelAnimationFrame(secondFrame)
    })

    const observer = new ResizeObserver(() => {
      measurePage()
    })

    observer.observe(wrapper)
    observer.observe(content)

    return () => {
      cancelAnimationFrame(firstFrame)
      observer.disconnect()
    }
  }, [
    isPageMeasured,
    currentPage,
    pageData,
  ])

  // إخفاء واجهة التحكم تلقائياً
  const resetUiTimeout = useCallback(() => {
    if (uiTimeoutRef.current) {
      clearTimeout(uiTimeoutRef.current)
    }

    uiTimeoutRef.current = setTimeout(() => {
      setShowUi(false)
    }, 3000)
  }, [])

  useEffect(() => {
    resetUiTimeout()

    return () => {
      if (uiTimeoutRef.current) {
        clearTimeout(uiTimeoutRef.current)
      }
    }
  }, [resetUiTimeout])

  const handleToggleUi = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement

      if (target.closest('button, a, input')) {
        return
      }

      setShowUi((previous) => {
        const next = !previous

        if (next) {
          resetUiTimeout()
        }

        return next
      })
    },
    [resetUiTimeout],
  )

  // الوضع الليلي
  useEffect(() => {
    const savedMode = localStorage.getItem(NIGHT_MODE_KEY)

    if (savedMode === 'true') {
      setIsNightMode(true)
    }
  }, [])

  useEffect(() => {
    document.body.classList.add('reading-fullscreen')

    return () => {
      document.body.classList.remove('reading-fullscreen')
    }
  }, [])

  // إعادة ضبط التكبير عند تغيير الصفحة
  useEffect(() => {
    setUserScale(MIN_SCALE)
    setPan({ x: 0, y: 0 })
    setShowUi(true)
    resetUiTimeout()
  }, [currentPage, resetUiTimeout])

  // حفظ موضع القراءة
  useEffect(() => {
    if (!currentPage || !metaData) return

    saveReadingPosition(
      initialSurah,
      surahName,
      currentPage,
    )
  }, [currentPage, initialSurah, metaData, surahName])

  // إظهار معلومات الجزء والربع عند تغيير الصفحة
  useEffect(() => {
    if (!metaData) return

    const parts: string[] = []

    parts.push(`الجزء ${currentJuzNumber}`)

    if (currentQuarter) {
      parts.push(`ربع الحزب ${currentQuarter.quarter}`)
    }

    setPageInfoToast(parts.join(' • '))

    if (pageInfoTimeoutRef.current) {
      clearTimeout(pageInfoTimeoutRef.current)
    }

    pageInfoTimeoutRef.current = setTimeout(() => {
      setPageInfoToast(null)
    }, 1800)

    return () => {
      if (pageInfoTimeoutRef.current) {
        clearTimeout(pageInfoTimeoutRef.current)
      }
    }
  }, [
    currentPage,
    metaData,
    currentJuzNumber,
    currentQuarter,
  ])

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((previous) => {
      if (previous <= 1) {
        return previous
      }

      vibrateDevice(12)
      return previous - 1
    })
  }, [vibrateDevice])

  const handleNextPage = useCallback(() => {
    setCurrentPage((previous) => {
      if (previous >= TOTAL_PAGES) {
        return previous
      }

      vibrateDevice(12)
      return previous + 1
    })
  }, [vibrateDevice])

  const clampPan = useCallback(
    (nextPan: Point, nextScale: number): Point => {
      const container = containerRef.current

      if (!container || nextScale <= MIN_SCALE) {
        return { x: 0, y: 0 }
      }

      const rect = container.getBoundingClientRect()

      const overflowX =
        Math.max(
          0,
          rect.width * nextScale - rect.width,
        ) / 2

      const overflowY =
        Math.max(
          0,
          rect.height * nextScale - rect.height,
        ) / 2

      return {
        x: Math.min(
          Math.max(nextPan.x, -overflowX),
          overflowX,
        ),
        y: Math.min(
          Math.max(nextPan.y, -overflowY),
          overflowY,
        ),
      }
    },
    [],
  )

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (event.touches.length === 2) {
        pinchStartRef.current = {
          distance: Math.hypot(
            event.touches[0].clientX -
              event.touches[1].clientX,
            event.touches[0].clientY -
              event.touches[1].clientY,
          ),
          scale: userScale,
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
    [userScale],
  )

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (
        event.touches.length === 2 &&
        pinchStartRef.current
      ) {
        const currentDistance = Math.hypot(
          event.touches[0].clientX -
            event.touches[1].clientX,
          event.touches[0].clientY -
            event.touches[1].clientY,
        )

        const distanceRatio =
          currentDistance /
          pinchStartRef.current.distance

        const nextScale = Math.min(
          Math.max(
            pinchStartRef.current.scale *
              distanceRatio,
            MIN_SCALE,
          ),
          MAX_SCALE,
        )

        setUserScale(nextScale)

        setPan((previousPan) =>
          clampPan(previousPan, nextScale),
        )

        return
      }

      if (
        event.touches.length === 1 &&
        userScale > MIN_SCALE &&
        pointerStartRef.current
      ) {
        const deltaX =
          event.touches[0].clientX -
          pointerStartRef.current.x

        const deltaY =
          event.touches[0].clientY -
          pointerStartRef.current.y

        pointerStartRef.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        }

        setPan((previousPan) =>
          clampPan(
            {
              x: previousPan.x + deltaX,
              y: previousPan.y + deltaY,
            },
            userScale,
          ),
        )
      }
    },
    [clampPan, userScale],
  )

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (event.touches.length > 0) return

      if (
        userScale === MIN_SCALE &&
        pointerStartRef.current
      ) {
        const startX = pointerStartRef.current.x
        const endX =
          event.changedTouches[0].clientX

        const swipeDistance = startX - endX

        if (
          Math.abs(swipeDistance) >
          SWIPE_THRESHOLD
        ) {
          if (swipeDistance > 0) {
            handlePreviousPage()
          } else {
            handleNextPage()
          }
        }
      }

      pointerStartRef.current = null
      pinchStartRef.current = null
    },
    [
      handleNextPage,
      handlePreviousPage,
      userScale,
    ],
  )

  const handleDoubleClick = useCallback(() => {
    vibrateDevice(15)

    if (userScale > MIN_SCALE) {
      setUserScale(MIN_SCALE)
      setPan({ x: 0, y: 0 })
      return
    }

    setUserScale(DOUBLE_TAP_SCALE)
    setPan({ x: 0, y: 0 })
  }, [userScale, vibrateDevice])

  const handlePlayToggle = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      setShowUi(true)
      resetUiTimeout()

      if (
        player.playing &&
        player.surah === initialSurah
      ) {
        vibrateDevice(10)
        player.toggle()
        return
      }

      vibrateDevice(10)

      let server = DEFAULT_RECITER_SERVER
      let reciterName = DEFAULT_RECITER_NAME

      try {
        server =
          localStorage.getItem(RECITER_SERVER_KEY) ||
          server

        reciterName =
          localStorage.getItem(RECITER_NAME_KEY) ||
          reciterName
      } catch {
        // تجاهل أخطاء localStorage
      }

      const defaultReciter = {
        id: 1,
        name: reciterName,
        featured: true,
        moshaf: [
          {
            id: 1,
            name: 'حفص',
            server,
            surahs: [],
          },
        ],
      }

      player.play(
        initialSurah,
        surahName,
        player.reciter || defaultReciter,
        player.moshafServer || server,
      )
    },
    [
      initialSurah,
      surahName,
      player,
      resetUiTimeout,
      vibrateDevice,
    ],
  )

  const handleBookmark = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      setShowUi(true)
      resetUiTimeout()
      vibrateDevice(18)

      toggleBookmark(
        initialSurah,
        surahName,
        currentPage,
      )
    },
    [
      currentPage,
      initialSurah,
      surahName,
      resetUiTimeout,
      vibrateDevice,
    ],
  )

  const handleNightModeToggle = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      setShowUi(true)
      resetUiTimeout()
      vibrateDevice(10)

      setIsNightMode((previous) => {
        const next = !previous

        localStorage.setItem(
          NIGHT_MODE_KEY,
          String(next),
        )

        return next
      })
    },
    [resetUiTimeout, vibrateDevice],
  )

  const isBookmarkedPage = isBookmarked(
    bookmarkState,
    initialSurah,
    currentPage,
  )

  const isCurrentSurahPlaying =
    player.playing &&
    player.surah === initialSurah

  const surface = isNightMode
    ? 'rgba(24, 24, 27, 0.88)'
    : 'rgba(255, 255, 255, 0.88)'

 const bg = isNightMode ? '#101010' : '#fdfbf7'
const fg = isNightMode ? '#f4f4f5' : '#06140f'
  const border = isNightMode
    ? 'rgba(63, 63, 70, 0.7)'
    : '#e8dccb'

  const accent = '#d4af37'

  const primary = isNightMode
    ? '#d4af37'
    : '#0a1f1a'

  const primaryText = isNightMode
    ? '#101010'
    : '#fdfbf7'

  if (isLoading || !metaData) {
    return (
      <div
        dir="rtl"
        className="flex min-h-dvh w-full items-center justify-center"
        style={{ backgroundColor: bg }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="size-7 animate-spin"
            style={{ color: fg }}
          />

          <p
            className="text-lg font-semibold"
            style={{ color: fg }}
          >
            جاري تحميل المصحف...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      className="mushaf-root relative h-dvh w-full select-none overflow-hidden"
      style={{
        backgroundColor: bg,
        color: fg,
        touchAction: 'pan-x pan-y',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleToggleUi}
    >
      <Qcf4Fonts />

      {/* حاوية التكبير بالإصبع */}
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${userScale})`,
          transformOrigin: 'center center',
          transition:
            userScale === MIN_SCALE
              ? 'transform 180ms ease-out'
              : 'transform 60ms linear',
        }}
      >
        {(isPageLoading || !isPageMeasured) &&
          !hasError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <Loader2
                className="size-7 animate-spin"
                style={{ color: fg }}
              />
            </div>
          )}

        {hasError ? (
          <div className="flex flex-col items-center gap-4 px-8 text-center">
            <p
              className="text-lg font-semibold"
              style={{ color: fg }}
            >
              تعذر تحميل صفحة المصحف
            </p>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setCurrentPage((previous) => previous)
              }}
              className="pointer-events-auto rounded-full px-6 py-2 text-sm font-bold transition-opacity active:opacity-70"
              style={{
                backgroundColor: primary,
                color: primaryText,
              }}
            >
              إعادة المحاولة
            </button>
          </div>
        ) : pageData ? (
          // المساحة المتاحة للصفحة (بدون هوامش جانبية، والهوامش العلوية والسفلية للأجهزة فقط)
          <div
            ref={pageWrapperRef}
            className="relative flex h-full w-full items-center justify-center overflow-hidden"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              paddingLeft: '0px',
              paddingRight: '0px',
            }}
            onDoubleClick={handleDoubleClick}
          >
            {/* الصفحة بحجمها الطبيعي قبل التحجيم */}
            <div
              ref={pageContentRef}
              className="flex flex-col"
              style={{
                direction: 'rtl',
                width: 'max-content',
                transform: `scale(${pageScale})`,
                transformOrigin: 'center center',
                opacity: isPageMeasured ? 1 : 0,
                transition: 'opacity 120ms ease-out',
              }}
            >
              {pageData.lines.map((line, lineIndex) => {
                const isHeader = isHeaderLine(line)
                const isBismillah =
                  isBismillahLine(line)

                if (isHeader || isBismillah) {
                  return (
                    <div
                      key={lineIndex}
                      className="flex items-center justify-center"
                      style={{
                        width: '100%',
                        height:
                          REFERENCE_FONT_SIZE *
                          (isHeader ? 1.15 : 0.8),
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'QCF4_QBSML',
                          fontSize: `${REFERENCE_FONT_SIZE}px`,
                          lineHeight: 1,
                          whiteSpace: 'nowrap',
                          color: fg,
                          fontSynthesis: 'none',
                          WebkitTextStroke: `${HEADER_THIN_STROKE}px ${bg}`,
                        }}
                      >
                        {glyphOf(line.words[0])}
                      </span>
                    </div>
                  )
                }

                return (
                  <div
                    key={lineIndex}
                    className="flex items-center justify-between"
                    style={{
                      direction: 'rtl',
                      width: '100%',
                      height:
                        REFERENCE_FONT_SIZE *
                        LINE_HEIGHT_RATIO,
                      overflow: 'visible',
                    }}
                  >
                    {line.words.map(
                      (word, wordIndex) => {
                        // إخفاء علامة ربع الحزب من النص
                        if (
                          word.type === 'quarter'
                        ) {
                          return null
                        }

                        return (
                          <span
                            key={wordIndex}
                            style={{
                              fontFamily: fontOf(word),
                              fontSize: `${REFERENCE_FONT_SIZE}px`,
                              lineHeight: 1,
                              whiteSpace: 'nowrap',
                              color: fg,
                              fontSynthesis: 'none',
                              WebkitTextStroke: `${TEXT_THIN_STROKE}px ${bg}`,
                            }}
                            title={word.text}
                          >
                            {glyphOf(word)}
                          </span>
                        )
                      },
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* Toast معلومات الصفحة */}
      {pageInfoToast && (
        <div
          className="pointer-events-none absolute left-1/2 top-20 z-50 -translate-x-1/2 rounded-full border px-4 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md transition-opacity duration-300"
          style={{
            backgroundColor: surface,
            borderColor: border,
            color: fg,
          }}
        >
          {pageInfoToast}
        </div>
      )}

      {/* الشريط العلوي */}
      <header
        className={`absolute inset-x-0 top-0 z-50 flex items-start justify-between gap-3 p-3 transition-opacity duration-300 pointer-events-auto ${
          showUi
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}
        style={{
          paddingTop:
            'max(0.75rem, env(safe-area-inset-top))',
        }}
      >
        <div
          className="flex items-center gap-1 rounded-full border px-2 py-1 shadow-sm backdrop-blur-md"
          style={{
            backgroundColor: surface,
            borderColor: border,
          }}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              router.back()
            }}
            className="rounded-full p-1.5 transition-opacity active:opacity-60"
            style={{ color: fg }}
            aria-label="رجوع"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="flex flex-col leading-tight">
            <span
              className="pl-1 pr-2 text-sm font-bold"
              style={{ color: fg }}
            >
              {surahName}
            </span>

            {currentSurahInfo && (
              <span
                className="pl-1 pr-2 text-[10px] opacity-70"
                style={{ color: fg }}
              >
                {currentSurahInfo.place} •{' '}
                {currentSurahInfo.verses} آية
              </span>
            )}
          </div>
        </div>

        <div
          className="flex items-center gap-1 rounded-full border px-2 py-1 shadow-sm backdrop-blur-md"
          style={{
            backgroundColor: surface,
            borderColor: border,
          }}
        >
          <button
            type="button"
            onClick={handleNightModeToggle}
            className="rounded-full p-1.5 transition-opacity active:opacity-60"
            style={{ color: accent }}
            aria-label={
              isNightMode
                ? 'الوضع النهاري'
                : 'الوضع الليلي'
            }
          >
            {isNightMode ? (
              <Sun className="size-5" />
            ) : (
              <Moon className="size-5" />
            )}
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              router.push('/quran/reciters')
            }}
            className="flex items-center gap-1 rounded-full px-2 py-1.5 text-[12px] font-bold transition-opacity active:opacity-60"
            style={{ color: fg }}
          >
            <Headphones className="size-4" />
            <span>القارئ</span>
          </button>

          <button
            type="button"
            onClick={handlePlayToggle}
            className="rounded-full p-2 shadow-sm transition-opacity active:opacity-70"
            style={{
              backgroundColor: primary,
              color: primaryText,
            }}
            aria-label={
              isCurrentSurahPlaying
                ? 'إيقاف التلاوة'
                : 'تشغيل التلاوة'
            }
          >
            {isCurrentSurahPlaying ? (
              <Pause
                className="size-4"
                fill="currentColor"
              />
            ) : (
              <Play
                className="size-4"
                fill="currentColor"
              />
            )}
          </button>

          <button
            type="button"
            onClick={handleBookmark}
            className="rounded-full p-1.5 transition-opacity active:opacity-60"
            style={{
              color: isBookmarkedPage
                ? accent
                : fg,
            }}
            aria-label="إضافة علامة مرجعية"
          >
            <Bookmark
              className="size-5"
              fill={
                isBookmarkedPage
                  ? 'currentColor'
                  : 'none'
              }
            />
          </button>
        </div>
      </header>

      {/* الشريط السفلي */}
      <footer
        className={`absolute inset-x-0 bottom-4 z-50 flex items-center justify-between px-6 transition-opacity duration-300 pointer-events-auto ${
          showUi
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}
        style={{
          paddingBottom:
            'max(0.5rem, env(safe-area-inset-bottom))',
        }}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            handlePreviousPage()
          }}
          disabled={currentPage === 1}
          className="flex size-11 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-transform active:scale-90 disabled:opacity-30"
          style={{
            backgroundColor: surface,
            color: fg,
            borderColor: border,
          }}
        >
          <ChevronRight className="size-6" />
        </button>

        <div
          className="rounded-full border px-5 py-1.5 text-sm font-bold shadow-sm backdrop-blur-md"
          style={{
            backgroundColor: surface,
            borderColor: border,
            color: fg,
          }}
        >
          صفحة {toArabicNumber(currentPage)}
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            handleNextPage()
          }}
          disabled={currentPage === TOTAL_PAGES}
          className="flex size-11 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-transform active:scale-90 disabled:opacity-30"
          style={{
            backgroundColor: surface,
            color: fg,
            borderColor: border,
          }}
        >
          <ChevronLeft className="size-6" />
        </button>
      </footer>
    </div>
  )
}