'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlignJustify, BookOpen, Bookmark, ChevronLeft, ChevronRight, Highlighter, Minus, Play, Plus, Settings2, X } from 'lucide-react'
import type { Ayah } from '@/lib/quran'
import { stripBasmala, toArabicNumber } from '@/lib/quran'
import { useHydrated, useSettings } from '@/lib/settings'
import { isBookmarked, saveReadingPosition, toggleBookmark, useBookmarkState } from '@/lib/bookmarks'
import { cn } from '@/lib/utils'
import { usePinchZoom } from '@/lib/use-pinch-zoom'

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
  onOpenPlayer,
}: {
  surah: number
  surahName: string
  ayahs: Ayah[]
  currentAyah?: number | null
  initialAyah?: number | null
  /** فتح مشغّل الصوت (يُعرض زره في شريط وضع صفحات المصحف) */
  onOpenPlayer?: () => void
}) {
  const router = useRouter()
  const [settings, update] = useSettings()
  const hydrated = useHydrated()
  const bm = useBookmarkState()
  const view = hydrated ? settings.quranView : 'scroll'

  const [selectedAyah, setSelectedAyah] = useState<number | null>(initialAyah || null)
  const [toast, setToast] = useState<string | null>(null)
  // صفحة واحدة تملأ الشاشة في الوضعين الطولي والأفقي (لا صفحتان متجاورتان)
  const spread = false
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


  const perView = spread ? 2 : 1

  // ====== حجم الخط: ملاءمة تلقائية للشاشة في وضع الصفحات، أو حجم يدوي ======
  const [sheet, setSheet] = useState(false)
  const [fit, setFit] = useState<Record<number, number>>({})
  const [vh, setVh] = useState(0)
  useEffect(() => {
    const f = () => setVh(window.innerHeight)
    f()
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  // وضع ملء الشاشة للمصحف: نخفي شريط التنقل السفلي أثناء القراءة فقط
  useEffect(() => {
    document.body.classList.toggle('reading-fullscreen', view === 'pages')
    return () => document.body.classList.remove('reading-fullscreen')
  }, [view])

  const curPageNo = pages[Math.min(pageIndex, pages.length - 1)]?.page ?? -1
  const fitting = hydrated && view === 'pages' && settings.quranFitPage
  const displayFont = fitting ? (fit[curPageNo] ?? 20) : hydrated ? settings.quranFontSize : 30

  // التكبير والتصغير بإصبعين: الحجم المعروض هو الأساس، ويُحفظ يدوياً عند رفع الإصبعين
  const pinch = usePinchZoom<HTMLDivElement>(
    displayFont,
    (v) => update({ quranFontSize: v, quranFitPage: false }),
    [view],
  )
  const fontSize = pinch.size

  // ملاءمة كل صفحة للشاشة: أكبر حجم يجعل النص يملأ الصفحة دون تمرير (بحث ثنائي)
  useLayoutEffect(() => {
    if (!fitting || !pagerRef.current) return
    const next: Record<number, number> = {}
    pagerRef.current.querySelectorAll<HTMLElement>('[data-fit-box]').forEach((box) => {
      const text = box.querySelector<HTMLElement>('[data-fit-text]')
      if (!text) return
      let lo = 14
      let hi = 44
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2)
        text.style.fontSize = mid + 'px'
        if (text.scrollHeight <= box.clientHeight) lo = mid
        else hi = mid - 1
      }
      text.style.fontSize = lo + 'px'
      next[Number(box.dataset.fitBox)] = lo
    })
    setFit((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
  }, [fitting, pages, spread, vh, view, toast, selectedAyah])

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
            onClick={() => update({ quranFontSize: Math.max(16, displayFont - 2), quranFitPage: false })}
            className="flex size-8 items-center justify-center rounded-full bg-muted"
            aria-label="تصغير الخط"
          >
            <Minus className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => update({ quranFontSize: Math.min(48, displayFont + 2), quranFitPage: false })}
            className="flex size-8 items-center justify-center rounded-full bg-muted"
            aria-label="تكبير الخط"
          >
            <Plus className="size-4" />
          </button>
          {view === 'pages' && (
            <button
              type="button"
              onClick={() => update({ quranFitPage: true })}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs transition-colors',
                settings.quranFitPage ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
              aria-pressed={settings.quranFitPage}
            >
              {'ملاءمة للشاشة'}
            </button>
          )}
        </div>
      </div>
    </div>
  )

  // ====================== وضع صفحات المصحف (ملء الشاشة) ======================
  if (view === 'pages') {
    const cur = pages[Math.min(pageIndex, pages.length - 1)]
    const atStart = pageIndex <= 0
    const atEnd = pageIndex + perView >= pages.length
    const pageFirstAyah = cur?.ayahs[0]?.numberInSurah ?? null
    const pageMarked = pageFirstAyah ? isBookmarked(bm, surah, pageFirstAyah) : false
    const pageFont = (page: number) => (fitting && pinch.live === null ? (fit[page] ?? 20) : fontSize)

    // السابقة/التالية تعبران إلى السورة المجاورة عند طرفي السورة
    const goPrev = () => {
      if (!atStart) goTo(pageIndex - perView)
      else if (surah > 1) router.push(`/quran/${surah - 1}`)
    }
    const goNextPage = () => {
      if (!atEnd) goTo(pageIndex + perView)
      else if (surah < 114) router.push(`/quran/${surah + 1}`)
    }

    return (
      <div ref={pinch.ref} dir="rtl" className="fixed inset-0 z-[45] flex flex-col bg-background">
        <header className="flex items-center gap-2 px-3 pb-2 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)]">
          <button
            type="button"
            onClick={() => router.push('/quran')}
            aria-label="رجوع"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-bold">{`سورة ${surahName}`}</p>
            <p className="text-[11px] text-muted-foreground">
              {cur
                ? `صفحة ${toArabicNumber(cur.page)} · ${toArabicNumber(Math.min(pageIndex + 1, pages.length))} من ${toArabicNumber(pages.length)}`
                : ''}
            </p>
          </div>
          {onOpenPlayer && (
            <button
              type="button"
              onClick={onOpenPlayer}
              aria-label="تشغيل التلاوة"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
            >
              <Play className="size-4 fill-current" aria-hidden="true" />
            </button>
          )}
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
              'flex size-9 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 ring-border',
              pageMarked ? 'bg-primary text-primary-foreground' : 'bg-card',
            )}
          >
            <Bookmark className={cn('size-4', pageMarked && 'fill-current')} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setSheet(true)}
            aria-label="الأدوات والإعدادات"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border"
          >
            <Settings2 className="size-5" aria-hidden="true" />
          </button>
        </header>

        {toast && <p className="px-3 pb-1 text-center text-xs text-primary">{toast}</p>}

        <div className="relative min-h-0 flex-1">
          <div
            ref={pagerRef}
            dir="rtl"
            onScroll={onPagerScroll}
            className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
            style={{ touchAction: 'pan-x pan-y', WebkitOverflowScrolling: 'touch' }}
          >
            {pages.map((p, idx) => (
              <section
                key={p.page}
                className="h-full shrink-0 snap-start px-3 pb-1"
                style={{ width: '100%' }}
                aria-label={`صفحة ${p.page}`}
              >
                <div data-fit-box={p.page} className="h-full overflow-y-auto">
                  {idx === 0 && surah !== 1 && surah !== 9 && (
                    <p className="mb-2 text-center font-quran text-xl text-primary">{BASMALA}</p>
                  )}
                  <p
                    data-fit-text
                    className="text-justify font-quran leading-[2.2]"
                    style={{ fontSize: pageFont(p.page) }}
                  >
                    {p.ayahs.map(renderAyah)}
                  </p>
                </div>
              </section>
            ))}
          </div>
        </div>

        {selectedAyah && (
          <div className="flex justify-center px-3 pb-1">
            <button
              type="button"
              onClick={onToggleBookmark}
              className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-sm"
            >
              <Bookmark className={cn('size-3', selectedIsBookmarked && 'fill-current')} />
              {selectedIsBookmarked
                ? `إزالة علامة الآية ${toArabicNumber(selectedAyah)}`
                : `علامة عند الآية ${toArabicNumber(selectedAyah)}`}
            </button>
          </div>
        )}

        <footer className="flex items-center justify-between gap-2 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-1">
          <button
            type="button"
            onClick={goPrev}
            disabled={atStart && surah <= 1}
            className="flex items-center gap-1 rounded-full bg-card px-3 py-2 text-xs shadow-sm ring-1 ring-border disabled:opacity-40"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
            {atStart && surah > 1 ? 'السورة السابقة' : 'السابقة'}
          </button>
          <button
            type="button"
            onClick={goNextPage}
            disabled={atEnd && surah >= 114}
            className="flex items-center gap-1 rounded-full bg-card px-3 py-2 text-xs shadow-sm ring-1 ring-border disabled:opacity-40"
          >
            {atEnd && surah < 114 ? 'السورة التالية' : 'التالية'}
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
        </footer>

        {sheet && (
          <div className="fixed inset-0 z-[60] flex items-end bg-black/40" onClick={() => setSheet(false)}>
            <div
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl bg-background p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] shadow-2xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-bold">{'الأدوات والإعدادات'}</p>
                <button
                  type="button"
                  onClick={() => setSheet(false)}
                  aria-label="إغلاق"
                  className="flex size-8 items-center justify-center rounded-full bg-muted"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              {toolbar}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ====================== وضع التمرير ======================
  return (
    <article ref={pinch.ref} className="w-full touch-pan-y rounded-3xl bg-card p-5 pb-48 shadow-sm ring-1 ring-border sm:p-8">
      {toolbar}

      {surah !== 1 && surah !== 9 && <p className="mb-6 text-center font-quran text-3xl text-primary">{BASMALA}</p>}

      <p className="touch-pan-y text-justify font-quran leading-[2.3]" style={{ fontSize, touchAction: 'pan-y' }}>
        {ayahs.map(renderAyah)}
      </p>
    </article>
  )
}
