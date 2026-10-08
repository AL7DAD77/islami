'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { BookMarked, Search } from 'lucide-react'
import type { SurahMeta } from '@/lib/quran'
import { toArabicNumber } from '@/lib/quran'
import { useHydrated, useSettings } from '@/lib/settings'

const normalize = (s: string) =>
  s
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[ٱأإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/^سوره\s*/, '')
    .trim()

export function SurahList({ surahs }: { surahs: SurahMeta[] }) {
  const [query, setQuery] = useState('')
  const [settings] = useSettings()
  const hydrated = useHydrated()

  const filtered = useMemo(() => {
    const q = normalize(query)
    if (!q) return surahs
    return surahs.filter(
      (s) => normalize(s.name).includes(q) || String(s.number) === query.trim() || s.englishName.toLowerCase().includes(query.toLowerCase()),
    )
  }, [query, surahs])

  return (
    <div className="flex flex-col gap-4">
      {hydrated && settings.lastRead && (
        <Link
          href={`/quran/${settings.lastRead.surah}`}
          className="flex items-center gap-3 rounded-2xl bg-accent p-4 text-accent-foreground"
        >
          <BookMarked className="size-5" aria-hidden="true" />
          <span className="flex-1 text-sm">
            {'متابعة القراءة: '}
            <span className="font-bold">{settings.lastRead.name}</span>
          </span>
        </Link>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <label htmlFor="surah-search" className="sr-only">
          {'ابحث عن سورة'}
        </label>
        <input
          id="surah-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث باسم السورة أو رقمها"
          className="w-full rounded-2xl border bg-card py-3 pl-4 pr-11 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {filtered.map((s) => (
          <li key={s.number}>
            <Link
              href={`/quran/${s.number}`}
              className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
            >
              <span className="flex size-10 shrink-0 rotate-45 items-center justify-center rounded-lg border-2 border-gold/60">
                <span className="-rotate-45 text-sm font-bold text-primary">{toArabicNumber(s.number)}</span>
              </span>
              <span className="flex-1">
                <span className="block font-quran text-xl leading-snug">{s.name}</span>
                <span className="text-xs text-muted-foreground">
                  {`${s.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} · ${toArabicNumber(s.numberOfAyahs)} آية`}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && <p className="py-8 text-center text-muted-foreground">{'لا توجد نتائج'}</p>}
    </div>
  )
}
