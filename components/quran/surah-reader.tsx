'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlignJustify, BookOpen, Bookmark, ChevronLeft, ChevronRight, Highlighter, Minus, Plus } from 'lucide-react'
import type { Ayah } from '@/lib/quran'
import { stripBasmala, toArabicNumber } from '@/lib/quran'
import { useHydrated, useSettings } from '@/lib/settings'
import { isBookmarked, saveReadingPosition, toggleBookmark, useBookmarkState } from '@/lib/bookmarks'
import { cn } from '@/lib/utils'

const BASMALA = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'

interface MushafPage {
  page: number
  ayahs: Ayah[]
}

export function SurahReader({
  surah,
  surahName,
  ayahs,
  currentAyah,
  initialAyah,
}: {
  surah: number
  surahName: string
  ayahs: Ayah[]
  currentAyah?: number | null
  initialAyah?: number | null
}) {
  const router = useRouter()
  const [settings, update] = useSettings()
  const hydrated = useHydrated()
  const bm = useBookmarkState()
  const fontSize = hydrated ? settings.quranFontSize : 30
  const view = hydrated ? settings.quranView : 'scroll'

  const [selectedAyah, setSelectedAyah] = useState<number | null>(initialAyah || null)
  const [toast, setToast] = useState<string | null>(null)
  const [spread, setSpread] = useState(false) // عرضي: صفحتان متجاورتان كالمصحف المفتوح
  const [pageIndex, setPageIndex] = useState(0)
  const pagerRef = useRef<HTMLDivElement>(null)

  // ====== تقسيم الآيات إلى صفحات المصحف ======
  const pages = useMemo<MushafPage[]>(() => {
    const out: MushafPage[] = []
    for (const a of ayahs) {
      const last = out[out.length - 1]
      if (last && last.page === a.page) last.ayahs.push(a)
      else out.push({ page: a.page, ayahs: [a] })
    }
    return out
  }, [ayahs])

  const pageOfAyah = useCallback(
    (n: number) => Math.max(0, pages.findIndex((p) => p.ayahs.some((a) => a.numberInSurah === n))),
    [pages],
  )

  // ====== الوضع العرضي ======
  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape) and (min-width: 700px)')
    const apply = () => setSpread(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const perView = spread ? 2 : 1

  const goTo = useCallback(
    (i: number, smooth = true) => {
      const el = pagerRef.current
      if (!el || !pages.length) return
      const idx = Math.min(Math.max(i, 0), pages.length - 1)
      ;(el.children[idx] as HTMLElement | undefined)?.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        inline: 'start',
        block: 'nearest',
      })
    },
    [pages.length],
  )

  const onPagerScroll = () => {
    const el = pagerRef.current
    const first = el?.children[0] as HTMLElement | undefined
    if (!el || !first || !first.offsetWidth) return
    setPageIndex(Math.round(Math.abs(el.scrollLeft) / first.offsetWidth))
  }

  // ====== فتح آية محددة (من علامة مرجعية أو متابعة القراءة) ======
  useEffect(() => {
    if (!initialAyah) return
    const t = setTimeout(() => {
      if (view === 'pages') goTo(pageOfAyah(initialAyah), false)
      else document.getElementById(`ayah-${initialAyah}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAyah, view, pages.length])

  // ====== متابعة الآية الجارية أثناء التلاوة ======
  useEffect(() => {
    if (!currentAyah || !settings.ayahHighlight) return
    if (view === 'pages') {
      const target = pageOfAyah(currentAyah)
      const visibleStart = pageIndex - (pageIndex % perView)
      if (target < visibleStart || target >= visibleStart + perView) goTo(target - (target % perView))
    } else if (!selectedAyah) {
      document.getElementById(`ayah-${currentAyah}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAyah, view])

  // ====== حفظ موضع القراءة تلقائياً ======
  useEffect(() => {
    update({ lastRead: { surah, name: surahName } })
  }, [surah, surahName, update])

  useEffect(() => {
    if (view !== 'scroll' || !ayahs.length) return
    const visible = new Set<number>()
    let timer: ReturnType<typeof setTimeout> | undefined
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const n = Number((e.target as HTMLElement).dataset.ayah)
          if (e.isIntersecting) visible.add(n)
          else visible.delete(n)
        }
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
          if (visible.size) saveReadingPosition(surah, surahName, Math.min(...visible))
        }, 1200)
      },
      { threshold: 0.6 },
    )
    document.querySelectorAll('[data-ayah]').forEach((el) => io.observe(el))
    return () => {
      io.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [view, ayahs, surah, surahName])

  useEffect(() => {
    if (view !== 'pages' || !pages.length) return
    const t = setTimeout(() => {
      const p = pages[Math.min(pageIndex, pages.length - 1)]
      if (p) saveReadingPosition(surah, surahName, p.ayahs[0].numberInSurah)
    }, 1200)
    return () => clearTimeout(t)
  }, [view, pageIndex, pages, surah, surahName])

  // ====== العلامات المرجعية ======
  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  const onToggleBookmark = () => {
    if (!selectedAyah) return
    const added = toggleBookmark(surah, surahName, selectedAyah)
    flash(added ? `تمت إضافة علامة عند الآية ${toArabicNumber(selectedAyah)}` : 'تم حذف العلامة')
  }

  const selectedIsBookmarked = selectedAyah ? isBookmarked(bm, surah, selectedAyah) : false

  // ====== عرض الآية ======
  const renderAyah = (a: Ayah) => {
    const playing = settings.ayahHighlight && currentAyah === a.numberInSurah
    const selected = selectedAyah === a.numberInSurah
    const marked = isBookmarked(bm, surah, a.numberInSurah)
    return (
      <span
        key={a.number}
        id={view === 'scroll' ? `ayah-${a.numberInSurah}` : undefined}
        data-ayah={a.numberInSurah}
        onClick={() => setSelectedAyah(selected ? null : a.numberInSurah)}
        className={cn(
          'cursor-pointer rounded-md px-0.5 transition-colors duration-300',
          playing && 'bg-gold/35 text-foreground',
          !playing && selected && 'bg-primary/10 ring-1 ring-primary/50',
          !playing && !selected && 'hover:bg-muted/50',
        )}
      >
        {stripBasmala(a.text.replace('\ufeff', ''), surah, a.numberInSurah)}
        <span className="ayah-marker mx-1 whitespace-nowrap" aria-label={`آية ${a.numberInSurah}`}>
          {`﴿${toArabicNumber(a.numberInSurah)}﴾`}
          {marked && <span aria-label="علامة مرجعية"> 🔖</span>}
        </span>{' '}
      </span>
    )
  }

  const toolbar = (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-full bg-muted p-1" role="group" aria-label="طريقة العرض">
          <button
            type="button"
            onClick={() => update({ quranView: 'scroll' })}
            aria-pressed={view === 'scroll'}
            className={cn(
              'flex items-center gap-1 rounded-full px-3 py-1.5 text-xs transition-colors',
              view === 'scroll' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            <AlignJustify className="size-3.5" aria-hidden="true" />
            {'تمرير'}
          </button>
          <button
            type="button"
            onClick={() => update({ quranView: 'pages' })}
            aria-pressed={view === 'pages'}
            className={cn(
              'flex items-center gap-1 rounded-full px-3 py-1.5 text-xs transition-colors',
              view === 'pages' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            <BookOpen className="size-3.5" aria-hidden="true" />
            {'صفحات المصحف'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => update({ ayahHighlight: !settings.ayahHighlight })}
          aria-pressed={settings.ayahHighlight}
          className={cn(
            'flex items-center gap-1 rounded-full px-3 py-1.5 text-xs transition-colors',
            settings.ayahHighlight ? 'bg-gold/30 text-foreground' : 'bg-muted text-muted-foreground',
          )}
        >
          <Highlighter className="size-3.5" aria-hidden="true" />
          {settings.ayahHighlight ? 'تظليل التلاوة: يعمل' : 'تظليل التلاوة: متوقف'}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {selectedAyah && (
            <button
              type="button"
              onClick={onToggleBookmark}
              className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              <Bookmark className={cn('size-3', selectedIsBookmarked && 'fill-current')} />
              {selectedIsBookmarked ? `إزالة علامة الآية ${toArabicNumber(selectedAyah)}` : `علامة عند الآية ${toArabicNumber(selectedAyah)}`}
            </button>
          )}
          {toast && <span className="text-xs text-primary">{toast}</span>}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{'حجم الخط'}</span>
          <button
            type="button"
            onClick={() => update((s) => ({ quranFontSize: Math.max(20, s.quranFontSize - 2) }))}
            className="flex size-8 items-center justify-center rounded-full bg-muted"
            aria-label="تصغير الخط"
          >
            <Minus className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => update((s) => ({ quranFontSize: Math.min(48, s.quranFontSize + 2) }))}
            className="flex size-8 items-center justify-center rounded-full bg-muted"
            aria-label="تكبير الخط"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )

  // ====================== وضع صفحات المصحف ======================
  if (view === 'pages') {
    const cur = pages[Math.min(pageIndex, pages.length - 1)]
    const atStart = pageIndex <= 0
    const atEnd = pageIndex + perView >= pages.length
    const pageFirstAyah = cur?.ayahs[0]?.numberInSurah ?? null
    const pageMarked = pageFirstAyah ? isBookmarked(bm, surah, pageFirstAyah) : false

    // السابقة/التالية تعبران إلى السورة المجاورة عند طرفي السورة، فيصير التقليب متصلاً
    const goPrev = () => {
      if (!atStart) goTo(pageIndex - perView)
      else if (surah > 1) router.push(`/quran/${surah - 1}`)
    }
    const goNextPage = () => {
      if (!atEnd) goTo(pageIndex + perView)
      else if (surah < 114) router.push(`/quran/${surah + 1}`)
    }
    return (
      <div className="w-full">
        {toolbar}

        <div className="mx-[calc(50%-50vw)] w-[100vw] px-2">
          {surah !== 1 && surah !== 9 && (
            <p className="mb-2 text-center font-quran text-2xl text-primary">{BASMALA}</p>
          )}

          <div
            ref={pagerRef}
            dir="rtl"
            onScroll={onPagerScroll}
            className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ touchAction: 'pan-x pan-y', WebkitOverflowScrolling: 'touch' }}
          >
            {pages.map((p) => (
              <section
                key={p.page}
                className="shrink-0 snap-start px-1.5"
                style={{ width: spread ? '50%' : '100%' }}
                aria-label={`صفحة ${p.page}`}
              >
                <div
                  className="overflow-y-auto rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border"
                  style={{ height: spread ? 'calc(100dvh - 9.5rem)' : 'calc(100dvh - 17rem)' }}
                >
                  <p className="text-justify font-quran leading-[2.3]" style={{ fontSize }}>
                    {p.ayahs.map(renderAyah)}
                  </p>
                </div>
                <p className="mt-1 text-center font-quran text-sm text-muted-foreground">{toArabicNumber(p.page)}</p>
              </section>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 px-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={atStart && surah <= 1}
              className="flex items-center gap-1 rounded-full bg-card px-4 py-2 text-sm shadow-sm ring-1 ring-border disabled:opacity-40"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
              {atStart && surah > 1 ? 'السورة السابقة' : 'السابقة'}
            </button>

            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                disabled={!pageFirstAyah}
                onClick={() => {
                  if (!pageFirstAyah) return
                  const added = toggleBookmark(surah, surahName, pageFirstAyah)
                  flash(added ? 'تمت إضافة علامة لهذه الصفحة' : 'تم حذف علامة الصفحة')
                }}
                aria-pressed={pageMarked}
                aria-label="علامة مرجعية لهذه الصفحة"
                className={cn(
                  'flex items-center gap-1 rounded-full px-3 py-1.5 text-xs ring-1 ring-border',
                  pageMarked ? 'bg-primary text-primary-foreground' : 'bg-card',
                )}
              >
                <Bookmark className={cn('size-3.5', pageMarked && 'fill-current')} aria-hidden="true" />
                {pageMarked ? 'علامة مضافة' : 'علامة للصفحة'}
              </button>
              <span className="text-xs text-muted-foreground">
                {cur
                  ? `صفحة ${toArabicNumber(cur.page)} · ${toArabicNumber(Math.min(pageIndex + 1, pages.length))} من ${toArabicNumber(pages.length)}`
                  : ''}
              </span>
            </div>

            <button
              type="button"
              onClick={goNextPage}
              disabled={atEnd && surah >= 114}
              className="flex items-center gap-1 rounded-full bg-card px-4 py-2 text-sm shadow-sm ring-1 ring-border disabled:opacity-40"
            >
              {atEnd && surah < 114 ? 'السورة التالية' : 'التالية'}
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ====================== وضع التمرير ======================
  return (
    <article className="w-full touch-pan-y rounded-3xl bg-card p-5 pb-48 shadow-sm ring-1 ring-border sm:p-8">
      {toolbar}

      {surah !== 1 && surah !== 9 && <p className="mb-6 text-center font-quran text-3xl text-primary">{BASMALA}</p>}

      <p className="touch-pan-y text-justify font-quran leading-[2.3]" style={{ fontSize, touchAction: 'pan-y' }}>
        {ayahs.map(renderAyah)}
      </p>
    </article>
  )
}
