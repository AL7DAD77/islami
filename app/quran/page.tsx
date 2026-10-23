import { CalendarCheck, Headphones, BookOpen } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { SurahList } from '@/components/quran/surah-list'
import { getSurahList } from '@/lib/quran'
import { BookmarksCard } from '@/components/quran/bookmarks-card'
import { SearchButton } from '@/components/search-button'

export const metadata: Metadata = { title: 'القرآن الكريم | إسلامي' }

export default async function QuranPage() {
  const surahs = await getSurahList()
  
  return (
    <div className="min-h-screen bg-[#f7f3ea] pb-24" dir="rtl">
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0a1f1a]">القرآن الكريم</h1>
            <p className="text-sm text-[#0a1f1a]/60 mt-1">بالرسم العثماني مع تلاوات أشهر القراء</p>
          </div>
          <div className="bg-white rounded-full shadow-sm border border-[#e8dccb] p-1">
            <Suspense fallback={<div className="size-10" />}>
              <SearchButton />
            </Suspense>
          </div>
        </div>

        <div className="empty:hidden">
          <BookmarksCard />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/quran/wird" className="relative overflow-hidden rounded-2xl bg-[#0a1f1a] p-4 text-white shadow-lg shadow-[#0a1f1a]/10 hover:bg-[#0a1f1a]/90 transition-colors">
            <div className="absolute right-0 top-0 -mr-4 -mt-4 size-24 rounded-full bg-white/5 blur-2xl"></div>
            <CalendarCheck className="size-6 text-[#d4af37] mb-3" />
            <h3 className="font-bold text-base">الورد اليومي</h3>
            <p className="text-xs text-white/70 mt-1">خطة لختم القرآن</p>
          </Link>
          
          <Link href="/quran/reciters" className="relative overflow-hidden rounded-2xl bg-white p-4 text-[#0a1f1a] shadow-sm border border-[#e8dccb] hover:bg-[#fdfbf7] transition-colors">
            <Headphones className="size-6 text-[#0a1f1a] mb-3" />
            <h3 className="font-bold text-base">القراء والتلاوات</h3>
            <p className="text-xs text-[#0a1f1a]/60 mt-1">أكثر من ٢٠٠ قارئ</p>
          </Link>
        </div>

        <div className="pt-2">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="size-5 text-[#d4af37]" />
            <h2 className="text-lg font-bold text-[#0a1f1a]">فهرس السور</h2>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-[#e8dccb] overflow-hidden p-2">
             <SurahList surahs={surahs} />
          </div>
        </div>

      </div>
    </div>
  )
}