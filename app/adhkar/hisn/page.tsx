'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { PageHeader } from '@/components/page-header'
import { SearchButton } from '@/components/search-button'
import { ADHKAR } from '@/lib/adhkar'
import { toArabicNumber } from '@/lib/quran'
import { useLanguage } from '@/lib/language-context'

export default function HisnPage() {
  const { dict } = useLanguage()
  const chapters = ADHKAR.filter((c) => c.group === 'hisn')
  const total = chapters.reduce((sum, c) => sum + c.items.length, 0)

  return (
    <div>
      <PageHeader
        title={dict.hisnPage.title}
        subtitle={`${toArabicNumber(chapters.length)} ${dict.hisnPage.babCount} - ${toArabicNumber(total)} ${dict.hisnPage.dhikrCount}`}
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
        {dict.hisnPage.footer}
      </p>
    </div>
  )
}