'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { buildIndex, search } from '@/lib/search-index'
import { useLanguage } from '@/lib/language-context'

export function SearchView() {
  const { dict } = useLanguage()
  const [query, setQuery] = useState('')
  const index = useMemo(() => buildIndex(), [])
  const results = useMemo(() => search(index, query), [index, query])

  return (
    <div className="flex flex-col gap-4">
      <label className="relative block">
        <span className="sr-only">{dict.searchPage.srLabel}</span>
        <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.searchPage.placeholder}
          className="w-full rounded-2xl border border-border bg-card py-3 pl-4 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </label>

      {query.trim().length >= 2 && results.length === 0 && (
        <p className="px-1 text-sm text-muted-foreground">{dict.searchPage.noResults}</p>
      )}

      <ul className="flex flex-col gap-2">
        {results.map((r, i) => (
          <li key={`${r.href}-${i}`}>
            <Link href={r.href} className="block rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border hover:bg-secondary">
              <p className="text-[11px] font-bold text-primary">{r.kind}</p>
              <p className="mt-1 line-clamp-2 text-sm font-bold">{r.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.body}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}