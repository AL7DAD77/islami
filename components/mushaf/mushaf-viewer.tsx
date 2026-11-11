'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
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

import { cn } from '@/lib/utils'
import { useNumberFormat } from '@/lib/numbers'
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
const FIT_PADDING = 0.98
const SURAH_HEADER_RATIO = 0.72

const PRINT_GREEN = '#4f6b2e'
const PRINT_GOLD = '#b8924a'
const PRINT_CREAM = '#fbf6ea'

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

function renderLineContent(
  line: Line,
  size: number,
  color: string,
) {
  const isSingleGlyphLine =
    isHeaderLine(line) || isBismillahLine(line)

  const baseStyle = {
    fontSize: `${size}px`,
    lineHeight: 1,
    whiteSpace: 'nowrap' as const,
    color,
    fontSynthesis: 'none' as const,
  }

  if (isSingleGlyphLine) {
    const glyphSize = isHeaderLine(line)
      ? size * SURAH_HEADER_RATIO
      : size

    return (
      <span
        style={{
          ...baseStyle,
          fontSize: `${glyphSize}px`,
          fontFamily: 'QCF4_QBSML',
        }}
      >
        {glyphOf(line.words[0])}
      </span>
    )
  }

  return line.words.map((word, wordIndex) =>
    word.type === 'quarter' ? null : (
      <span
        key={wordIndex}
        title={word.text}
        style={{ ...baseStyle, fontFamily: fontOf(word) }}
      >
        {glyphOf(word)}
      </span>
    ),
  )
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
  const { formatValue } = useNumberFormat()
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

  const [fontPx, setFontPx] = useState(REFERENCE_FONT_SIZE)
  const [rowPx, setRowPx] = useState<number | undefined>(
    undefined,
  )
  const [isPageMeasured, setIsPageMeasured] = useState(false)

  const [showUi, setShowUi] = useState(true)

  const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [userScale, setUserScale] = useState(MIN_SCALE)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })

  const containerRef = useRef<HTMLDivElement | null>(null)
  const pageBoxRef = useRef<HTMLDivElement | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)

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
    setRowPx(undefined)

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

  // قياس بدون transform
  useLayoutEffect(() => {
    if (!isPageMeasured || !pageData) return

    const measure = () => {
      const box = pageBoxRef.current
      const ruler = measureRef.current

      if (!box || !ruler) return

      const availableWidth = box.clientWidth
      const availableHeight = box.clientHeight

      let widestLine = 0

      ruler
        .querySelectorAll<HTMLElement>('[data-row]')
        .forEach((row) => {
          widestLine = Math.max(widestLine, row.offsetWidth)
        })

      if (
        availableWidth <= 0 ||
        availableHeight <= 0 ||
        widestLine <= 0
      ) {
        return
      }

      const nextFont =
        (REFERENCE_FONT_SIZE *
          availableWidth *
          FIT_PADDING) /
        widestLine

      setFontPx(nextFont)
      setRowPx(availableHeight / pageData.lines.length)
    }

    measure()

    const observer = new ResizeObserver(measure)

    if (pageBoxRef.current) {
      observer.observe(pageBoxRef.current)
    }

    return () => observer.disconnect()
  }, [isPageMeasured, pageData])

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

  useEffect(() => {
    setUserScale(MIN_SCALE)
    setPan({ x: 0, y: 0 })
    setShowUi(true)
    resetUiTimeout()
  }, [currentPage, resetUiTimeout])

  useEffect(() => {
    if (!currentPage || !metaData) return

    saveReadingPosition(
      initialSurah,
      surahName,
      currentPage,
    )
  }, [currentPage, initialSurah, metaData, surahName])

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
        Math.max(0, rect.width * nextScale - rect.width) / 2

      const overflowY =
        Math.max(0, rect.height * nextScale - rect.height) /
        2

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
            pinchStartRef.current.scale * distanceRatio,
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
        const endX = event.changedTouches[0].clientX

        const swipeDistance = startX - endX

        if (Math.abs(swipeDistance) > SWIPE_THRESHOLD) {
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
    [handleNextPage, handlePreviousPage, userScale],
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
          localStorage.getItem(RECITER_SERVER_KEY) || server

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

        localStorage.setItem(NIGHT_MODE_KEY, String(next))

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
    player.playing && player.surah === initialSurah

  const surface = isNightMode
    ? 'rgba(24, 24, 27, 0.88)'
    : 'rgba(255, 255, 255, 0.88)'

  const bg = isNightMode ? '#101010' : '#fdfbf7'
  const fg = isNightMode ? '#f4f4f5' : '#06140f'
  const border = isNightMode
    ? 'rgba(63, 63, 70, 0.7)'
    : '#e8dccb'

  const accent = '#d4af37'

  const primary = isNightMode ? '#d4af37' : '#0a1f1a'

  const primaryText = isNightMode ? '#101010' : '#fdfbf7'

  const printGreen = isNightMode ? '#d4af37' : PRINT_GREEN
  const printGold = isNightMode ? '#8a7030' : PRINT_GOLD
  const headerFrameBg = isNightMode ? '#16161a' : PRINT_CREAM

  const versesCount = currentSurahInfo?.verses

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
      className="mushaf-root relative flex h-dvh w-full select-none flex-col overflow-hidden"
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

      {/* الشريط العلوي الثابت بتصميم المصحف المطبوع */}
      <div
        className="flex shrink-0 items-center justify-between px-3 pb-2 relative z-50"
        style={{
          paddingTop:
            'calc(env(safe-area-inset-top, 0px) + 8px)',
          color: printGreen,
          borderBottom: `1px solid ${printGold}`,
          backgroundColor: bg,
        }}
      >
        <span className="text-[13px] font-bold">
          {formatValue(currentSurahIndex + 1)} {surahName}
          {versesCount
            ? ` (${formatValue(versesCount)})`
            : ''}
        </span>

        <span className="text-[13px] font-bold">
          الجزء {formatValue(currentJuzNumber)}
          {currentQuarter
            ? ` (${formatValue(currentQuarter.quarter)}/${formatValue(4)})`
            : ''}
        </span>

        <span className="text-[13px] font-bold">
          {formatValue(currentPage)}
        </span>
      </div>

      {/* منطقة الصفحة */}
      <div
        ref={containerRef}
        className="relative min-h-0 flex-1"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${userScale})`,
          transformOrigin: 'center center',
          transition:
            userScale === MIN_SCALE
              ? 'transform 180ms ease-out'
              : 'transform 60ms linear',
        }}
      >
        {(isPageLoading || !isPageMeasured) && !hasError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <Loader2
              className="size-7 animate-spin"
              style={{ color: fg }}
            />
          </div>
        )}

        {hasError ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
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
          <div
            ref={pageBoxRef}
            className="relative h-full w-full overflow-hidden px-1"
            onDoubleClick={handleDoubleClick}
          >
            {/* قياس مخفي */}
            <div
              ref={measureRef}
              aria-hidden
              className="pointer-events-none invisible absolute left-0 top-0"
              style={{ direction: 'rtl' }}
            >
              {pageData.lines.map((line, lineIndex) => (
                <div
                  key={lineIndex}
                  data-row
                  className="flex"
                  style={{ width: 'max-content' }}
                >
                  {renderLineContent(
                    line,
                    REFERENCE_FONT_SIZE,
                    fg,
                  )}
                </div>
              ))}
            </div>

            {/* الصفحة الفعلية */}
            <div
              className="flex h-full w-full flex-col justify-center"
              style={{
                direction: 'rtl',
                opacity: isPageMeasured && rowPx ? 1 : 0,
                transition: 'opacity 200ms ease-out',
              }}
            >
              {pageData.lines.map((line, lineIndex) => {
                const isHeader = isHeaderLine(line)
                const centered =
                  isHeader || isBismillahLine(line)

                return (
                  <div
                    key={lineIndex}
                    className={cn(
                      'flex items-center',
                      centered
                        ? 'justify-center'
                        : 'justify-between',
                    )}
                    style={{
                      direction: 'rtl',
                      width: '100%',
                      height: rowPx,
                    }}
                  >
                    {isHeader ? (
                      <div
                        className="flex h-full w-[96%] items-center justify-center rounded-md"
                        style={{
                          border: `3px double ${printGold}`,
                          boxShadow: `inset 0 0 0 1px ${printGreen}`,
                          backgroundColor: headerFrameBg,
                          padding: '0 8px',
                        }}
                      >
                        {renderLineContent(line, fontPx, printGreen)}
                      </div>
                    ) : (
                      renderLineContent(line, fontPx, fg)
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* الشريط العائم */}
      <header
        className={cn(
          'absolute inset-x-0 top-0 z-50 flex items-start justify-between gap-2 p-3 transition-all duration-300 pointer-events-auto',
          showUi ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        )}
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            router.back()
          }}
          className="flex size-10 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-transform active:scale-90"
          style={{ backgroundColor: surface, borderColor: border, color: fg }}
          aria-label="رجوع"
        >
          <ChevronRight className="size-5" />
        </button>

        <div
          className="flex items-center gap-1 rounded-full border px-2 py-1 shadow-lg backdrop-blur-md"
          style={{ backgroundColor: surface, borderColor: border }}
        >
          <button
            type="button"
            onClick={handleNightModeToggle}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors hover:bg-black/5 active:opacity-60"
            style={{ color: accent }}
          >
            {isNightMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            <span className="text-xs font-bold">{isNightMode ? 'نهاري' : 'ليلي'}</span>
          </button>

          <div className="h-4 w-px bg-border" />

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              router.push('/quran/reciters')
            }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors hover:bg-black/5 active:opacity-60"
            style={{ color: fg }}
          >
            <Headphones className="size-4" />
            <span className="text-xs font-bold">القارئ</span>
          </button>

          <div className="h-4 w-px bg-border" />

          <button
            type="button"
            onClick={handlePlayToggle}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors active:scale-95"
            style={{ backgroundColor: primary, color: primaryText }}
          >
            {isCurrentSurahPlaying ? (
              <>
                <Pause className="size-4" fill="currentColor" />
                <span className="text-xs font-bold">إيقاف</span>
              </>
            ) : (
              <>
                <Play className="size-4" fill="currentColor" />
                <span className="text-xs font-bold">تشغيل</span>
              </>
            )}
          </button>

          <div className="h-4 w-px bg-border" />

          <button
            type="button"
            onClick={handleBookmark}
            className="flex items-center justify-center rounded-full p-1.5 transition-colors hover:bg-black/5 active:opacity-60"
            style={{ color: isBookmarkedPage ? accent : fg }}
          >
            <Bookmark className="size-4" fill={isBookmarkedPage ? 'currentColor' : 'none'} />
          </button>
        </div>
      </header>

      {/* ⚠️ تم حذف الشريط السفلي بالكامل (لا أزرار أسفل الصفحة) */}
    </div>
  )
}