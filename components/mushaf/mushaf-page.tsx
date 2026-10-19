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
/** إطار الصفحة: حدّان (2px) + حشوة (6px) من كل جهة */
const FRAME = 16
/** ارتفاع السطر بوحدة em: يتسع لعلامات الضبط العليا والسفلى */
const ROW_EM = 2.15

/**
 * صفحة من المصحف للقراءة فقط بنص QPC Hafs وخط KFGQPC (انظر public/fonts/LICENSE-KFGQPC.txt).
 * تُستعمل في الورد اليومي ليظهر الضبط نفسه الذي في المصحف الأساسي.
 */
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

  // البيانات الوصفية والخط
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

  // الصفحة المطلوبة (تبقى السابقة ظاهرة حتى تصل الجديدة فلا يومض العرض)
  useEffect(() => {
    let cancelled = false
    setError(false)
    loadMushafPage(page)
      .then((d) => {
        if (cancelled) return
        setData(d)
        loadMushafMeta()
          .then((m) => {
            if (!cancelled) onSurahRef.current?.(m.surahNames[headerSurah(d) - 1] ?? null)
          })
          .catch(() => {})
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })

    for (const n of [page + 1, page - 1]) {
      if (n >= 1 && n <= MUSHAF_PAGES) loadMushafPage(n).catch(() => {})
    }

    return () => {
      cancelled = true
    }
  }, [page, retry])

  // عرض الحاوية
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const update = () => setWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const fit = meta && width > 0 ? computeWidthFit(width - FRAME, meta) : null
  const ready = !!(meta && data && fontReady && fit)

  return (
    <div ref={boxRef} dir="rtl" className="w-full">
      {ready && meta && data && fit ? (
        <div
          className="mx-auto rounded-lg border-2 border-double border-primary/35 p-1.5 text-foreground"
          style={{ width: fit.contentWidth + FRAME }}
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
        <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-muted-foreground">
          <p>تعذر تحميل الصفحة، تحقق من الاتصال بالإنترنت.</p>
          <button
            type="button"
            onClick={() => setRetry((n) => n + 1)}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-primary" aria-label="جارِ التحميل" />
        </div>
      )}
    </div>
  )
}
