import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { SectionTitle } from '@/components/ui-kit'
import { ADHKAR, ADHKAR_GROUPS } from '@/lib/adhkar'
import { toArabicNumber } from '@/lib/quran'

export const metadata: Metadata = { title: 'الأذكار والأدعية | نور' }

export default function AdhkarPage() {
  return (
    <>
      <PageHeader title="الأذكار والأدعية" subtitle="من القرآن والسنة الصحيحة مع ذكر المصدر" />

      <Link
        href="/tasbih"
        className="mb-5 flex items-center gap-3 rounded-2xl bg-primary p-3.5 text-primary-foreground shadow-sm"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 text-2xl">
          📿
        </span>
        <span className="flex-1">
          <span className="block font-bold">المسبحة الإلكترونية</span>
          <span className="block text-[11px] opacity-80">سبّح مع انتقال تلقائي بين الأذكار</span>
        </span>
        <ChevronLeft className="size-4 opacity-70" aria-hidden="true" />
      </Link>

      <div className="flex flex-col gap-5">
        {ADHKAR_GROUPS.map((g) => (
          <section key={g.id} aria-labelledby={`g-${g.id}`}>
            <SectionTitle>
              <span id={`g-${g.id}`}>{g.title}</span>
            </SectionTitle>
            <ul className="grid grid-cols-2 gap-2.5">
              {ADHKAR.filter((c) => c.group === g.id).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/adhkar/${c.id}`}
                    className="flex h-full items-center gap-2.5 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-foreground">
                      {toArabicNumber(c.items.length)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block text-sm font-bold leading-snug">{c.title}</span>
                      <span className="line-clamp-1 block text-[11px] text-muted-foreground">{c.description}</span>
                    </span>
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
