import Link from 'next/link'
import { CalendarCheck, Headphones } from 'lucide-react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { SurahList } from '@/components/quran/surah-list'
import { getSurahList } from '@/lib/quran'
import { LastPlayedCard } from '@/components/quran/last-played-card'
import { DownloadAll } from '@/components/quran/download-all'

export const metadata: Metadata = { title: 'القرآن الكريم | إسلامي' }

export default async function QuranPage() {
  const surahs = await getSurahList()
  return (
    <>
      <PageHeader title="القرآن الكريم" subtitle="بالرسم العثماني مع تلاوات أشهر القراء" />

      <div className="mb-4 flex flex-col gap-3">
        <LastPlayedCard />
        <DownloadAll />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Link
          href="/quran/wird"
          className="flex flex-col gap-2 rounded-2xl bg-primary p-4 text-primary-foreground shadow-sm"
        >
          <CalendarCheck className="size-6 text-gold" aria-hidden="true" />
          <span className="font-bold">{'الورد اليومي'}</span>
          <span className="text-xs opacity-80">{'خطة لختم القرآن'}</span>
        </Link>
        <Link
          href="/quran/reciters"
          className="flex flex-col gap-2 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border hover:bg-secondary"
        >
          <Headphones className="size-6 text-primary" aria-hidden="true" />
          <span className="font-bold">{'القراء والتلاوات'}</span>
          <span className="text-xs text-muted-foreground">{'أكثر من ٢٠٠ قارئ'}</span>
        </Link>
      </div>

      <SurahList surahs={surahs} />
    </>
  )
}