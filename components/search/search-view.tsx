'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Loader2 } from 'lucide-react'
import { isQueryReady, queryWords, searchAll, snippet, type SearchEntry } from '@/lib/search-index'
import { useLanguage } from '@/lib/language-context'

const DEBOUNCE_MS = 350

export function SearchView() {
  const { dict } = useLanguage()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [results, setResults] = useState<SearchEntry[]>([])
  const [loading, setLoading] = useState(false)

  // تأخير البحث حتى يتوقف المستخدم عن الكتابة
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query), DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [query])

  // البحث فقط عند جاهزية الاستعلام (كلمتان أو كلمة من 3 أحرف)
  useEffect(() => {
    let cancelled = false

    if (!isQueryReady(debounced)) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    searchAll(debounced)
      .then((list) => {
        if (!cancelled) setResults(list)
      })
      .catch(() => {
        if (!cancelled) setResults([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debounced])

  const words = useMemo(() => queryWords(debounced), [debounced])
  const ayahs = useMemo(() => results.filter((r) => r.type === 'ayah'), [results])
  const hadiths = useMemo(() => results.filter((r) => r.type === 'hadith'), [results])
  const others = useMemo(() => results.filter((r) => r.type === 'other'), [results])

  const renderGroup = (title: string, items: SearchEntry[]) => {
    if (items.length === 0) return null

    return (
      <section className="flex flex-col gap-2">
        <h3 className="px-1 text-xs font-bold text-muted-foreground">
          {`${title} (${items.length})`}
        </h3>
        <ul className="flex flex-col gap-2">
          {items.map((r, i) => (
            <li key={`${r.href}-${i}`}>
              <Link
                href={r.href}
                className="block rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border hover:bg-secondary"
              >
                <p className="text-[11px] font-bold text-primary">{r.kind}</p>
                <p className="mt-1 line-clamp-2 text-sm font-bold">{r.title}</p>
                <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                  {snippet(r.body, words)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  const hasQuery = isQueryReady(debounced)

  return (
    <div className="flex flex-col gap-4">
      <label className="relative block">
        <span className="sr-only">{dict.searchPage.srLabel}</span>
        <Search
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.searchPage.placeholder}
          className="w-full rounded-2xl border border-border bg-card py-3 pl-4 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </label>

      {loading && (
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          <span>{'جارٍ البحث...'}</span>
        </div>
      )}

      {!loading && hasQuery && results.length === 0 && (
        <p className="px-1 text-sm text-muted-foreground">{dict.searchPage.noResults}</p>
      )}

      {renderGroup('الآيات', ayahs)}
      {renderGroup('الأحاديث', hadiths)}
      {renderGroup('نتائج أخرى', others)}
    </div>
  )
}