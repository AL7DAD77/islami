'use client'

import { CalendarCheck, Headphones, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { SurahList } from '@/components/quran/surah-list'
import { BookmarksCard } from '@/components/quran/bookmarks-card'
import { KhatmahTracker } from '@/components/quran/khatmah-tracker'
import { SearchButton } from '@/components/search-button'
import { useLanguage } from '@/lib/language-context'

export function QuranMain({ surahs }: { surahs: any[] }) {
  const { dict, locale } = useLanguage()

  return (
    <div className="min-h-screen bg-background pb-24" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{dict.quranPage.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{dict.quranPage.subtitle}</p>
          </div>
          <div className="bg-card rounded-full shadow-sm border border-border p-1">
            <Suspense fallback={<div className="size-10" />}>
              <SearchButton />
            </Suspense>
          </div>
        </div>

        <div className="empty:hidden">
          <BookmarksCard />
        </div>

        <KhatmahTracker />

        <div className="grid grid-cols-2 gap-4">
          <Link href="/quran/wird" className="relative overflow-hidden rounded-2xl bg-[#0a1f1a] p-4 text-white shadow-lg shadow-[#0a1f1a]/10 hover:bg-[#0a1f1a]/90 transition-colors">
            <div className="absolute right-0 top-0 -mr-4 -mt-4 size-24 rounded-full bg-white/5 blur-2xl"></div>
            <CalendarCheck className="size-6 text-[#d4af37] mb-3" />
            <h3 className="font-bold text-base">{dict.quranPage.dailyWird}</h3>
            <p className="text-xs text-white/70 mt-1">{dict.quranPage.dailyWirdDesc}</p>
          </Link>
          
          <Link href="/quran/reciters" className="relative overflow-hidden rounded-2xl bg-card p-4 text-foreground shadow-sm border border-border hover:bg-muted transition-colors">
            <Headphones className="size-6 text-foreground mb-3" />
            <h3 className="font-bold text-base">{dict.quranPage.reciters}</h3>
            <p className="text-xs text-muted-foreground mt-1">{dict.quranPage.recitersDesc}</p>
          </Link>
        </div>

        <div className="pt-2">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="size-5 text-[#d4af37]" />
            <h2 className="text-lg font-bold text-foreground">{dict.quranPage.surahIndex}</h2>
          </div>
          <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden p-2">
             <SurahList surahs={surahs} />
          </div>
        </div>

      </div>
    </div>
  )
}