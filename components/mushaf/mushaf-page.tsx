'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { MushafRow } from '@/components/mushaf/mushaf-row'
import {
  MUSHAF_FONT,
  MUSHAF_PAGES,
  computeWidthFit,
  headerSurah,
  loadMushafFont,
  loadMushafMeta,
  loadMushafPage,
} from '@/lib/mushaf'
import type { MushafMeta, MushafPageData } from '@/lib/mushaf'

const FONT_STACK = `'${MUSHAF_FONT}', var(--font-amiri-quran), var(--font-amiri), serif`

/** حدّان بمقدار 2px + حشوة 6px من كل جهة */
const FRAME = 16

/** ارتفاع السطر بوحدة em */
const ROW_EM = 2.15

export function MushafPageView({
  page,
  onSurah,
}: {
  page: number
  onSurah?: (name: string | null) => void
}) {
  const [meta, setMeta] = useState<MushafMeta | null>(null)
  const [data, setData] = useState<MushafPageData | null>(null)
  const [fontReady, setFontReady] = useState(false)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [width, setWidth] = useState(0)

  const boxRef = useRef<HTMLDivElement>(null)
  const onSurahRef = useRef(onSurah)
  onSurahRef.current = onSurah

  useEffect(() => {
    let cancelled = false
    setError(false)

    Promise.all([loadMushafMeta(), loadMushafFont()])
      .then(([m]) => {
        if (cancelled) return
        setMeta(m)
        setFontReady(true)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })

    return () => {
      cancelled = true
    }
  }, [retry])

  useEffect(() => {
    let cancelled = false
    setError(false)

    loadMushafPage(page)
      .then(d => {
        if (cancelled) return
        setData(d)

        loadMushafMeta()
          .then(m => {
            if (!cancelled) {
              onSurahRef.current?.(
                m.surahNames[headerSurah(d) - 1] ?? null,
              )
            }
          })
          .catch(() => {})
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })

    for (const n of [page + 1, page - 1]) {
      if (n >= 1 && n <= MUSHAF_PAGES) {
        loadMushafPage(n).catch(() => {})
      }
    }

    return () => {
      cancelled = true
    }
  }, [page, retry])

  useEffect(() => {
    const el = boxRef.current
    if (!el) return

    const update = () => setWidth(el.clientWidth)

    update()

    const observer = new ResizeObserver(update)
    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  const fit =
    meta && width > 0
      ? computeWidthFit(width - FRAME, meta)
      : null

  const ready = !!(meta && data && fontReady && fit)

  return (
    <div ref={boxRef} dir="rtl" className="w-full">
      {ready && meta && data && fit ? (
        <div
          className="mx-auto rounded-lg border-2 border-double border-primary/35 p-1.5 text-foreground"
          style={{
            width: '100%',
            maxWidth: fit.contentWidth + FRAME,
          }}
        >
          <div
            className="grid"
            style={{
              gridTemplateRows: `repeat(${data.l.length}, ${(fit.fontSize * ROW_EM).toFixed(2)}px)`,
              fontFamily: FONT_STACK,
              fontSize: fit.fontSize,
              lineHeight: 1.6,
            }}
          >
            {data.l.map((line, i) => (
              <MushafRow key={i} line={line} meta={meta} />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center text-sm text-muted-foreground">
          <p>تعذر تحميل الصفحة، تحقق من الاتصال بالإنترنت.</p>

          <button
            type="button"
            onClick={() => setRetry(n => n + 1)}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <div className="flex justify-center py-6">
          <Loader2
            className="size-6 animate-spin text-primary"
            aria-label="جارِ التحميل"
          />
        </div>
      )}
    </div>
  )
}