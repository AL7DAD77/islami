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
  CheckCircle2,
  ChevronRight,
  Compass,
  Download,
  Headphones,
  Home,
  List,
  Loader2,
  Moon,
  Pause,
  Play,
  Sparkles,
  Sun,
  Trash2,
  WifiOff,
  X,
} from 'lucide-react'

import * as BookmarksLib from '@/lib/bookmarks'
import {
  isBookmarked,
  saveReadingPosition,
  toggleBookmark,
  useBookmarkState,
} from '@/lib/bookmarks'

import {
  deleteOfflineSurah,
  downloadSurahAudio,
  downloadSurahsBatch,
  getReciterOfflineStorageBytes,
  isSurahDownloaded,
  listDownloadedSurahsForReciter,
  resolvePlayableSurahSource,
} from '@/lib/quran-offline'

import { cn } from '@/lib/utils'
import { useNumberFormat } from '@/lib/numbers'
import { useQuranPlayer } from '@/lib/quran-player'
import { useSettings } from '@/lib/settings'
import { SURAH_INFO } from '@/lib/quran-info'

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
  | 'offline'

type IndexTab = 'surahs' | 'juz' | 'pages'

const TOTAL_PAGES = 604
const MIN_SCALE = 1
const MAX_SCALE = 4
const DOUBLE_TAP_SCALE = 2
const SWIPE_THRESHOLD = 45

const REFERENCE_FONT_SIZE = 100
const FIT_PADDING = 0.98
const SURAH_HEADER_RATIO = 0.72

const PRINT_GREEN = '#1f3a2c'
const PRINT_LINE = '#c8c2b6'

const META_URL = '/mushaf/meta.json'
const PAGES_URL = '/mushaf-qcf4/pages'
const QUARTER_INDEX_URL = '/mushaf/quarter-index.json'

const NIGHT_MODE_KEY = 'mushaf-night-mode'
const WIRD_PAGES_KEY = 'mushaf-daily-wird-pages'
const AUTO_FOLLOW_VERSE_KEY = 'mushaf-auto-follow-verse'
const TARGET_PAGE_OVERRIDE_KEY = 'mushaf-target-page-override'
const RECITER_SERVER_KEY = 'selected_reciter_server'
const RECITER_NAME_KEY = 'selected_reciter_name'
const RECITER_ID_KEY = 'selected_reciter_id'

const DEFAULT_RECITER_SERVER =
  'https://server8.mp3quran.net/afs/'

const DEFAULT_RECITER_NAME = 'مشاري العفاسي'
const DEFAULT_RECITER_ID = 'afs'

const KHATMAH_DUA =
  'اللهم ارحمني بالقرآن واجعله لي إماماً ونوراً وهدى ورحمة، اللهم ذكرني منه ما نسيت وعلمني منه ما جهلت وارزقني تلاوته آناء الليل وأطراف النهار واجعله لي حجة يا رب العالمين.'

function clampPage(page: number): number {
  return Math.min(Math.max(page, 1), TOTAL_PAGES)
}

function isHomePath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/index.html' ||
    pathname === ''
  )
}

