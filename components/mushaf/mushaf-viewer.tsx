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
  BookOpen,
  Bookmark,
  ChevronRight,
  Compass,
  Headphones,
  List,
  Loader2,
  Moon,
  Pause,
  Play,
  Sparkles,
  Sun,
  Trash2,
} from 'lucide-react'

import * as BookmarksLib from '@/lib/bookmarks'
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

interface SavedBookmarkItem {
  id?: string
  surah?: number
  surahNumber?: number
  surahName?: string
  page?: number
  pageNumber?: number
  createdAt?: number
}

interface Point {
  x: number
  y: number
}

interface PinchState {
  distance: number
  scale: number
}

type MenuSection =
  | 'main'
  | 'bookmarks'
  | 'khatmah'
  | 'wird'
  | 'dua'
  | 'index'

type IndexTab = 'surahs' | 'juz' | 'pages'

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

const META_URL = '/mushaf/meta.json'
const PAGES_URL = '/mushaf-qcf4/pages'
const QUARTER_INDEX_URL = '/mushaf/quarter-index.json'

const NIGHT_MODE_KEY = 'mushaf-night-mode'
const WIRD_PAGES_KEY = 'mushaf-daily-wird-pages'
const TARGET_PAGE_OVERRIDE_KEY = 'mushaf-target-page-override'
const RECITER_SERVER_KEY = 'selected_reciter_server'
const RECITER_NAME_KEY = 'selected_reciter_name'

const DEFAULT_RECITER_SERVER =
  'https://server8.mp3quran.net/afs/'

const DEFAULT_RECITER_NAME = 'مشاري العفاسي'

const KHATMAH_DUA =
  'اللهم ارحمني بالقرآن واجعله لي إماماً ونوراً وهدى ورحمة، اللهم ذكرني منه ما نسيت وعلمني منه ما جهلت وارزقني تلاوته آناء الليل وأطراف النهار واجعله لي حجة يا رب العالمين.'

function clampPage(page: number): number {
  return Math.min(Math.max(page, 1), TOTAL_PAGES)
}

function getSavedReadingPage(): number | null {
  try {
    const libAny = BookmarksLib as unknown as Record<string, unknown>
    const fn =
      typeof libAny.loadReadingPosition === 'function'
        ? (libAny.loadReadingPosition as () => { page?: number } | null)
        : typeof libAny.getReadingPosition === 'function'
          ? (libAny.getReadingPosition as () => { page?: number } | null)
          : null

    if (fn) {
      const pos = fn()
      if (pos && typeof pos.page === 'number' && pos.page >= 1 && pos.page <= TOTAL_PAGES) {
        return clampPage(pos.page)
      }
    }

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || !k.toLowerCase().includes('reading')) continue
      const raw = localStorage.getItem(k)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed.page === 'number' && parsed.page >= 1 && parsed.page <= TOTAL_PAGES) {
        return clampPage(parsed.page)
      }
    }
  } catch {
    // تجاهل أخطاء القراءة المحلية
  }
  return null
}

function consumeTargetPageOverride(): number | null {
  try {
    const rawOverride = localStorage.getItem(TARGET_PAGE_OVERRIDE_KEY)
    if (!rawOverride) return null
    localStorage.removeItem(TARGET_PAGE_OVERRIDE_KEY)
    const parsed = Number(rawOverride)
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= TOTAL_PAGES) {
      return clampPage(parsed)
    }
  } catch {
    // تجاهل أخطاء التخزين المحلي
  }
  return null
}

