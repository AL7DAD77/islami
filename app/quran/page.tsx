import type { Metadata } from 'next'
import { getSurahList } from '@/lib/quran'
import { QuranMain } from '@/components/quran/quran-main'

export const metadata: Metadata = { title: 'القرآن الكريم | Islami' }

export default async function QuranPage() {
  const surahs = await getSurahList()
  
  return <QuranMain surahs={surahs} />
}