import { CalendarCheck, ChevronDown, Download, Headphones } from 'lucide-react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { SurahList } from '@/components/quran/surah-list'
import { getSurahList } from '@/lib/quran'
import { DownloadAll } from '@/components/quran/download-all'
import { BookmarksCard } from '@/components/quran/bookmarks-card'
import { TileLink } from '@/components/ui-kit'
import { SearchButton } from '@/components/search-button'

export const metadata: Metadata = { title: 'القرآن الكريم | إسلامي' }

export default async function QuranPage() {
  const surahs = await getSurahList()
  
  return (
    <div className="container mx-auto px-3 py-2 max-w-4xl space-y-4" dir="rtl">
      <PageHeader 
        title="القرآن الكريم" 
        subtitle="بالرسم العثماني مع تلاوات أشهر القراء" 
        action={<SearchButton />} 
      />

      <div className="empty:hidden">
        <BookmarksCard />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TileLink
          tone="primary"
          href="/quran/wird"
          icon={<CalendarCheck className="size-5" />}
          title="الورد اليومي"
          subtitle="خطة لختم القرآن"
        />
        <TileLink
          href="/quran/reciters"
          icon={<Headphones className="size-5" />}
          title="القراء والتلاوات"
          subtitle="أكثر من ٢٠٠ قارئ"
        />
      </div>

      <details className="group rounded-2xl bg-card shadow-sm ring-1 ring-border overflow-hidden transition-all">
        <summary className="flex cursor-pointer list-none items-center gap-3 p-3.5 hover:bg-accent/50 [&::-webkit-details-marker]:hidden">
          <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground shrink-0">
            <Download className="size-4" aria-hidden="true" />
          </span>
          <span className="flex-1 text-sm font-bold">حفظ القرآن للقراءة دون إنترنت</span>
          <ChevronDown
            className="size-4 text-muted-foreground transition-transform group-open:rotate-180 shrink-0"
            aria-hidden="true"
          />
        </summary>
        <div className="px-3.5 pb-3.5 pt-1 border-t border-border/50">
          <DownloadAll />
        </div>
      </details>

      <div className="pt-2">
        <SurahList surahs={surahs} />
      </div>
    </div>
  )
}