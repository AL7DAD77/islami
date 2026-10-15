import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { HADITHS } from '@/lib/hadith'
import { toArabicNumber } from '@/lib/quran'
import Link from 'next/link'

export const metadata: Metadata = { title: 'الحديث النبوي | إسلامي' }

export default function HadithPage() {
  return (
    <>
      <PageHeader title="الحديث النبوي" subtitle="أحاديث مختارة مع بيان مصدرها وشرح موجز" backHref="/more" />

      <Link href="/hadith/ghazawat" className="mb-5 flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border hover:bg-secondary">
        <span className="flex-1 font-bold">{'غزوات النبي ﷺ'}</span>
        <span className="text-xs text-muted-foreground">{'أبرز الغزوات مرتبة زمنياً'}</span>
      </Link>

      <ul className="flex flex-col gap-3">
        {HADITHS.map((h, i) => (
          <li key={h.id} className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {toArabicNumber(i + 1)}
              </span>
            </div>
            <p className="font-quran text-lg leading-loose">{`«${h.text}»`}</p>
            <p className="mt-3 rounded-xl bg-muted/50 p-3 text-sm leading-relaxed">{h.explanation}</p>
            <p className="mt-3 text-xs text-muted-foreground">{`المصدر: ${h.source}`}</p>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
        {'الأحاديث منقولة من مصادرها المذكورة، والشرح موجز للتيسير. للتثبت من درجة الحديث أو فهمه يُرجع إلى أهل العلم.'}
      </p>
    </>
  )
}
