'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuranPlayer } from '@/lib/quran-player'
import { useLanguage } from '@/lib/language-context'

interface MoshafItem {
  id: number
  name: string
  server: string
  surah_list?: string
  surahs: number[]
}

interface ReciterItem {
  id?: string | number
  name?: string
  reciter_name?: string
  rewaya?: string
  rewaya_name?: string
  Server?: string
  server?: string
  server_url?: string
  featured?: boolean | string | number
  moshaf?: Array<{
    id?: string | number
    name?: string
    server?: string
    surah_list?: string
    surahs?: unknown[]
  }>
}

interface NormalizedMoshafOption {
  id: number
  name: string
  server: string
  surahsCount: number
  raw: MoshafItem
}

function ensureTrailingSlash(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return 'https://server8.mp3quran.net/afs/'
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`
}

function toNumericId(value: string | number | undefined, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.trunc(value)
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim())
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.trunc(parsed)
    }
    let hash = 0
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) % 100000000
    }
    return hash > 0 ? hash : fallback
  }
  return fallback
}

function normalizeSurahsArray(moshaf: {
  surah_list?: string
  surahs?: unknown[]
}): number[] {
  if (Array.isArray(moshaf.surahs) && moshaf.surahs.length > 0) {
    const nums = moshaf.surahs
      .map((item) => Number(item))
      .filter((num) => Number.isInteger(num) && num >= 1 && num <= 114)
    if (nums.length > 0) return nums
  }

  if (typeof moshaf.surah_list === 'string' && moshaf.surah_list.trim()) {
    const nums = moshaf.surah_list
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((num) => Number.isInteger(num) && num >= 1 && num <= 114)
    if (nums.length > 0) return nums
  }

  return Array.from({ length: 114 }, (_, i) => i + 1)
}

function extractMoshafList(
  reciter: ReciterItem,
  fallbackLabel: string,
  fallbackServer: string,
): NormalizedMoshafOption[] {
  const rawList = Array.isArray(reciter?.moshaf) ? reciter.moshaf : []

  const normalized: NormalizedMoshafOption[] = rawList
    .map((m, idx) => {
      const server = ensureTrailingSlash(
        m?.server ||
          reciter?.Server ||
          reciter?.server ||
          reciter?.server_url ||
          fallbackServer,
      )
      const name =
        (typeof m?.name === 'string' && m.name.trim()) ||
        reciter?.rewaya ||
        reciter?.rewaya_name ||
        fallbackLabel
      const id = toNumericId(m?.id, idx + 1)
      const surahs = normalizeSurahsArray(m || {})

      const rawMoshaf: MoshafItem = {
        id,
        name,
        server,
        ...(typeof m?.surah_list === 'string' ? { surah_list: m.surah_list } : {}),
        surahs,
      }

      return {
        id,
        name,
        server,
        surahsCount: surahs.length,
        raw: rawMoshaf,
      }
    })
    .filter((item) => Boolean(item.server))

  if (normalized.length > 0) {
    return normalized
  }

  const singleServer = ensureTrailingSlash(
    reciter?.Server ||
      reciter?.server ||
      reciter?.server_url ||
      fallbackServer,
  )
  const singleName = reciter?.rewaya || reciter?.rewaya_name || fallbackLabel
  const defaultSurahs = Array.from({ length: 114 }, (_, i) => i + 1)

  return [
    {
      id: 1,
      name: singleName,
      server: singleServer,
      surahsCount: defaultSurahs.length,
      raw: { id: 1, name: singleName, server: singleServer, surahs: defaultSurahs },
    },
  ]
}

export function RecitersBrowser({ reciters }: { reciters: ReciterItem[] }) {
  const { dict, locale } = useLanguage()
  const router = useRouter()
  const { changeReciter } = useQuranPlayer()

  const [searchQuery, setSearchQuery] = useState('')
  const [expandedReciterKey, setExpandedReciterKey] = useState<string | number | null>(null)

  const defaultReciterLabel =
    dict?.quranComponents?.recitersBrowser?.defaultReciter || 'قارئ'
  const defaultMoshafLabel =
    dict?.quranComponents?.recitersBrowser?.moshafMurattal || 'حفص عن عاصم'
  const searchPlaceholder =
    dict?.quranComponents?.recitersBrowser?.searchPlaceholder || 'ابحث عن قارئ أو رواية...'
  const noResultsText =
    dict?.quranComponents?.recitersBrowser?.noResults || 'لا توجد نتائج مطابقة'

  const filteredReciters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return reciters || []

    return (reciters || []).filter((reciter) => {
      const name = (reciter?.name || reciter?.reciter_name || '').toLowerCase()
      const rewaya = (reciter?.rewaya || reciter?.rewaya_name || '').toLowerCase()
      const moshafMatches = Array.isArray(reciter?.moshaf)
        ? reciter.moshaf.some((m) => (m?.name || '').toLowerCase().includes(q))
        : false

      return name.includes(q) || rewaya.includes(q) || moshafMatches
    })
  }, [reciters, searchQuery])

  const applyReciterAndMoshaf = (
    reciter: ReciterItem,
    selectedMoshaf: NormalizedMoshafOption,
    allMoshafs: NormalizedMoshafOption[],
  ) => {
    const serverUrl = ensureTrailingSlash(selectedMoshaf.server)
    const reciterName =
      reciter?.name || reciter?.reciter_name || defaultReciterLabel
    const rawIdValue = reciter?.id ?? 1
    const numericReciterId = toNumericId(rawIdValue, 1)

    try {
      localStorage.setItem('selected_reciter_id', String(rawIdValue))
      localStorage.setItem('selected_reciter_server', serverUrl)
      localStorage.setItem('selected_reciter_name', reciterName)
      localStorage.setItem('selected_moshaf_name', selectedMoshaf.name)
    } catch {
      // تجاهل أخطاء التخزين المحلي
    }

    const orderedMoshafs: MoshafItem[] = [
      selectedMoshaf.raw,
      ...allMoshafs
        .filter((item) => item.id !== selectedMoshaf.id || item.name !== selectedMoshaf.name)
        .map((item) => item.raw),
    ]

    const fullReciter = {
      id: numericReciterId,
      name: reciterName,
      featured: Boolean(reciter?.featured),
      moshaf: orderedMoshafs,
    }

    changeReciter(fullReciter, serverUrl)
    router.back()
  }

  return (
    <div
      className="w-full flex flex-col gap-4"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary shadow-inner text-sm md:text-base"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
          🔍
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto p-1">
        {filteredReciters.length > 0 ? (
          filteredReciters.map((reciter, index) => {
            const reciterKey = reciter?.id ?? index
            const name =
              reciter?.name || reciter?.reciter_name || defaultReciterLabel
            const moshafList = extractMoshafList(
              reciter,
              defaultMoshafLabel,
              'https://server8.mp3quran.net/afs/',
            )
            const hasMultipleMoshafs = moshafList.length > 1
            const isExpanded = expandedReciterKey === reciterKey

            return (
              <div
                key={reciterKey}
                className="w-full bg-card border border-border rounded-xl shadow-md transition-all duration-200 overflow-hidden flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (hasMultipleMoshafs) {
                      setExpandedReciterKey((prev) =>
                        prev === reciterKey ? null : reciterKey,
                      )
                    } else {
                      applyReciterAndMoshaf(
                        reciter,
                        moshafList[0],
                        moshafList,
                      )
                    }
                  }}
                  className="w-full hover:border-primary p-4 cursor-pointer transition-all duration-200 hover:bg-secondary active:scale-[0.99] flex items-center justify-between text-start gap-2"
                >
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <h3 className="text-foreground font-bold text-base truncate">
                      {name}
                    </h3>

                    <div className="flex flex-wrap gap-1.5">
                      {moshafList.map((m) => (
                        <span
                          key={`${reciterKey}-${m.id}-${m.name}`}
                          className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20"
                        >
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {hasMultipleMoshafs
                        ? `${moshafList.length} روايات/مصاحف`
                        : moshafList[0]?.name || defaultMoshafLabel}
                    </span>
                    <span className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-base shadow-sm">
                      {hasMultipleMoshafs ? (isExpanded ? '▲' : '▼') : '▶'}
                    </span>
                  </div>
                </button>

                {hasMultipleMoshafs && isExpanded && (
                  <div className="border-t border-border bg-background/60 px-3 py-2.5 flex flex-col gap-2">
                    <p className="text-xs font-semibold text-muted-foreground">
                      اختر الرواية أو المصحف لهذا القارئ:
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {moshafList.map((m) => (
                        <button
                          type="button"
                          key={`select-${reciterKey}-${m.id}-${m.name}`}
                          onClick={() =>
                            applyReciterAndMoshaf(reciter, m, moshafList)
                          }
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:border-primary bg-card hover:bg-secondary text-xs font-bold text-foreground transition-colors"
                        >
                          <span>{m.name}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {m.surahsCount} سورة · تشغيل ▶
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {noResultsText}
          </div>
        )}
      </div>
    </div>
  )
}
