import { CalendarCheck, ChevronDown, Download, Headphones } from 'lucide-react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { SurahList } from '@/components/quran/surah-list'
import { getSurahList } from '@/lib/quran'
import { LastPlayedCard } from '@/components/quran/last-played-card'
import { DownloadAll } from '@/components/quran/download-all'
import { BookmarksCard } from '@/components/quran/bookmarks-card'
import { TileLink } from '@/components/ui-kit'

export const metadata: Metadata = { title: 'القرآن الكريم | إسلامي' }

export default async function QuranPage() {
  const surahs = await getSurahList()
  return (
    <>
      <PageHeader title="القرآن الكريم" subtitle="بالرسم العثماني مع تلاوات أشهر القراء" />

      {/* متابعة الاستماع والقراءة والعلامات: تظهر فقط عند وجودها */}
      <div className="mb-4 flex flex-col gap-2.5 empty:hidden">
        <LastPlayedCard />
        <BookmarksCard />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
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

      {/* التنزيل للاستخدام دون إنترنت: مطوي حتى لا يزاحم القائمة */}
      <details className="group mb-5 rounded-2xl bg-card shadow-sm ring-1 ring-border">
        <summary className="flex cursor-pointer list-none items-center gap-3 p-3.5 [&::-webkit-details-marker]:hidden">
          <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Download className="size-4" aria-hidden="true" />
          </span>
          <span className="flex-1 text-sm font-bold">{'حفظ القرآن للقراءة دون إنترنت'}</span>
          <ChevronDown
            className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="px-3.5 pb-3.5">
          <DownloadAll />
        </div>
      </details>

      <SurahList surahs={surahs} />
    </>
  )
}
