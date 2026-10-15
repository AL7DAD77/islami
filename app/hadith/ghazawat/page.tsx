import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { GHAZAWAT } from '@/lib/ghazawat'
import { toArabicNumber } from '@/lib/quran'

export const metadata: Metadata = { title: 'غزوات النبي ﷺ | إسلامي' }

export default function GhazawatPage() {
  return (
    <>
      <PageHeader title="غزوات النبي ﷺ" subtitle="أبرز الغزوات مرتبة زمنياً" backHref="/hadith" />

      <ol className="flex flex-col gap-3">
        {GHAZAWAT.map((g, i) => (
          <li key={g.id} className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                {toArabicNumber(i + 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{g.name}</p>
                <p className="text-xs text-muted-foreground">{`${g.date} · ${g.place}`}</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed">{g.summary}</p>
            <p className="mt-3 rounded-xl bg-muted/50 p-3 text-sm leading-relaxed">
              <span className="font-bold">{'العبرة: '}</span>
              {g.lesson}
            </p>
          </li>
        ))}
      </ol>

      <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
        {'التواريخ والأحداث وفق المشهور في كتب السيرة، وتختلف بعض الروايات في التفاصيل. للاستزادة يُرجع إلى كتب السيرة المعتمدة.'}
      </p>
    </>
  )
}