function extractBookmarksList(
  bookmarkState: unknown,
  metaData: MushafMetaData | null,
): Array<{
  key: string
  surahNumber: number
  surahName: string
  page: number
}> {
  const candidates: SavedBookmarkItem[] = []

  if (Array.isArray(bookmarkState)) {
    candidates.push(...(bookmarkState as SavedBookmarkItem[]))
  } else if (bookmarkState && typeof bookmarkState === 'object') {
    const obj = bookmarkState as Record<string, unknown>
    for (const field of ['bookmarks', 'items', 'list', 'pages']) {
      if (Array.isArray(obj[field])) {
        candidates.push(...(obj[field] as SavedBookmarkItem[]))
      }
    }
  }

  if (candidates.length === 0) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key || !key.toLowerCase().includes('bookmark')) continue
        const raw = localStorage.getItem(key)
        if (!raw) continue
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          candidates.push(...(parsed as SavedBookmarkItem[]))
        } else if (parsed && typeof parsed === 'object') {
          const pObj = parsed as Record<string, unknown>
          for (const field of ['bookmarks', 'items', 'list', 'pages']) {
            if (Array.isArray(pObj[field])) {
              candidates.push(...(pObj[field] as SavedBookmarkItem[]))
            }
          }
        }
      }
    } catch {
      // تجاهل أخطاء القراءة المحلية
    }
  }

  const normalized: Array<{
    key: string
    surahNumber: number
    surahName: string
    page: number
  }> = []

  const seen = new Set<string>()

  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i]
    if (!item || typeof item !== 'object') continue
    const rawPage = Number(item.page ?? item.pageNumber)
    if (!Number.isInteger(rawPage) || rawPage < 1 || rawPage > TOTAL_PAGES) continue
    const page = clampPage(rawPage)
    const rawSurah = Number(item.surah ?? item.surahNumber ?? 1)
    const surahNumber =
      Number.isInteger(rawSurah) && rawSurah >= 1 && rawSurah <= 114
        ? rawSurah
        : 1
    const surahName =
      item.surahName ||
      metaData?.surahNames[surahNumber - 1] ||
      `سورة ${surahNumber}`

    const uniqueKey = `${surahNumber}-${page}`
    if (seen.has(uniqueKey)) continue
    seen.add(uniqueKey)

    normalized.push({
      key: item.id || `${uniqueKey}-${i}`,
      surahNumber,
      surahName,
      page,
    })
  }

  return normalized
}

