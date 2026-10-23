import Link from 'next/link'
import type { Metadata } from 'next'
import { Suspense } from 'react' // تمت الإضافة
import { PageHeader } from '@/components/page-header'
import { SearchButton } from '@/components/search-button'
import { ADHKAR } from '@/lib/adhkar'
import { toArabicNumber } from '@/lib/quran'

export const metadata: Metadata = { title: 'حصن المسلم | إسلامي' }

export default function HisnPage() {
  const chapters = ADHKAR.filter((c) => c.group === 'hisn')
  const total = chapters.reduce((sum, c) => sum + c.items.length, 0)

  return (
    <div dir="rtl">
      <PageHeader
        title="حصن المسلم"
        subtitle={`${toArabicNumber(chapters.length)} باباً - ${toArabicNumber(total)} ذكراً`}
        backHref="/adhkar"
        action={
          <Suspense fallback={<div className="size-10" />}>
            <SearchButton />
          </Suspense>
        }
      />

      <ul className="grid grid-cols-2 gap-2.5 mt-4">
        {chapters.map((c) => (
          <li key={c.id}>
            <Link
              href={`/adhkar/${c.id}`}
              className="flex h-full items-center gap-2.5 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-foreground">
                {toArabicNumber(c.items.length)}
              </span>
              <span className="line-clamp-3 min-w-0 flex-1 text-sm font-bold leading-snug">{c.title}</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
        النصوص من كتاب «حصن المسلم من أذكار الكتاب والسنة» لسعيد بن علي بن وهف القحطاني. لم يُضَف تخريج الأحاديث في هذا
        القسم، فيُنصح بمراجعة الأذكار مع أهل العلم. تفاصيل المصدر في «المزيد» ← «حول التطبيق».
      </p>
    </div>
  )
}