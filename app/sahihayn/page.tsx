'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/lib/language-context'
import { PageHeader } from '@/components/page-header'
import { Loader2, Search, BookOpen, Info, User } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  useEffect(() => {
    let isActive = true
    setLoading(true)
    setError(false)
    setActiveChapter(null)
    setSearchQuery('')

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

  return (
    <div className="min-h-dvh bg-background pb-24" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">

        <PageHeader
          title={dict.sahihaynPage.title}
          subtitle={dict.sahihaynPage.subtitle}
          backHref="/more"
        />

        {/* أزرار التبديل */}
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

        {/* التنبيه المصدر */}
        <div className="flex items-start gap-2 rounded-xl bg-accent/50 p-3 text-xs text-accent-foreground">
          <Info className="size-4 shrink-0 mt-0.5" />
          <p>{dict.sahihaynPage.disclaimer}</p>
        </div>

        {/* شريط البحث */}
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
            {/* قائمة الكتب (إن لم يتم اختيار كتاب) */}
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

            {/* قائمة الأحاديث */}
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
                  <div className="flex flex-col gap-4">
                    {filteredHadiths.slice(0, 50).map((h) => (
                      <div
                        key={h.id}
                        className="rounded-2xl bg-card p-5 shadow-sm border border-border hover:shadow-md transition-shadow"
                      >
                        {/* رأس البطاقة */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                            {dict.sahihaynPage.hadithNumber} {h.id}
                          </span>
                          <span className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
                            {chapterName(h.chapterId)}
                          </span>
                        </div>

                        {/* اسم الراوي */}
                        <div className="flex items-start gap-2 mb-3 rounded-xl bg-primary/5 p-3">
                          <User className="size-4 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-primary mb-1">
                              {isAr ? 'الراوي' : 'Narrator'}
                            </p>
                            <p className="text-sm text-foreground leading-relaxed">
                              {getNarrator(h)}
                            </p>
                          </div>
                        </div>

                        {/* النص العربي */}
                        <div className="mb-4">
                          <p className="text-xs font-bold text-muted-foreground mb-2">
                            {isAr ? 'النص العربي' : 'Arabic Text'}
                          </p>
                          <p className="font-quran text-lg leading-loose text-foreground">
                            {h.arabic}
                          </p>
                        </div>

                        {/* النص الإنجليزي */}
                        <div>
                          <p className="text-xs font-bold text-muted-foreground mb-2">
                            {isAr ? 'النص الإنجليزي' : 'English Text'}
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {h.english.text}
                          </p>
                        </div>
                      </div>
                    ))}

                    {filteredHadiths.length > 50 && (
                      <p className="text-center text-xs text-muted-foreground py-4">
                        {isAr
                          ? 'يتم عرض أول 50 حديثاً. استخدم البحث لتضييق النتائج.'
                          : 'Showing first 50 hadiths. Use search to narrow results.'}
                      </p>
                    )}
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