import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { ADHKAR, ADHKAR_GROUPS } from '@/lib/adhkar'
import { toArabicNumber } from '@/lib/quran'

export const metadata: Metadata = { title: 'الأذكار والأدعية | نور' }

export default function AdhkarPage() {
  return (
    <>
      <PageHeader title="الأذكار والأدعية" subtitle="من حصن المسلم والكتاب والسنة الصحيحة مع ذكر المصدر" />
      <div className="flex flex-col gap-6">
        {ADHKAR_GROUPS.map((g) => (
          <section key={g.id} aria-labelledby={`g-${g.id}`}>
            <h2 id={`g-${g.id}`} className="mb-3 text-sm font-bold text-muted-foreground">
              {g.title}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {ADHKAR.filter((c) => c.group === g.id).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/adhkar/${c.id}`}
                    className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-foreground">
                      {toArabicNumber(c.items.length)}
                    </span>
                    <span className="flex-1">
                      <span className="block font-bold">{c.title}</span>
                      <span className="text-xs text-muted-foreground">{c.description}</span>
                    </span>
                    <ChevronLeft className="size-4 text-muted-foreground" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
        {'الأذكار مأخوذة من القرآن الكريم وكتاب حصن المسلم وكتب السنة، مع الاقتصار على ما صح أو حسن إسناده بحسب تخريج أهل العلم.'}
      </p>
    </>
  )
}
