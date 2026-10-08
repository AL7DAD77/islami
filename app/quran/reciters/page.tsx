import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { RecitersBrowser } from '@/components/quran/reciters-browser'
import { getReciters } from '@/lib/quran'

export const metadata: Metadata = { title: 'القراء والتلاوات | نور' }

export default async function RecitersPage() {
  const reciters = await getReciters()
  return (
    <>
      <PageHeader
        title="القراء والتلاوات"
        subtitle="اختر القارئ والرواية ثم افتح أي سورة للاستماع"
        backHref="/quran"
      />
      <RecitersBrowser reciters={reciters} />
      <p className="mt-6 text-center text-xs text-muted-foreground">{'مصدر التلاوات: mp3quran.net (مصدر مفتوح للاستخدام)'}</p>
    </>
  )
}
