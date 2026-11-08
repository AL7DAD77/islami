'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/language-context'
import { PageHeader } from '@/components/page-header'
import {
  Loader2,
  Search,
  BookOpen,
  Info,
  User,
  ScrollText,
  ChevronLeft,
  X,
  Play,
  Pause,
  SkipForward,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// عدد الثواني قبل الانتقال التلقائي إلى الكتاب التالي
const AUTO_ADVANCE_DELAY = 5

interface Chapter {
  id: number
  arabic: string
  english: string
}

interface Hadith {
  id: number
  chapterId: number
  arabic: string
  arabicNarrator?: string
  english: {
    narrator: string
    text: string
  }
}

interface BookData {
  chapters: Chapter[]
  hadiths: Hadith[]
}

export default function SahihaynPage() {
  const { dict, locale } = useLanguage()
  const isAr = locale === 'ar'

  const [activeBook, setActiveBook] = useState<'bukhari' | 'muslim'>('bukhari')
  const [bookData, setBookData] = useState<BookData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeChapter, setActiveChapter] = useState<number | null>(null)

  // ✅ حالة الحديث المعروض حالياً
  const [selectedHadithId, setSelectedHadithId] = useState<number | null>(null)

  // ✅ حالة حركة البطاقة: idle | leaving (تظليل ثم صعود) | entering (ظهور الحديث الجديد)
  const [phase, setPhase] = useState<'idle' | 'leaving' | 'entering'>('idle')

  // ✅ الانتقال التلقائي بين الكتب
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [countdown, setCountdown] = useState(AUTO_ADVANCE_DELAY)

  useEffect(() => {
    let isActive = true
    setLoading(true)
    setError(false)
    setActiveChapter(null)
    setSearchQuery('')
    setSelectedHadithId(null)

    fetch(`/hadith/${activeBook}.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load')
        return res.json()
      })
      .then((data: BookData) => {
        if (!isActive) return
        setBookData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        if (!isActive) return
        setError(true)
        setLoading(false)
      })

    return () => { isActive = false }
  }, [activeBook])

  // بعد ظهور الحديث الجديد نعيد الحالة إلى idle ليعمل الانتقال مرة أخرى
  useEffect(() => {
    if (phase !== 'entering') return
    const t = setTimeout(() => setPhase('idle'), 30)
    return () => clearTimeout(t)
  }, [phase])

  const filteredHadiths = useMemo(() => {
    if (!bookData) return []
    let result = bookData.hadiths
    if (activeChapter !== null) {
      result = result.filter((h) => h.chapterId === activeChapter)
    }
    if (searchQuery.trim().length >= 2) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter((h) =>
        h.arabic.toLowerCase().includes(q) ||
        h.english.text.toLowerCase().includes(q) ||
        h.english.narrator.toLowerCase().includes(q) ||
        (h.arabicNarrator || '').toLowerCase().includes(q)
      )
    }
    return result
  }, [bookData, activeChapter, searchQuery])

  const chapterName = (id: number) => {
    const c = bookData?.chapters.find((x) => x.id === id)
    if (!c) return ''
    return isAr ? c.arabic : c.english
  }

  const getNarrator = (hadith: Hadith) => {
    if (isAr && hadith.arabicNarrator) {
      return hadith.arabicNarrator
    }
    return hadith.english.narrator
  }

  // ✅ الحديث المعروض حالياً
  const currentHadith = useMemo(() => {
    if (selectedHadithId === null) return null
    return filteredHadiths.find((h) => h.id === selectedHadithId) || null
  }, [selectedHadithId, filteredHadiths])

  const currentIndex = useMemo(() => {
    if (selectedHadithId === null) return -1
    return filteredHadiths.findIndex((h) => h.id === selectedHadithId)
  }, [selectedHadithId, filteredHadiths])

  const hasNext = currentIndex !== -1 && currentIndex < filteredHadiths.length - 1

  // ✅ انتهى الكتاب الحالي (آخر حديث في الباب المختار)
  const isChapterEnd = activeChapter !== null && currentIndex !== -1 && !hasNext

  // ✅ الكتاب التالي (أول باب بعد الحالي يحتوي على أحاديث)
  const nextChapter = useMemo(() => {
    if (!bookData || activeChapter === null) return null
    const idx = bookData.chapters.findIndex((c) => c.id === activeChapter)
    if (idx === -1) return null
    for (let i = idx + 1; i < bookData.chapters.length; i++) {
      const c = bookData.chapters[i]
      if (bookData.hadiths.some((h) => h.chapterId === c.id)) return c
    }
    return null
  }, [bookData, activeChapter])

  const shouldAutoAdvance = isChapterEnd && autoAdvance && nextChapter !== null

  // ✅ الانتقال إلى أول حديث في الكتاب التالي
  const goToNextChapter = () => {
    if (!nextChapter || !bookData) return
    const first = bookData.hadiths.find((h) => h.chapterId === nextChapter.id)
    if (!first) return

    // ✅ التمرير إلى الأعلى قبل الانتقال
    window.scrollTo({ top: 0, behavior: 'smooth' })

    setActiveChapter(nextChapter.id)
    setSearchQuery('')
    setSelectedHadithId(first.id)
  }

  // ✅ مؤقت الانتقال التلقائي: ينتقل بعد AUTO_ADVANCE_DELAY ثوانٍ
  useEffect(() => {
    if (!shouldAutoAdvance) return
    setCountdown(AUTO_ADVANCE_DELAY)
    const interval = setInterval(() => {
      setCountdown((c) => Math.max(c - 1, 0))
    }, 1000)
    const timeout = setTimeout(() => {
      goToNextChapter()
    }, AUTO_ADVANCE_DELAY * 1000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoAdvance, nextChapter?.id])

  const advance = () => {
    if (!hasNext || phase !== 'idle') return
    const nextId = filteredHadiths[currentIndex + 1].id

    // ✅ التمرير إلى الأعلى قبل الانتقال
    window.scrollTo({ top: 0, behavior: 'smooth' })

    setPhase('leaving')
    setTimeout(() => {
      setSelectedHadithId(nextId)
      setPhase('entering')
    }, 300)
  }

  const cardMotion =
    phase === 'leaving'
      ? '-translate-y-12 opacity-0 scale-95 ring-2 ring-primary bg-primary/10'
      : phase === 'entering'
        ? 'translate-y-8 opacity-0'
        : ''

  // ✅ وضع عرض الحديث المنفرد
  if (currentHadith) {
    return (
      <div className="min-h-dvh bg-background pb-24" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="container mx-auto px-4 py-6 max-w-4xl space-y-4">

          {/* شريط علوي */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setSelectedHadithId(null)}
              className="flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-bold text-foreground shadow-sm border border-border hover:bg-secondary transition-colors"
            >
              <X className="size-4" />
              {isAr ? 'القائمة' : 'List'}
            </button>

            <button
              onClick={() => setAutoAdvance((v) => !v)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold border transition-colors',
                autoAdvance
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-card text-muted-foreground border-border hover:bg-secondary'
              )}
            >
              {autoAdvance ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              {isAr
                ? (autoAdvance ? 'الانتقال التلقائي: مفعّل' : 'الانتقال التلقائي: متوقف')
                : (autoAdvance ? 'Auto-advance: On' : 'Auto-advance: Off')}
            </button>

            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
              {currentIndex + 1} / {filteredHadiths.length}
            </span>
          </div>

          {/* بطاقة الحديث - الضغط عليها ينقل للحديث التالي */}
          <div
            onClick={advance}
            className={cn(
              'rounded-2xl bg-card p-6 shadow-md border border-border cursor-pointer transition-all duration-300 ease-out select-none',
              hasNext && phase === 'idle' && 'hover:border-primary/40 active:scale-[0.99]',
              cardMotion
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                {dict.sahihaynPage.hadithNumber} {currentHadith.id}
              </span>
              <span className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
                {chapterName(currentHadith.chapterId)}
              </span>
            </div>

            <div className="flex items-start gap-2 mb-4 rounded-xl bg-primary/5 p-3">
              <User className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-primary mb-1">
                  {isAr ? 'الراوي' : 'Narrator'}
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {getNarrator(currentHadith)}
                </p>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-bold text-muted-foreground mb-2">
                {isAr ? 'النص العربي' : 'Arabic Text'}
              </p>
              <p className="font-quran text-lg leading-loose text-foreground">
                {currentHadith.arabic}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-muted-foreground mb-2">
                {isAr ? 'النص الإنجليزي' : 'English Text'}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentHadith.english.text}
              </p>
            </div>
          </div>

          {/* رسالة نهاية الكتاب أو تلميح التنقل */}
          {isChapterEnd ? (
            <div className="rounded-2xl bg-accent/50 p-4 text-center space-y-3">
              <p className="text-sm font-bold text-foreground">
                {isAr ? 'انتهى هذا الكتاب' : 'This book has ended'}
              </p>

              {nextChapter ? (
                <>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {autoAdvance
                      ? (isAr
                        ? <>سيتم الانتقال تلقائياً إلى <span className="font-bold text-primary">{chapterName(nextChapter.id)}</span> بعد {countdown} ثوانٍ</>
                        : <>Moving automatically to <span className="font-bold text-primary">{chapterName(nextChapter.id)}</span> in {countdown}s</>)
                      : (isAr
                        ? <>الانتقال التلقائي متوقف. التالي: <span className="font-bold text-primary">{chapterName(nextChapter.id)}</span></>
                        : <>Auto-advance is off. Next: <span className="font-bold text-primary">{chapterName(nextChapter.id)}</span></>)}
                  </p>

                  <button
                    onClick={goToNextChapter}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:opacity-90 active:scale-95 transition-all"
                  >
                    <SkipForward className="size-4" />
                    {isAr ? 'الانتقال الآن' : 'Go now'}
                  </button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {isAr ? 'انتهت كل الكتب في هذا القسم' : 'No more books in this collection'}
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              {hasNext
                ? (isAr ? 'اضغط على الحديث للانتقال إلى التالي' : 'Tap the hadith to go to the next one')
                : (isAr ? 'انتهت الأحاديث في هذا القسم' : 'End of this section')}
            </p>
          )}
        </div>
      </div>
    )
  }

  // ✅ عرض القائمة
  return (
    <div className="min-h-dvh bg-background pb-24" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">

        <PageHeader
          title={dict.sahihaynPage.title}
          subtitle={dict.sahihaynPage.subtitle}
          backHref="/more"
        />

        <Link
          href="/hadith"
          className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-700 p-4 text-white shadow-md transition hover:shadow-lg active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-white/20">
              <ScrollText className="size-6" />
            </span>
            <div>
              <p className="text-sm font-bold">
                {(dict.sahihaynPage as any).hadithLibrary || (isAr ? 'مكتبة الحديث النبوي' : 'Hadith Library')}
              </p>
              <p className="text-xs opacity-90">
                {isAr ? 'تصفح جميع الأحاديث النبوية' : 'Browse all prophetic hadiths'}
              </p>
            </div>
          </div>
          <ChevronLeft className="size-5 shrink-0" />
        </Link>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveBook('bukhari')}
            className={cn(
              'flex-1 rounded-xl py-3 text-sm font-bold transition-all',
              activeBook === 'bukhari'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-card text-foreground border border-border hover:bg-secondary'
            )}
          >
            {dict.sahihaynPage.bukhari}
          </button>
          <button
            onClick={() => setActiveBook('muslim')}
            className={cn(
              'flex-1 rounded-xl py-3 text-sm font-bold transition-all',
              activeBook === 'muslim'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-card text-foreground border border-border hover:bg-secondary'
            )}
          >
            {dict.sahihaynPage.muslim}
          </button>
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-accent/50 p-3 text-xs text-accent-foreground">
          <Info className="size-4 shrink-0 mt-0.5" />
          <p>{dict.sahihaynPage.disclaimer}</p>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder={dict.sahihaynPage.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 pr-12 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="py-20 text-center text-muted-foreground">
            {isAr ? 'حدث خطأ في تحميل البيانات' : 'Error loading data'}
          </div>
        ) : (
          <>
            {activeChapter === null && searchQuery.length < 2 && (
              <div>
                <h2 className="mb-3 text-lg font-bold text-foreground">{dict.sahihaynPage.chapters}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {bookData?.chapters.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveChapter(c.id)}
                      className="rounded-xl bg-card p-4 text-start shadow-sm border border-border hover:bg-secondary transition-colors flex items-center gap-3"
                    >
                      <BookOpen className="size-5 text-primary shrink-0" />
                      <span className="font-bold text-sm">{isAr ? c.arabic : c.english}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(activeChapter !== null || searchQuery.length >= 2) && (
              <div>
                {activeChapter !== null && (
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground">{chapterName(activeChapter)}</h2>
                    <button
                      onClick={() => setActiveChapter(null)}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      {isAr ? 'عرض كل الكتب' : 'Show all books'}
                    </button>
                  </div>
                )}

                {filteredHadiths.length === 0 ? (
                  <p className="py-10 text-center text-muted-foreground">
                    {dict.sahihaynPage.noResults}
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {filteredHadiths.slice(0, 50).map((h) => (
                      <button
                        key={h.id}
                        onClick={() => setSelectedHadithId(h.id)}
                        className="rounded-2xl bg-card p-4 shadow-sm border border-border hover:shadow-md hover:border-primary/40 transition-all text-start w-full"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                            {dict.sahihaynPage.hadithNumber} {h.id}
                          </span>
                          <ChevronLeft className="size-4 text-muted-foreground" />
                        </div>
                        <p className="font-quran text-base leading-relaxed text-foreground line-clamp-2">
                          {h.arabic}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}