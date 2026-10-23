import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { Suspense } from 'react'
import { PageHeader } from '@/components/page-header'
import { SectionTitle } from '@/components/ui-kit'
import { SearchButton } from '@/components/search-button'
import { ADHKAR, ADHKAR_GROUPS } from '@/lib/adhkar'
import { toArabicNumber } from '@/lib/quran'

export const metadata: Metadata = { title: 'الأذكار والأدعية | إسلامي' }

export default function AdhkarPage() {
  const hisn = ADHKAR.filter((c) => c.group === 'hisn')
  const hisnItems = hisn.reduce((sum, c) => sum + c.items.length, 0)
  const ruqyah = ADHKAR.find((c) => c.id === 'ruqyah')
  
  const groups = ADHKAR_GROUPS.filter(
    (g) => (g.id !== 'ruqyah' || !ruqyah) && ADHKAR.some((c) => c.group === g.id),
  )

  return (
    <div dir="rtl">
      <PageHeader 
        title="الأذكار والأدعية" 
        subtitle="من القرآن والسنة الصحيحة مع ذكر المصدر" 
        action={
          <Suspense fallback={<div className="size-10" />}>
            <SearchButton />
          </Suspense>
        } 
      />

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

      <div className={`mb-5 grid gap-2.5 ${ruqyah ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <Link
          href="/adhkar/hisn" // تم إرجاع الرابط الأصلي
          className="flex items-center gap-2.5 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-xl text-accent-foreground">
            📚
          </span>
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 block text-sm font-bold leading-snug">حصن المسلم كاملاً</span>
            <span className="line-clamp-2 block text-[11px] leading-snug text-muted-foreground">
              {toArabicNumber(hisn.length)} باباً - {toArabicNumber(hisnItems)} ذكراً
            </span>
          </span>
        </Link>

        {ruqyah && (
          <Link
            href={`/adhkar/${ruqyah.id}`}
            className="flex items-center gap-2.5 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-xl text-accent-foreground">
              🛡️
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 block text-sm font-bold leading-snug">{ruqyah.title}</span>
              <span className="line-clamp-2 block text-[11px] leading-snug text-muted-foreground">
                من القرآن والسنة - {toArabicNumber(ruqyah.items.length)} ذكراً
              </span>
            </span>
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-5">
        {groups.map((g) => (
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
    </div>
  )
}