function formatSizeMb(bytes: number): string {
  if (!bytes || bytes <= 0) return '٠.٠ ميجابايت'
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(1)} ميجابايت`
}

function parseVerseKey(verseKey?: string | null): {
  surah?: number
  ayah?: number
} {
  if (!verseKey || typeof verseKey !== 'string') return {}
  const parts = verseKey.split(':')
  if (parts.length !== 2) return {}
  const surah = Number(parts[0])
  const ayah = Number(parts[1])
  return {
    surah: Number.isInteger(surah) && surah >= 1 && surah <= 114 ? surah : undefined,
    ayah: Number.isInteger(ayah) && ayah >= 1 ? ayah : undefined,
  }
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
      const parsed: unknown = JSON.parse(raw)
      if (
        parsed &&
        typeof parsed === 'object' &&
        'page' in parsed &&
        typeof (parsed as { page?: unknown }).page === 'number'
      ) {
        const pg = (parsed as { page: number }).page
        if (pg >= 1 && pg <= TOTAL_PAGES) {
          return clampPage(pg)
        }
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
  _refreshTick?: number,
): Array<{
  key: string
  surahNumber: number
  surahName: string
  page: number
}> {
  void _refreshTick
  const candidates: SavedBookmarkItem[] = []

  const pushFromUnknown = (val: unknown) => {
    if (Array.isArray(val)) {
      candidates.push(...(val as SavedBookmarkItem[]))
      return
    }
    if (val && typeof val === 'object') {
      const obj = val as Record<string, unknown>
      for (const field of ['bookmarks', 'items', 'list', 'pages', 'data']) {
        if (Array.isArray(obj[field])) {
          candidates.push(...(obj[field] as SavedBookmarkItem[]))
        }
      }
    }
  }

  pushFromUnknown(bookmarkState)

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.toLowerCase().includes('bookmark')) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed: unknown = JSON.parse(raw)
      pushFromUnknown(parsed)
    }
  } catch {
    // تجاهل أخطاء القراءة المحلية
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
  const strokeColor = isNightMode ? '#e4e4e7' : '#050505'
  const fillColor = isNightMode ? '#d4d4d8' : '#050505'

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
  options?: {
    activeVerseKey?: string | null
    isNightMode?: boolean
    enableHighlight?: boolean
  },
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

  const activeKey = options?.enableHighlight
    ? options?.activeVerseKey
    : null
  const isNight = Boolean(options?.isNightMode)

  return line.words.map((word, wordIndex) => {
    if (word.type === 'quarter') return null

    const isHighlighted =
      Boolean(activeKey) &&
      Boolean(word.verse_key) &&
      word.verse_key === activeKey

    const highlightStyle = isHighlighted
      ? {
          backgroundColor: isNight
            ? 'rgba(250, 204, 21, 0.24)'
            : 'rgba(16, 185, 129, 0.22)',
          color: isNight ? '#fef08a' : '#064e3b',
          borderRadius: '4px',
          boxShadow: isNight
            ? '0 0 0 1px rgba(250, 204, 21, 0.35)'
            : '0 0 0 1px rgba(16, 185, 129, 0.35)',
        }
      : undefined

    return (
      <span
        key={wordIndex}
        title={word.text}
        className="transition-colors duration-150"
        style={{
          ...baseStyle,
          ...highlightStyle,
          fontFamily: fontOf(word),
        }}
      >
        {glyphOf(word)}
      </span>
    )
  })
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
  const hasExplicitPageParam = pageParam > 0
  const initialPage = hasExplicitPageParam
    ? clampPage(pageParam)
    : undefined

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
  const [autoFollowVerse, setAutoFollowVerse] = useState(true)
  const [bookmarksTick, setBookmarksTick] = useState(0)

  const [menuOpen, setMenuOpen] = useState(false)
  const [menuSection, setMenuSection] = useState<MenuSection>('main')
  const [indexTab, setIndexTab] = useState<IndexTab>('surahs')
  const [wirdPages, setWirdPages] = useState<number>(10)
  const [jumpPageInput, setJumpPageInput] = useState<string>('')

  const [offlineTick, setOfflineTick] = useState(0)
  const [isDownloadingCurrent, setIsDownloadingCurrent] = useState(false)
  const [currentDownloadProgress, setCurrentDownloadProgress] = useState(0)
  const [batchStatusText, setBatchStatusText] = useState<string | null>(null)
  const [batchProgressPercent, setBatchProgressPercent] = useState<number | null>(null)
  const [isBatchDownloading, setIsBatchDownloading] = useState(false)
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null)
  const [playingFromOffline, setPlayingFromOffline] = useState(false)

  const downloadAbortRef = useRef<AbortController | null>(null)
  const activeObjectUrlRef = useRef<string | null>(null)
  const lastFollowedVerseRef = useRef<string | null>(null)
 const versePageCacheRef = useRef<Map<string, number>>(new Map())
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLeavingToHomeRef = useRef(false)

  const [fontPx, setFontPx] = useState(REFERENCE_FONT_SIZE)
  const [rowPx, setRowPx] = useState<number | undefined>(
    undefined,
  )
  const [isPageMeasured, setIsPageMeasured] = useState(false)

  const [showUi, setShowUi] = useState(true)

  const uiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [userScale, setUserScale] = useState(MIN_SCALE)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })

  const containerRef = useRef<HTMLDivElement | null>(null)
  const pageBoxRef = useRef<HTMLDivElement | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)

  const pointerStartRef = useRef<Point | null>(null)
  const pinchStartRef = useRef<PinchState | null>(null)

  const vibrationEnabledRef = useRef(vibrationEnabled)
  const menuStateRef = useRef<{
    menuOpen: boolean
    menuSection: MenuSection
  }>({
    menuOpen: false,
    menuSection: 'main',
  })

  useEffect(() => {
    vibrationEnabledRef.current = vibrationEnabled
  }, [vibrationEnabled])

  useEffect(() => {
    menuStateRef.current = { menuOpen, menuSection }
  }, [menuOpen, menuSection])

  useEffect(() => {
    return () => {
      if (downloadAbortRef.current) {
        downloadAbortRef.current.abort()
      }
      if (activeObjectUrlRef.current) {
        URL.revokeObjectURL(activeObjectUrlRef.current)
      }
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const onStorageChange = (e: StorageEvent) => {
      if (!e.key || e.key.toLowerCase().includes('bookmark')) {
        setBookmarksTick((t) => t + 1)
      }
      if (!e.key || e.key.toLowerCase().includes('offline')) {
        setOfflineTick((t) => t + 1)
      }
    }
    window.addEventListener('storage', onStorageChange)
    return () => window.removeEventListener('storage', onStorageChange)
  }, [])

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

  const activeReciterInfo = useMemo(() => {
    let server = player.moshafServer || DEFAULT_RECITER_SERVER
    let reciterName = player.reciter?.name || DEFAULT_RECITER_NAME
    let reciterId: string | number = player.reciter?.id || DEFAULT_RECITER_ID

    try {
      const savedServer = localStorage.getItem(RECITER_SERVER_KEY)
      const savedName = localStorage.getItem(RECITER_NAME_KEY)
      const savedId = localStorage.getItem(RECITER_ID_KEY)

      if (savedServer && !player.moshafServer) server = savedServer
      if (savedName && !player.reciter?.name) reciterName = savedName
      if (savedId && !player.reciter?.id) reciterId = savedId
    } catch {
      // تجاهل أخطاء التخزين المحلي
    }

    return { reciterId, reciterName, server }
  }, [player.moshafServer, player.reciter])

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

  const isCurrentSurahDownloaded = useMemo(() => {
    void offlineTick
    return isSurahDownloaded(
      activeReciterInfo.reciterId,
      activeReciterInfo.server,
      activeSurahNumber,
    )
  }, [activeReciterInfo, activeSurahNumber, offlineTick])

  const downloadedSurahsList = useMemo(() => {
    void offlineTick
    return listDownloadedSurahsForReciter(
      activeReciterInfo.reciterId,
      activeReciterInfo.server,
    )
  }, [activeReciterInfo, offlineTick])

  const downloadedStorageBytes = useMemo(() => {
    void offlineTick
    return getReciterOfflineStorageBytes(
      activeReciterInfo.reciterId,
      activeReciterInfo.server,
    )
  }, [activeReciterInfo, offlineTick])

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
    () => extractBookmarksList(bookmarkState, metaData, bookmarksTick),
    [bookmarkState, metaData, bookmarksTick],
  )

  const resolvedPlayingVerseKey = useMemo(() => {
    if (!player.playing) return null
    if (player.activeVerseKey) return player.activeVerseKey
    if (player.activeSurah && player.activeAyah) {
      return `${player.activeSurah}:${player.activeAyah}`
    }
    return null
  }, [player.playing, player.activeVerseKey, player.activeSurah, player.activeAyah])

  const isVerseOnCurrentPage = useMemo(() => {
    if (!player.playing || !resolvedPlayingVerseKey || !pageData) {
      return false
    }
    return pageData.lines.some((line) =>
      line.words.some((word) => word.verse_key === resolvedPlayingVerseKey),
    )
  }, [pageData, player.playing, resolvedPlayingVerseKey])

  // تتبع الآية الجارية والانتقال التلقائي إلى صفحتها بدقة
  useEffect(() => {
    if (!player.playing || !resolvedPlayingVerseKey || !metaData?.surahStartPage) {
      lastFollowedVerseRef.current = null
      return
    }

    if (!autoFollowVerse || menuOpen) return

    if (isVerseOnCurrentPage) {
      versePageCacheRef.current.set(resolvedPlayingVerseKey, currentPage)
      lastFollowedVerseRef.current = resolvedPlayingVerseKey
      return
    }

    if (lastFollowedVerseRef.current === resolvedPlayingVerseKey) {
      return
    }

    const parsed = parseVerseKey(resolvedPlayingVerseKey)
    const surahNum = player.activeSurah || parsed.surah
    const ayahNum = player.activeAyah || parsed.ayah || 1

    if (!surahNum || surahNum < 1 || surahNum > 114) return

    const cachedPage = versePageCacheRef.current.get(resolvedPlayingVerseKey)
    if (cachedPage && cachedPage >= 1 && cachedPage <= TOTAL_PAGES) {
      lastFollowedVerseRef.current = resolvedPlayingVerseKey
      if (cachedPage !== currentPage) {
        setCurrentPage(cachedPage)
      }
      return
    }

    const surahStart = metaData.surahStartPage[surahNum - 1] || 1
    let nextSurahStart = TOTAL_PAGES + 1
    for (let i = surahNum; i < metaData.surahStartPage.length; i++) {
      if (metaData.surahStartPage[i] > surahStart) {
        nextSurahStart = metaData.surahStartPage[i]
        break
      }
    }

    const totalVerses = SURAH_INFO[surahNum - 1]?.verses || 1
    const ratio = Math.min(Math.max((ayahNum - 1) / totalVerses, 0), 0.99999)
    const spanPages = Math.max(1, nextSurahStart - surahStart)
    const estimatedPage = clampPage(surahStart + Math.floor(ratio * spanPages))

    let cancelled = false

    const locateAndFollow = async () => {
      const candidatePages = Array.from(
        new Set([
          estimatedPage,
          clampPage(estimatedPage - 1),
          clampPage(estimatedPage + 1),
          surahStart,
        ]),
      )

      for (const pg of candidatePages) {
        if (cancelled) return
        try {
          const padded = String(pg).padStart(3, '0')
          const res = await fetch(`${PAGES_URL}/${padded}.json`)
          if (!res.ok) continue
          const json: PageData = await res.json()
          const found = json.lines.some((line) =>
            line.words.some((w) => w.verse_key === resolvedPlayingVerseKey),
          )
          if (found) {
            versePageCacheRef.current.set(resolvedPlayingVerseKey, pg)
            if (!cancelled) {
              lastFollowedVerseRef.current = resolvedPlayingVerseKey
              if (pg !== currentPage) {
                setCurrentPage(pg)
              }
            }
            return
          }
        } catch {
          // تجاهل أخطاء الفحص الاستباقي والاعتماد على التقدير
        }
      }

      if (!cancelled) {
        lastFollowedVerseRef.current = resolvedPlayingVerseKey
        if (estimatedPage !== currentPage) {
          setCurrentPage(estimatedPage)
        }
      }
    }

    void locateAndFollow()

    return () => {
      cancelled = true
    }
  }, [
    autoFollowVerse,
    currentPage,
    isVerseOnCurrentPage,
    menuOpen,
    metaData,
    player.activeAyah,
    player.activeSurah,
    player.playing,
    resolvedPlayingVerseKey,
  ])

  const goToMainAppRoute = useCallback((): boolean => {
    setMenuOpen(false)
    setMenuSection('main')

    const path = typeof window !== 'undefined' ? window.location.pathname || '' : ''
    if (isHomePath(path)) {
      return false
    }

    if (isLeavingToHomeRef.current) {
      return true
    }
    isLeavingToHomeRef.current = true

    try {
      router.replace('/')
    } catch {
      // تجاهل
    }

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current)
    }

    fallbackTimerRef.current = setTimeout(() => {
      try {
        const current = window.location.pathname || ''
        if (!isHomePath(current)) {
          window.location.replace('/')
        }
      } catch {
        // تجاهل
      } finally {
        isLeavingToHomeRef.current = false
      }
    }, 450)

    return true
  }, [router])

  useEffect(() => {
    let isMounted = true
    let removeCapacitorAppListener: (() => void) | undefined

    const handleBackAction = (): boolean => {
      if (!isMounted) return false

      const { menuOpen: isMenuOpen, menuSection: activeSection } =
        menuStateRef.current

      if (isMenuOpen) {
        if (activeSection !== 'main') {
          setMenuSection('main')
        } else {
          setMenuOpen(false)
        }
        return true
      }

      const path =
        typeof window !== 'undefined' ? window.location.pathname || '' : ''
      if (!isHomePath(path)) {
        goToMainAppRoute()
        return true
      }

      return false
    }

    const handleWindowBackButton = (event: Event) => {
      const handled = handleBackAction()
      if (handled && 'preventDefault' in event) {
        event.preventDefault()
      }
    }

    window.addEventListener('backButton', handleWindowBackButton)

    void (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core')
        if (!Capacitor.isNativePlatform()) return

        const { App } = await import('@capacitor/app')
        const listener = await App.addListener('backButton', () => {
          handleBackAction()
        })
        if (isMounted) {
          removeCapacitorAppListener = () => {
            void listener.remove()
          }
        } else {
          await listener.remove()
        }
      } catch {
        // يكتفي بمستمع window.addEventListener('backButton', ...)
      }
    })()

    return () => {
      isMounted = false
      window.removeEventListener('backButton', handleWindowBackButton)
      if (removeCapacitorAppListener) {
        removeCapacitorAppListener()
      }
    }
  }, [goToMainAppRoute])

  // تحميل بيانات المصحف والانتقال إلى آخر موضع قراءة محفوظ
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

        const overridePage = consumeTargetPageOverride()
        const savedPage = getSavedReadingPage()
        const surahStart = meta.surahStartPage[initialSurah - 1] || 1

        if (overridePage) {
          setCurrentPage(overridePage)
        } else if (savedPage && (initialSurah === 1 || savedPage >= surahStart)) {
          setCurrentPage(savedPage)
        } else if (initialPage) {
          setCurrentPage(initialPage)
        } else {
          setCurrentPage(clampPage(surahStart))
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

  useEffect(() => {
    let isActive = true

    try {
      const savedWird = Number(localStorage.getItem(WIRD_PAGES_KEY))
      if (savedWird > 0) setWirdPages(savedWird)

      const savedFollow = localStorage.getItem(AUTO_FOLLOW_VERSE_KEY)
      if (savedFollow === 'false') {
        setAutoFollowVerse(false)
      } else {
        setAutoFollowVerse(true)
      }
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

  // قياس أبعاد الصفحة وموازنة حجم الخط وارتفاع السطر لإظهار جميع الأسطر كاملة
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

      const lineCount = Math.max(pageData.lines.length, 1)
      const computedRowHeight = availableHeight / lineCount

      const widthBasedFont =
        (REFERENCE_FONT_SIZE *
          availableWidth *
          FIT_PADDING) /
        widestLine

      const heightBasedFont = computedRowHeight * 0.78

      const nextFont = Math.min(widthBasedFont, heightBasedFont)

      setFontPx(nextFont)
      setRowPx(computedRowHeight)
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
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'none'
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'

    return () => {
      document.body.classList.remove('reading-fullscreen')
      document.documentElement.style.overflow = ''
      document.documentElement.style.overscrollBehavior = ''
      document.body.style.overflow = ''
      document.body.style.overscrollBehavior = ''
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
      if (currentPage && metaData && surahName) {
        saveReadingPosition(activeSurahNumber, surahName, currentPage)
      }
      goToMainAppRoute()
    },
    [activeSurahNumber, currentPage, goToMainAppRoute, metaData, surahName, vibrateDevice],
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
      let reciterId: string | number = DEFAULT_RECITER_ID

      try {
        server =
          localStorage.getItem(RECITER_SERVER_KEY) || server

        reciterName =
          localStorage.getItem(RECITER_NAME_KEY) ||
          reciterName

        reciterId =
          localStorage.getItem(RECITER_ID_KEY) ||
          reciterId
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

      const targetServer = player.moshafServer || server

      void resolvePlayableSurahSource({
        reciterId,
        server: targetServer,
        surahNumber: activeSurahNumber,
      })
        .then((resolved) => {
          if (activeObjectUrlRef.current) {
            URL.revokeObjectURL(activeObjectUrlRef.current)
            activeObjectUrlRef.current = null
          }
          if (resolved.revokeUrl && resolved.src.startsWith('blob:')) {
            activeObjectUrlRef.current = resolved.src
          }
          setPlayingFromOffline(resolved.isOffline)
        })
        .catch(() => {
          setPlayingFromOffline(false)
        })

      player.play(
        activeSurahNumber,
        surahName,
        player.reciter || defaultReciter,
        targetServer,
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

  const handleDownloadCurrentSurah = useCallback(async () => {
    if (isDownloadingCurrent || isBatchDownloading) return

    vibrateDevice(12)
    setOfflineMessage(null)
    setIsDownloadingCurrent(true)
    setCurrentDownloadProgress(5)

    const controller = new AbortController()
    downloadAbortRef.current = controller

    try {
      await downloadSurahAudio({
        reciterId: activeReciterInfo.reciterId,
        reciterName: activeReciterInfo.reciterName,
        server: activeReciterInfo.server,
        surahNumber: activeSurahNumber,
        surahName,
        signal: controller.signal,
        onProgress: (pct) => setCurrentDownloadProgress(pct),
      })
      setOfflineTick((t) => t + 1)
      setOfflineMessage(
        `تم تحميل ${surahName} بصوت ${activeReciterInfo.reciterName} للعمل بدون إنترنت.`,
      )
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setOfflineMessage('تم إلغاء تحميل السورة.')
      } else {
        setOfflineMessage('تعذر تحميل السورة، تحقق من الاتصال بالإنترنت.')
      }
    } finally {
      downloadAbortRef.current = null
      setIsDownloadingCurrent(false)
      setCurrentDownloadProgress(0)
    }
  }, [
    activeReciterInfo,
    activeSurahNumber,
    isBatchDownloading,
    isDownloadingCurrent,
    surahName,
    vibrateDevice,
  ])

  const handleCancelDownload = useCallback(() => {
    if (downloadAbortRef.current) {
      downloadAbortRef.current.abort()
    }
  }, [])

  const handleDeleteCurrentSurah = useCallback(async () => {
    vibrateDevice(12)
    setOfflineMessage(null)
    await deleteOfflineSurah({
      reciterId: activeReciterInfo.reciterId,
      server: activeReciterInfo.server,
      surahNumber: activeSurahNumber,
    })
    setOfflineTick((t) => t + 1)
    setOfflineMessage(`تم حذف نسخة ${surahName} المحفوظة من الجهاز.`)
  }, [
    activeReciterInfo,
    activeSurahNumber,
    surahName,
    vibrateDevice,
  ])

  const handleDownloadBatch = useCallback(
    async (mode: 'next10' | 'all114') => {
      if (isBatchDownloading || isDownloadingCurrent || !metaData) return

      vibrateDevice(14)
      setOfflineMessage(null)
      setIsBatchDownloading(true)
      setBatchProgressPercent(0)

      const startIdx = mode === 'next10' ? currentSurahIndex : 0
      const endIdx =
        mode === 'next10'
          ? Math.min(startIdx + 10, 114)
          : 114

      const targetSurahs: Array<{ surahNumber: number; surahName: string }> = []
      for (let i = startIdx; i < endIdx; i++) {
        const sNum = i + 1
        const sName = metaData.surahNames[i] || `سورة ${sNum}`
        if (
          !isSurahDownloaded(
            activeReciterInfo.reciterId,
            activeReciterInfo.server,
            sNum,
          )
        ) {
          targetSurahs.push({ surahNumber: sNum, surahName: sName })
        }
      }

      if (targetSurahs.length === 0) {
        setIsBatchDownloading(false)
        setBatchStatusText(null)
        setBatchProgressPercent(null)
        setOfflineMessage('جميع السور المحددة محمّلة مسبقاً على جهازك.')
        return
      }

      const controller = new AbortController()
      downloadAbortRef.current = controller

      try {
        await downloadSurahsBatch({
          reciterId: activeReciterInfo.reciterId,
          reciterName: activeReciterInfo.reciterName,
          server: activeReciterInfo.server,
          surahs: targetSurahs,
          signal: controller.signal,
          onSurahStart: (sNum, idx, total) => {
            const sTitle = metaData.surahNames[sNum - 1] || `سورة ${sNum}`
            setBatchStatusText(
              `جاري تحميل ${sTitle} (${formatValue(idx + 1)} / ${formatValue(total)})`,
            )
            setBatchProgressPercent(Math.round((idx / total) * 100))
          },
          onSurahComplete: (_, idx, total) => {
            setOfflineTick((t) => t + 1)
            setBatchProgressPercent(Math.round(((idx + 1) / total) * 100))
          },
        })
        setOfflineMessage('اكتمل تحميل السور المحددة للعمل بدون إنترنت.')
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          setOfflineMessage('تم إيقاف التحميل الجماعي.')
        } else {
          setOfflineMessage('حدث خطأ أثناء التحميل الجماعي.')
        }
      } finally {
        downloadAbortRef.current = null
        setIsBatchDownloading(false)
        setBatchStatusText(null)
        setBatchProgressPercent(null)
        setOfflineTick((t) => t + 1)
      }
    },
    [
      activeReciterInfo,
      currentSurahIndex,
      formatValue,
      isBatchDownloading,
      isDownloadingCurrent,
      metaData,
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
      setBookmarksTick((t) => t + 1)
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

  const handleAutoFollowToggle = useCallback(() => {
    vibrateDevice(10)
    lastFollowedVerseRef.current = null
    setAutoFollowVerse((prev) => {
      const next = !prev
      try {
        localStorage.setItem(AUTO_FOLLOW_VERSE_KEY, String(next))
      } catch {}
      return next
    })
  }, [vibrateDevice])

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
    ? 'rgba(24, 24, 27, 0.95)'
    : 'rgba(255, 255, 255, 0.96)'

  const bg = isNightMode ? '#101010' : '#fdfbf7'
  const fg = isNightMode ? '#f4f4f5' : '#050505'
  const border = isNightMode
    ? 'rgba(63, 63, 70, 0.7)'
    : '#ded8cc'

  const accent = isNightMode ? '#e4e4e7' : '#050505'

  const primary = isNightMode ? '#f4f4f5' : '#09090b'

  const primaryText = isNightMode ? '#101010' : '#fdfbf7'

  const printGreen = isNightMode ? '#e4e4e7' : PRINT_GREEN
  const printLine = isNightMode ? '#3f3f46' : PRINT_LINE

  const versesCount = currentSurahInfo?.verses
  const isBarsVisible = showUi || menuOpen

  if (isLoading || !metaData) {
    return (
      <div
        dir="rtl"
        className="flex min-h-dvh w-full items-center justify-center overflow-hidden"
        style={{ backgroundColor: bg, overscrollBehavior: 'none' }}
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
        overscrollBehavior: 'none',
      }}
      onClick={handleToggleUi}
    >
      <Qcf4Fonts />

      {/* شريط معلومات الصفحة العلوي الثابت */}
      <div
        className="relative z-40 flex shrink-0 items-center justify-between px-3 pb-2"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
          paddingLeft: 'max(0.85rem, env(safe-area-inset-left))',
          paddingRight: 'max(0.85rem, env(safe-area-inset-right))',
          color: isNightMode ? '#f4f4f5' : '#050505',
          borderBottom: `1px solid ${printLine}`,
          backgroundColor: bg,
        }}
      >
        <span className="text-[13px] font-extrabold" style={{ color: printGreen }}>
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

        <span className="text-[13px] font-extrabold">
          {formatValue(currentPage)}
        </span>
      </div>

      {/* منطقة المصحف: عرض جميع الأسطر كاملة دون قص أو إزاحة */}
      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 overflow-hidden"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)',
          touchAction: userScale > MIN_SCALE ? 'none' : 'pan-x',
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${userScale})`,
          transformOrigin: 'center center',
          transition:
            userScale === MIN_SCALE
              ? 'transform 180ms ease-out'
              : 'transform 60ms linear',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
                    { enableHighlight: false },
                  )}
                </div>
              ))}
            </div>

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
                      'flex items-center overflow-visible',
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
                            ? '#18181b'
                            : '#f3efe6',
                          border: `1.5px solid ${
                            isNightMode ? '#52525b' : '#050505'
                          }`,
                          boxShadow: isNightMode
                            ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
                            : 'inset 0 0 0 1px rgba(5, 5, 5, 0.14)',
                        }}
                      >
                        <DenseOrnamentSide isNightMode={isNightMode} />

                        <div
                          className="mx-1 flex h-[86%] min-w-[44%] max-w-[66%] flex-col items-center justify-center rounded-md px-2.5"
                          style={{
                            backgroundColor: isNightMode
                              ? '#111113'
                              : '#fdfbf7',
                            border: `1px solid ${
                              isNightMode ? '#71717a' : '#050505'
                            }`,
                          }}
                        >
                          <div className="leading-none">
                            {renderLineContent(
                              line,
                              fontPx * 0.95,
                              isNightMode ? '#f4f4f5' : '#050505',
                              { enableHighlight: false },
                            )}
                          </div>

                          <div
                            className="mt-0.5 flex items-center gap-1.5 text-[10px] font-extrabold leading-tight"
                            style={{
                              color: isNightMode ? '#e4e4e7' : '#050505',
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
                      renderLineContent(line, fontPx, fg, {
                        activeVerseKey: resolvedPlayingVerseKey,
                        isNightMode,
                        enableHighlight: player.playing,
                      })
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* الشريط العلوي العائم للتشغيل والحفظ والإعدادات */}
      <header
        className={cn(
          'pointer-events-none absolute inset-x-0 top-12 z-50 flex flex-wrap items-center justify-between gap-2 transition-all duration-300',
          isBarsVisible
            ? 'translate-y-0 opacity-100'
            : '-translate-y-4 opacity-0',
        )}
        style={{
          marginTop: '0.35rem',
          paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 16px)',
          paddingRight: 'calc(env(safe-area-inset-right, 0px) + 16px)',
        }}
      >
        <div className={cn('flex items-center gap-1.5', isBarsVisible ? 'pointer-events-auto' : 'pointer-events-none')}>
          <button
            type="button"
            onClick={handleBackToMainApp}
            className="flex size-9 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-transform active:scale-90"
            style={{ backgroundColor: surface, borderColor: border, color: fg }}
            aria-label="العودة إلى الرئيسية"
          >
            <ChevronRight className="size-4" />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              vibrateDevice(10)
              setBookmarksTick((t) => t + 1)
              setOfflineTick((t) => t + 1)
              setMenuOpen((prev) => {
                const next = !prev
                if (!next) setMenuSection('main')
                return next
              })
            }}
            className="flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md transition-transform active:scale-95"
            style={{
              backgroundColor: menuOpen ? primary : surface,
              borderColor: border,
              color: menuOpen ? primaryText : fg,
            }}
          >
            <List className="size-3.5" />
            <span>القائمة</span>
          </button>
        </div>

        <div
          className={cn(
            'flex max-w-full items-center gap-0.5 rounded-full border px-1.5 py-1 shadow-lg backdrop-blur-md',
            isBarsVisible ? 'pointer-events-auto' : 'pointer-events-none',
          )}
          style={{ backgroundColor: surface, borderColor: border }}
        >
          <button
            type="button"
            onClick={handleNightModeToggle}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors hover:bg-black/5 active:opacity-60"
            style={{ color: fg }}
          >
            {isNightMode ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            <span className="text-[11px] font-bold">{isNightMode ? 'نهاري' : 'ليلي'}</span>
          </button>

          <div className="h-3.5 w-px bg-border" />

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              router.push('/quran/reciters')
            }}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors hover:bg-black/5 active:opacity-60"
            style={{ color: fg }}
          >
            <Headphones className="size-3.5" />
            <span className="text-[11px] font-bold">القارئ</span>
          </button>

          <div className="h-3.5 w-px bg-border" />

          <button
            type="button"
            onClick={handlePlayToggle}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors active:scale-95"
            style={{ backgroundColor: primary, color: primaryText }}
          >
            {isCurrentSurahPlaying ? (
              <>
                <Pause className="size-3.5" fill="currentColor" />
                <span className="text-[11px] font-bold">إيقاف</span>
              </>
            ) : (
              <>
                <Play className="size-3.5" fill="currentColor" />
                <span className="text-[11px] font-bold">
                  {isCurrentSurahDownloaded ? 'تشغيل أوفلاين' : 'تشغيل'}
                </span>
              </>
            )}
          </button>

          <div className="h-3.5 w-px bg-border" />

          <button
            type="button"
            onClick={handleBookmark}
            className="flex items-center justify-center rounded-full p-1.5 transition-colors hover:bg-black/5 active:opacity-60"
            style={{ color: isBookmarkedPage ? accent : fg }}
          >
            <Bookmark className="size-3.5" fill={isBookmarkedPage ? 'currentColor' : 'none'} />
          </button>
        </div>
      </header>

      {/* الشريط السفلي العائم */}
      <nav
        aria-label="شريط أدوات المصحف السفلي"
        onClick={(event) => event.stopPropagation()}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg transition-all duration-300',
          isBarsVisible
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-6 opacity-0',
        )}
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
          paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 18px)',
          paddingRight: 'calc(env(safe-area-inset-right, 0px) + 18px)',
        }}
      >
        <div
          className="flex items-center justify-around rounded-2xl border px-2 py-1.5 shadow-2xl backdrop-blur-xl"
          style={{
            backgroundColor: surface,
            borderColor: border,
            color: fg,
          }}
        >
          <button
            type="button"
            onClick={handleBackToMainApp}
            className="flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-colors hover:bg-black/5"
          >
            <Home className="size-4" />
            <span>الرئيسية</span>
          </button>

          <button
            type="button"
            onClick={() => {
              resetUiTimeout()
              setJumpPageInput(String(currentPage))
              setMenuSection('index')
              setMenuOpen(true)
            }}
            className="flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-colors hover:bg-black/5"
          >
            <List className="size-4" />
            <span>الفهرس</span>
          </button>

          <button
            type="button"
            onClick={() => {
              resetUiTimeout()
              setOfflineTick((t) => t + 1)
              setMenuSection('offline')
              setMenuOpen(true)
            }}
            className="flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-colors hover:bg-black/5"
          >
            <Download className="size-4" />
            <span>التحميل</span>
          </button>

          <button
            type="button"
            onClick={handleNightModeToggle}
            className="flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-colors hover:bg-black/5"
          >
            {isNightMode ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
            <span>{isNightMode ? 'نهاري' : 'ليلي'}</span>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div
          onClick={(event) => event.stopPropagation()}
          className="fixed inset-x-4 top-28 z-60 mx-auto max-h-[66dvh] w-auto max-w-md overflow-y-auto rounded-3xl border p-4 shadow-2xl backdrop-blur-xl"
          style={{
            backgroundColor: surface,
            borderColor: border,
            color: fg,
            overscrollBehavior: 'contain',
          }}
        >
          {menuSection !== 'main' && (
            <div className="mb-3 flex items-center justify-between border-b pb-2.5" style={{ borderColor: border }}>
              <button
                type="button"
                onClick={() => setMenuSection('main')}
                className="flex items-center gap-1 text-xs font-extrabold"
                style={{ color: fg }}
              >
                <ChevronRight className="size-4" />
                <span>العودة للقائمة</span>
              </button>
              <span className="text-sm font-extrabold">
                {menuSection === 'bookmarks' && 'العلامات المرجعية'}
                {menuSection === 'khatmah' && 'ختمة القرآن'}
                {menuSection === 'wird' && 'الورد اليومي'}
                {menuSection === 'dua' && 'دعاء ختم القرآن'}
                {menuSection === 'index' && 'الفهرس'}
                {menuSection === 'offline' && 'التحميل بدون إنترنت'}
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
                  <p className="text-[11px] opacity-75">الموضع الحالي</p>
                  <p className="text-sm font-extrabold">
                    {surahName} · صفحة {formatValue(currentPage)}
                  </p>
                  {player.playing && resolvedPlayingVerseKey && (
                    <p className="mt-0.5 text-[11px] font-bold opacity-85">
                      الآية الجارية: {formatValue(resolvedPlayingVerseKey)}
                    </p>
                  )}
                  {playingFromOffline && isCurrentSurahPlaying && (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] font-bold opacity-85">
                      <WifiOff className="size-3" />
                      <span>يعمل من الجهاز المحلي</span>
                    </p>
                  )}
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
                onClick={handleAutoFollowToggle}
                className="flex items-center justify-between rounded-2xl border p-3 text-right transition-colors hover:bg-black/5"
                style={{ borderColor: border }}
              >
                <span className="flex items-center gap-2.5 text-sm font-bold">
                  <Sparkles className="size-4" />
                  <span>تتبع الآيات والانتقال التلقائي</span>
                </span>
                <span className="text-xs font-bold opacity-85">
                  {autoFollowVerse ? 'مفعّل' : 'متوقف'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOfflineTick((t) => t + 1)
                  setMenuSection('offline')
                }}
                className="flex items-center justify-between rounded-2xl border p-3 text-right transition-colors hover:bg-black/5"
                style={{ borderColor: border }}
              >
                <span className="flex items-center gap-2.5 text-sm font-bold">
                  <Download className="size-4" />
                  <span>تحميل التلاوات أوفلاين</span>
                </span>
                <span className="text-xs font-bold opacity-80">
                  {formatValue(downloadedSurahsList.length)} / {formatValue(114)} سورة
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBookmarksTick((t) => t + 1)
                  setMenuSection('bookmarks')
                }}
                className="flex items-center justify-between rounded-2xl border p-3 text-right transition-colors hover:bg-black/5"
                style={{ borderColor: border }}
              >
                <span className="flex items-center gap-2.5 text-sm font-bold">
                  <Bookmark className="size-4" />
                  <span>العلامات المرجعية</span>
                </span>
                <span className="text-xs font-bold opacity-80">
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
                  <Compass className="size-4" />
                  <span>ختمة القرآن</span>
                </span>
                <span className="text-xs font-bold opacity-80">
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
                  <BookOpen className="size-4" />
                  <span>الورد اليومي</span>
                </span>
                <span className="text-xs font-bold opacity-80">
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
                  <Headphones className="size-4" />
                  <span>القراء والتلاوات</span>
                </span>
                <span className="text-xs font-bold opacity-80">اختيار القارئ والرواية</span>
              </button>

              <button
                type="button"
                onClick={() => setMenuSection('dua')}
                className="flex items-center justify-between rounded-2xl border p-3 text-right transition-colors hover:bg-black/5"
                style={{ borderColor: border }}
              >
                <span className="flex items-center gap-2.5 text-sm font-bold">
                  <Sparkles className="size-4" />
                  <span>دعاء ختم القرآن</span>
                </span>
                <span className="text-xs font-bold opacity-80">عرض الدعاء</span>
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

          {menuSection === 'offline' && (
            <div className="space-y-3 text-xs">
              <div className="rounded-2xl border p-3" style={{ borderColor: border }}>
                <div className="flex items-center justify-between font-bold">
                  <span>القارئ الحالي: {activeReciterInfo.reciterName}</span>
                  <span>{formatSizeMb(downloadedStorageBytes)}</span>
                </div>
                <p className="mt-1 opacity-80">
                  السور المحمّلة: {formatValue(downloadedSurahsList.length)} من {formatValue(114)} سورة
                </p>
              </div>

              <div className="space-y-2.5 rounded-2xl border p-3" style={{ borderColor: border }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold">{surahName}</span>
                  {isCurrentSurahDownloaded ? (
                    <span className="flex items-center gap-1 font-bold">
                      <CheckCircle2 className="size-4" />
                      <span>محفوظة على الجهاز</span>
                    </span>
                  ) : (
                    <span className="opacity-75">أونلاين فقط</span>
                  )}
                </div>

                {isDownloadingCurrent && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>جاري التحميل...</span>
                      <span>{formatValue(currentDownloadProgress)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${currentDownloadProgress}%`,
                          backgroundColor: primary,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {isDownloadingCurrent ? (
                    <button
                      type="button"
                      onClick={handleCancelDownload}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 font-bold"
                      style={{ borderColor: border }}
                    >
                      <X className="size-3.5" />
                      <span>إلغاء التحميل</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        void handleDownloadCurrentSurah()
                      }}
                      disabled={isBatchDownloading}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 font-bold disabled:opacity-50"
                      style={{ backgroundColor: primary, color: primaryText }}
                    >
                      <Download className="size-3.5" />
                      <span>
                        {isCurrentSurahDownloaded
                          ? 'إعادة تحميل السورة'
                          : 'تحميل السورة أوفلاين'}
                      </span>
                    </button>
                  )}

                  {isCurrentSurahDownloaded && !isDownloadingCurrent && (
                    <button
                      type="button"
                      onClick={() => {
                        void handleDeleteCurrentSurah()
                      }}
                      className="flex items-center justify-center gap-1 rounded-xl border px-3 py-2 font-bold"
                      style={{ borderColor: border }}
                      aria-label="حذف السورة المحفوظة"
                    >
                      <Trash2 className="size-3.5" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border p-3" style={{ borderColor: border }}>
                <p className="font-bold">تحميل مجموعة سور للقارئ الحالي:</p>

                {isBatchDownloading && batchStatusText && (
                  <div className="space-y-1.5 rounded-xl border p-2.5" style={{ borderColor: border }}>
                    <div className="flex items-center justify-between font-bold">
                      <span>{batchStatusText}</span>
                      <span>{formatValue(batchProgressPercent ?? 0)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${batchProgressPercent ?? 0}%`,
                          backgroundColor: primary,
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelDownload}
                      className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg border py-1.5 font-bold"
                      style={{ borderColor: border }}
                    >
                      <X className="size-3.5" />
                      <span>إيقاف التحميل</span>
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void handleDownloadBatch('next10')
                    }}
                    disabled={isBatchDownloading || isDownloadingCurrent}
                    className="rounded-xl border py-2 font-bold disabled:opacity-50"
                    style={{ borderColor: border }}
                  >
                    تحميل ١٠ سور قادمة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleDownloadBatch('all114')
                    }}
                    disabled={isBatchDownloading || isDownloadingCurrent}
                    className="rounded-xl border py-2 font-bold disabled:opacity-50"
                    style={{ borderColor: border }}
                  >
                    تحميل المصحف كاملاً
                  </button>
                </div>
              </div>

              {offlineMessage && (
                <div
                  className="rounded-xl border p-2.5 text-center font-bold"
                  style={{ borderColor: border }}
                >
                  {offlineMessage}
                </div>
              )}

              {downloadedSurahsList.length > 0 && (
                <div className="max-h-36 space-y-1.5 overflow-y-auto pl-1">
                  <p className="font-bold opacity-80">السور المحفوظة حالياً:</p>
                  {downloadedSurahsList.map((item) => (
                    <div
                      key={`${item.reciterId}-${item.surahNumber}`}
                      className="flex items-center justify-between rounded-xl border px-3 py-1.5 font-bold"
                      style={{ borderColor: border }}
                    >
                      <span>
                        {formatValue(item.surahNumber)}. {item.surahName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="opacity-75">
                          {formatSizeMb(item.sizeBytes)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            void deleteOfflineSurah({
                              reciterId: activeReciterInfo.reciterId,
                              server: activeReciterInfo.server,
                              surahNumber: item.surahNumber,
                            }).then(() => {
                              setOfflineTick((t) => t + 1)
                            })
                          }}
                          className="rounded-lg p-1 opacity-80 hover:opacity-100"
                          aria-label={`حذف ${item.surahName}`}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {menuSection === 'bookmarks' && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  vibrateDevice(15)
                  toggleBookmark(activeSurahNumber, surahName, currentPage)
                  setBookmarksTick((t) => t + 1)
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
                  className="rounded-2xl border p-4 text-center text-xs font-semibold opacity-80"
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
                        <span className="underline">انتقال</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateDevice(12)
                          toggleBookmark(bm.surahNumber, bm.surahName, bm.page)
                          setBookmarksTick((t) => t + 1)
                        }}
                        className="mr-2 rounded-lg p-1.5 opacity-80 hover:opacity-100"
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
                      backgroundColor: primary,
                    }}
                  />
                </div>
                <div className="mt-3 flex justify-between text-xs font-semibold opacity-85">
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
              <p className="text-xs font-semibold opacity-85">
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
            <div className="rounded-2xl border p-4 text-center leading-8 text-sm font-semibold" style={{ borderColor: border }}>
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