function DenseOrnamentSide({
  isNightMode,
  mirror = false,
}: {
  isNightMode: boolean
  mirror?: boolean
}) {
  const strokeColor = isNightMode ? '#d4af37' : '#09090b'
  const fillColor = isNightMode ? '#c59d30' : '#09090b'

  return (
    <svg
      viewBox="0 0 120 44"
      className={cn(
        'h-[90%] w-20 shrink-0 sm:w-28',
        mirror && '-scale-x-100',
      )}
      style={{ color: strokeColor }}
      aria-hidden
    >
      <rect
        x="2"
        y="3"
        width="116"
        height="38"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.85"
      />
      <rect
        x="5"
        y="6"
        width="110"
        height="32"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="3 2"
        opacity="0.7"
      />
      <g transform="translate(22, 22)">
        <circle cx="0" cy="0" r="13" fill="none" stroke="currentColor" strokeWidth="1.1" />
        <circle cx="0" cy="0" r="9.5" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.8" />
        <polygon
          points="0,-12 3.5,-3.5 12,0 3.5,3.5 0,12 -3.5,3.5 -12,0 -3.5,-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <polygon
          points="0,-8 8,-8 8,8 -8,8 -8,-8"
          transform="rotate(45)"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.85"
          opacity="0.75"
        />
        <circle cx="0" cy="0" r="3.2" fill={fillColor} />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M38 7 C46 7, 46 22, 54 22 C46 22, 46 37, 38 37" opacity="0.85" />
        <path d="M54 7 C62 7, 62 22, 70 22 C62 22, 62 37, 54 37" opacity="0.85" />
        <path d="M70 7 C78 7, 78 22, 86 22 C78 22, 78 37, 70 37" opacity="0.85" />
        <path d="M86 7 C94 7, 94 22, 102 22 C94 22, 94 37, 86 37" opacity="0.85" />
        <path d="M38 22 H112" strokeWidth="0.8" opacity="0.65" />
      </g>
      <g fill={fillColor} opacity="0.85">
        <circle cx="46" cy="14" r="1.4" />
        <circle cx="46" cy="30" r="1.4" />
        <circle cx="62" cy="14" r="1.4" />
        <circle cx="62" cy="30" r="1.4" />
        <circle cx="78" cy="14" r="1.4" />
        <circle cx="78" cy="30" r="1.4" />
        <circle cx="94" cy="14" r="1.4" />
        <circle cx="94" cy="30" r="1.4" />
        <polygon points="108,18 111,22 108,26 105,22" />
      </g>
    </svg>
  )
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
  if (word.type === 'surah_header') {
    return 'QCF4_QBSML'
  }

  return word.font || 'QCF4_QBSML'
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
    const firstWord = line.words[0]
    const glyphSize = isHeaderLine(line)
      ? size * SURAH_HEADER_RATIO
      : size

    return (
      <span
        style={{
          ...baseStyle,
          fontSize: `${glyphSize}px`,
          fontFamily: fontOf(firstWord),
        }}
      >
        {glyphOf(firstWord)}
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
    pageParam > 0 ? clampPage(pageParam) : undefined

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

  const [menuOpen, setMenuOpen] = useState(false)
  const [menuSection, setMenuSection] = useState<MenuSection>('main')
  const [indexTab, setIndexTab] = useState<IndexTab>('surahs')
  const [wirdPages, setWirdPages] = useState<number>(10)
  const [jumpPageInput, setJumpPageInput] = useState<string>('')

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

  const activeSurahNumber = currentSurahIndex + 1

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

  const bookmarksList = useMemo(
    () => extractBookmarksList(bookmarkState, metaData),
    [bookmarkState, metaData],
  )

  // معالجة زر الرجوع في النظام (Capacitor) للعودة أولاً إلى الشاشة الرئيسية للتطبيق
  useEffect(() => {
    let listenerRemove: (() => void) | undefined
    let isMounted = true

    const attachBackButton = async () => {
      try {
        const capWindow = window as unknown as {
          Capacitor?: {
            isNativePlatform?: () => boolean
            Plugins?: {
              App?: {
                addListener?: (
                  eventName: 'backButton',
                  cb: (data: { canGoBack: boolean }) => void,
                ) => Promise<{ remove: () => void }> | { remove: () => void }
                exitApp?: () => void
              }
            }
          }
        }

        const appPlugin = capWindow.Capacitor?.Plugins?.App
        if (!appPlugin?.addListener) return

        const handle = await appPlugin.addListener('backButton', () => {
          if (!isMounted) return

          if (menuOpen) {
            if (menuSection !== 'main') {
              setMenuSection('main')
            } else {
              setMenuOpen(false)
            }
            return
          }

          const currentPath = window.location.pathname || '/'
          if (currentPath !== '/') {
            router.replace('/')
            return
          }

          appPlugin.exitApp?.()
        })

        if (isMounted && handle?.remove) {
          listenerRemove = () => {
            handle.remove()
          }
        }
      } catch {
        // تجاهل في بيئة الويب
      }
    }

    attachBackButton()

    return () => {
      isMounted = false
      if (listenerRemove) {
        listenerRemove()
      }
    }
  }, [menuOpen, menuSection, router])

  // تحميل meta.json والانتقال التلقائي لآخر موضع قراءة
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

        if (initialPage) {
          setCurrentPage(initialPage)
        } else {
          const overridePage = consumeTargetPageOverride()
          const savedPage = overridePage ?? getSavedReadingPage()
          const surahStart = meta.surahStartPage[initialSurah - 1] || 1

          if (savedPage && (initialSurah === 1 || savedPage >= surahStart)) {
            setCurrentPage(savedPage)
          } else {
            setCurrentPage(clampPage(surahStart))
          }
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

  // تحميل فهرس أرباع الأحزاب والورد اليومي المحفوظ
  useEffect(() => {
    let isActive = true

    try {
      const savedWird = Number(localStorage.getItem(WIRD_PAGES_KEY))
      if (savedWird > 0) setWirdPages(savedWird)
    } catch {}

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

    if (menuOpen) return

    uiTimeoutRef.current = setTimeout(() => {
      setShowUi(false)
    }, 3000)
  }, [menuOpen])

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

      if (menuOpen) {
        setMenuOpen(false)
        setMenuSection('main')
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
    [menuOpen, resetUiTimeout],
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
    if (!currentPage || !metaData || !surahName) return

    saveReadingPosition(
      activeSurahNumber,
      surahName,
      currentPage,
    )
  }, [activeSurahNumber, currentPage, metaData, surahName])

  const navigateToPage = useCallback(
    (targetPage: number) => {
      const clamped = clampPage(targetPage)
      vibrateDevice(12)
      setCurrentPage(clamped)
      setMenuOpen(false)
      setMenuSection('main')
      setShowUi(true)
      resetUiTimeout()
    },
    [resetUiTimeout, vibrateDevice],
  )

  const handleBackToMainApp = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      vibrateDevice(10)
      router.replace('/')
    },
    [router, vibrateDevice],
  )

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
      if (menuOpen) return

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
    [menuOpen, userScale],
  )

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (menuOpen) return

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
    [clampPan, menuOpen, userScale],
  )

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (menuOpen || event.touches.length > 0) return

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
    [handleNextPage, handlePreviousPage, menuOpen, userScale],
  )

  const handleDoubleClick = useCallback(() => {
    if (menuOpen) return
    vibrateDevice(15)

    if (userScale > MIN_SCALE) {
      setUserScale(MIN_SCALE)
      setPan({ x: 0, y: 0 })
      return
    }

    setUserScale(DOUBLE_TAP_SCALE)
    setPan({ x: 0, y: 0 })
  }, [menuOpen, userScale, vibrateDevice])

  const handlePlayToggle = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      setShowUi(true)
      resetUiTimeout()

      if (
        player.playing &&
        player.surah === activeSurahNumber
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
        activeSurahNumber,
        surahName,
        player.reciter || defaultReciter,
        player.moshafServer || server,
      )
    },
    [
      activeSurahNumber,
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
        activeSurahNumber,
        surahName,
        currentPage,
      )
    },
    [
      activeSurahNumber,
      currentPage,
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

  const handleSaveWird = (pagesCount: number) => {
    const valid = Math.min(Math.max(pagesCount, 1), 604)
    setWirdPages(valid)
    try {
      localStorage.setItem(WIRD_PAGES_KEY, String(valid))
    } catch {}
    navigateToPage(currentPage + valid)
  }

  const isBookmarkedPage = isBookmarked(
    bookmarkState,
    activeSurahNumber,
    currentPage,
  )

  const isCurrentSurahPlaying =
    player.playing && player.surah === activeSurahNumber

  const khatmahPercent = Math.round((currentPage / TOTAL_PAGES) * 100)
  const remainingPages = Math.max(0, TOTAL_PAGES - currentPage)

  const surface = isNightMode
    ? 'rgba(24, 24, 27, 0.92)'
    : 'rgba(255, 255, 255, 0.94)'

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
                        className="relative flex h-full w-[98%] items-center justify-between overflow-hidden rounded-lg px-1"
                        style={{
                          backgroundColor: isNightMode
                            ? '#18140e'
                            : '#f5ebd6',
                          border: `1.5px solid ${
                            isNightMode ? '#d4af37' : '#09090b'
                          }`,
                          boxShadow: isNightMode
                            ? 'inset 0 0 0 2px rgba(212, 175, 55, 0.25)'
                            : 'inset 0 0 0 2px rgba(9, 9, 11, 0.25), 0 1px 3px rgba(9, 9, 11, 0.14)',
                        }}
                      >
                        <DenseOrnamentSide isNightMode={isNightMode} />

                        {/* البطاقة الوسطية لاسم السورة وبياناتها */}
                        <div
                          className="mx-1 flex h-[86%] min-w-[44%] max-w-[66%] flex-col items-center justify-center rounded-md px-2.5"
                          style={{
                            backgroundColor: isNightMode
                              ? '#101012'
                              : '#fffdf7',
                            border: `1px solid ${
                              isNightMode ? '#d4af37' : '#09090b'
                            }`,
                            boxShadow:
                              'inset 0 0 0 1px rgba(9, 9, 11, 0.2)',
                          }}
                        >
                          <div className="leading-none">
                            {renderLineContent(
                              line,
                              fontPx * 0.95,
                              isNightMode ? '#f4f4f5' : '#09090b',
                            )}
                          </div>

                          <div
                            className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold leading-tight"
                            style={{
                              color: isNightMode ? '#d4af37' : '#09090b',
                            }}
                          >
                            <span>ترتيب {formatValue(activeSurahNumber)}</span>
                            {currentSurahInfo?.place ? (
                              <>
                                <span>•</span>
                                <span>{currentSurahInfo.place}</span>
                              </>
                            ) : null}
                            {currentSurahInfo?.verses ? (
                              <>
                                <span>•</span>
                                <span>{formatValue(currentSurahInfo.verses)} آية</span>
                              </>
                            ) : null}
                          </div>
                        </div>

                        <DenseOrnamentSide isNightMode={isNightMode} mirror />
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
          showUi || menuOpen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-4 pointer-events-none',
        )}
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleBackToMainApp}
            className="flex size-10 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-transform active:scale-90"
            style={{ backgroundColor: surface, borderColor: border, color: fg }}
            aria-label="العودة إلى الرئيسية"
          >
            <ChevronRight className="size-5" />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              vibrateDevice(10)
              setMenuOpen((prev) => {
                const next = !prev
                if (!next) setMenuSection('main')
                return next
              })
            }}
            className="flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold shadow-lg backdrop-blur-md transition-transform active:scale-95"
            style={{
              backgroundColor: menuOpen ? primary : surface,
              borderColor: border,
              color: menuOpen ? primaryText : fg,
            }}
          >
            <List className="size-4" />
            <span>القائمة</span>
          </button>
        </div>

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

      {/* القائمة المنسدلة الشاملة فوق صفحة المصحف */}
      {menuOpen && (
        <div
          onClick={(event) => event.stopPropagation()}
          className="fixed inset-x-3 top-20 z-[60] mx-auto max-h-[75dvh] w-auto max-w-md overflow-y-auto rounded-3xl border p-4 shadow-2xl backdrop-blur-xl"
          style={{
            backgroundColor: surface,
            borderColor: border,
            color: fg,
          }}
        >
          {menuSection !== 'main' && (
            <div className="mb-3 flex items-center justify-between border-b pb-2.5" style={{ borderColor: border }}>
              <button
                type="button"
                onClick={() => setMenuSection('main')}
                className="flex items-center gap-1 text-xs font-bold"
                style={{ color: accent }}
              >
                <ChevronRight className="size-4" />
                <span>العودة للقائمة</span>
              </button>
              <span className="text-sm font-bold">
                {menuSection === 'bookmarks' && 'العلامات المرجعية'}
                {menuSection === 'khatmah' && 'ختمة القرآن'}
                {menuSection === 'wird' && 'الورد اليومي'}
                {menuSection === 'dua' && 'دعاء ختم القرآن'}
                {menuSection === 'index' && 'الفهرس'}
              </span>
            </div>
          )}

          {menuSection === 'main' && (
            <div className="flex flex-col gap-2">
              <div
                className="flex items-center justify-between rounded-2xl border p-3"
                style={{ borderColor: border }}
              >
                <div>
                  <p className="text-[11px] opacity-70">الموضع الحالي</p>
                  <p className="text-sm font-bold">
                    {surahName} · صفحة {formatValue(currentPage)}
                  </p>
                </div>
                <span
                  className="rounded-xl px-2.5 py-1 text-xs font-bold"
                  style={{ backgroundColor: primary, color: primaryText }}
                >
                  {formatValue(khatmahPercent)}%
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMenuSection('bookmarks')}
                className="flex items-center justify-between rounded-2xl border p-3 text-right transition-colors hover:bg-black/5"
                style={{ borderColor: border }}
              >
                <span className="flex items-center gap-2.5 text-sm font-bold">
                  <Bookmark className="size-4" style={{ color: accent }} />
                  <span>العلامات المرجعية</span>
                </span>
                <span className="text-xs opacity-75">
                  {formatValue(bookmarksList.length)} علامة
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMenuSection('khatmah')}
                className="flex items-center justify-between rounded-2xl border p-3 text-right transition-colors hover:bg-black/5"
                style={{ borderColor: border }}
              >
                <span className="flex items-center gap-2.5 text-sm font-bold">
                  <Compass className="size-4" style={{ color: accent }} />
                  <span>ختمة القرآن</span>
                </span>
                <span className="text-xs opacity-75">
                  متبقي {formatValue(remainingPages)} صفحة
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMenuSection('wird')}
                className="flex items-center justify-between rounded-2xl border p-3 text-right transition-colors hover:bg-black/5"
                style={{ borderColor: border }}
              >
                <span className="flex items-center gap-2.5 text-sm font-bold">
                  <BookOpen className="size-4" style={{ color: accent }} />
                  <span>الورد اليومي</span>
                </span>
                <span className="text-xs opacity-75">
                  {formatValue(wirdPages)} صفحات
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setMenuSection('main')
                  router.push('/quran/reciters')
                }}
                className="flex items-center justify-between rounded-2xl border p-3 text-right transition-colors hover:bg-black/5"
                style={{ borderColor: border }}
              >
                <span className="flex items-center gap-2.5 text-sm font-bold">
                  <Headphones className="size-4" style={{ color: accent }} />
                  <span>القراء والتلاوات</span>
                </span>
                <span className="text-xs opacity-75">اختيار القارئ</span>
              </button>

              <button
                type="button"
                onClick={() => setMenuSection('dua')}
                className="flex items-center justify-between rounded-2xl border p-3 text-right transition-colors hover:bg-black/5"
                style={{ borderColor: border }}
              >
                <span className="flex items-center gap-2.5 text-sm font-bold">
                  <Sparkles className="size-4" style={{ color: accent }} />
                  <span>دعاء ختم القرآن</span>
                </span>
                <span className="text-xs opacity-75">عرض الدعاء</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setJumpPageInput(String(currentPage))
                  setMenuSection('index')
                }}
                className="flex items-center justify-between rounded-2xl p-3 text-right font-bold transition-opacity active:opacity-80"
                style={{ backgroundColor: primary, color: primaryText }}
              >
                <span className="flex items-center gap-2.5 text-sm">
                  <List className="size-4" />
                  <span>الفهرس</span>
                </span>
                <span className="text-xs opacity-90">السور · الأجزاء · الصفحات</span>
              </button>
            </div>
          )}

          {menuSection === 'bookmarks' && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  vibrateDevice(15)
                  toggleBookmark(activeSurahNumber, surahName, currentPage)
                }}
                className="w-full rounded-2xl py-2.5 text-xs font-bold"
                style={{ backgroundColor: primary, color: primaryText }}
              >
                {isBookmarkedPage
                  ? `إزالة علامة صفحة ${formatValue(currentPage)}`
                  : `حفظ علامة للصفحة الحالية (${formatValue(currentPage)})`}
              </button>

              {bookmarksList.length === 0 ? (
                <div
                  className="rounded-2xl border p-4 text-center text-xs opacity-75"
                  style={{ borderColor: border }}
                >
                  لا توجد علامات مرجعية محفوظة حالياً.
                </div>
              ) : (
                <div className="max-h-60 space-y-1.5 overflow-y-auto pl-1">
                  {bookmarksList.map((bm) => (
                    <div
                      key={bm.key}
                      className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold"
                      style={{ borderColor: border }}
                    >
                      <button
                        type="button"
                        onClick={() => navigateToPage(bm.page)}
                        className="flex flex-1 items-center justify-between text-right"
                      >
                        <span>
                          {bm.surahName} · ص {formatValue(bm.page)}
                        </span>
                        <span style={{ color: accent }}>انتقال</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateDevice(12)
                          toggleBookmark(bm.surahNumber, bm.surahName, bm.page)
                        }}
                        className="mr-2 rounded-lg p-1.5 opacity-75 hover:opacity-100"
                        aria-label="حذف العلامة"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {menuSection === 'khatmah' && (
            <div className="space-y-3 text-sm">
              <div className="rounded-2xl border p-3.5" style={{ borderColor: border }}>
                <div className="mb-2 flex items-center justify-between font-bold">
                  <span>نسبة الإنجاز</span>
                  <span>{formatValue(khatmahPercent)}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${khatmahPercent}%`,
                      backgroundColor: accent,
                    }}
                  />
                </div>
                <div className="mt-3 flex justify-between text-xs opacity-80">
                  <span>الصفحة الحالية: {formatValue(currentPage)}</span>
                  <span>المتبقي: {formatValue(remainingPages)} صفحة</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigateToPage(currentPage)}
                className="w-full rounded-2xl py-2.5 text-sm font-bold"
                style={{ backgroundColor: primary, color: primaryText }}
              >
                متابعة القراءة من صفحة {formatValue(currentPage)}
              </button>
            </div>
          )}

          {menuSection === 'wird' && (
            <div className="space-y-3">
              <p className="text-xs opacity-80">
                اختر مقدار الورد اليومي للانتقال المباشر إليه من صفحتك الحالية:
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 20].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleSaveWird(count)}
                    className="rounded-2xl border py-2.5 text-xs font-bold transition-colors"
                    style={{
                      borderColor: border,
                      backgroundColor: wirdPages === count ? primary : 'transparent',
                      color: wirdPages === count ? primaryText : fg,
                    }}
                  >
                    +{formatValue(count)} صفحات
                  </button>
                ))}
              </div>
            </div>
          )}

          {menuSection === 'dua' && (
            <div className="rounded-2xl border p-4 text-center leading-8 text-sm font-medium" style={{ borderColor: border }}>
              {KHATMAH_DUA}
            </div>
          )}

          {menuSection === 'index' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl border p-1" style={{ borderColor: border }}>
                <button
                  type="button"
                  onClick={() => setIndexTab('surahs')}
                  className="rounded-xl py-1.5 text-xs font-bold"
                  style={{
                    backgroundColor: indexTab === 'surahs' ? primary : 'transparent',
                    color: indexTab === 'surahs' ? primaryText : fg,
                  }}
                >
                  السور
                </button>
                <button
                  type="button"
                  onClick={() => setIndexTab('juz')}
                  className="rounded-xl py-1.5 text-xs font-bold"
                  style={{
                    backgroundColor: indexTab === 'juz' ? primary : 'transparent',
                    color: indexTab === 'juz' ? primaryText : fg,
                  }}
                >
                  الأجزاء
                </button>
                <button
                  type="button"
                  onClick={() => setIndexTab('pages')}
                  className="rounded-xl py-1.5 text-xs font-bold"
                  style={{
                    backgroundColor: indexTab === 'pages' ? primary : 'transparent',
                    color: indexTab === 'pages' ? primaryText : fg,
                  }}
                >
                  الصفحات
                </button>
              </div>

              {indexTab === 'surahs' && (
                <div className="max-h-64 space-y-1.5 overflow-y-auto pl-1">
                  {metaData.surahNames.map((name, idx) => {
                    const startPage = metaData.surahStartPage[idx] || 1
                    const isActive = idx === currentSurahIndex
                    return (
                      <button
                        key={name + idx}
                        type="button"
                        onClick={() => navigateToPage(startPage)}
                        className="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold transition-colors"
                        style={{
                          borderColor: border,
                          backgroundColor: isActive ? primary : 'transparent',
                          color: isActive ? primaryText : fg,
                        }}
                      >
                        <span>
                          {formatValue(idx + 1)}. {name}
                        </span>
                        <span>ص {formatValue(startPage)}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {indexTab === 'juz' && (
                <div className="max-h-64 space-y-1.5 overflow-y-auto pl-1">
                  {metaData.juzStartPage.map((startPage, idx) => {
                    const juzNum = idx + 1
                    const isActive = juzNum === currentJuzNumber
                    return (
                      <button
                        key={juzNum}
                        type="button"
                        onClick={() => navigateToPage(startPage)}
                        className="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold transition-colors"
                        style={{
                          borderColor: border,
                          backgroundColor: isActive ? primary : 'transparent',
                          color: isActive ? primaryText : fg,
                        }}
                      >
                        <span>الجزء {formatValue(juzNum)}</span>
                        <span>ص {formatValue(startPage)}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {indexTab === 'pages' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      max={TOTAL_PAGES}
                      value={jumpPageInput}
                      onChange={(e) => setJumpPageInput(e.target.value)}
                      placeholder="رقم الصفحة (١ - ٦٠٤)"
                      className="flex-1 rounded-xl border bg-transparent px-3 py-2 text-sm font-bold outline-none"
                      style={{ borderColor: border, color: fg }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const num = Number(jumpPageInput)
                        if (num >= 1 && num <= TOTAL_PAGES) {
                          navigateToPage(num)
                        }
                      }}
                      className="rounded-xl px-4 py-2 text-xs font-bold"
                      style={{ backgroundColor: primary, color: primaryText }}
                    >
                      انتقال
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 max-h-44 overflow-y-auto">
                    {Array.from({ length: 60 }, (_, i) => i * 10 + 1).map((pg) => (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => navigateToPage(pg)}
                        className="rounded-xl border py-1.5 text-xs font-bold"
                        style={{ borderColor: border }}
                      >
                        ص {formatValue(pg)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
