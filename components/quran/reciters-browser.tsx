'use client'

import { useMemo, useState } from 'react'
import { Check, Search, Star } from 'lucide-react'
import type { Reciter } from '@/lib/quran'
import { toArabicNumber } from '@/lib/quran'
import { useHydrated, useSettings } from '@/lib/settings'
import { cn } from '@/lib/utils'

export function RecitersBrowser({ reciters }: { reciters: Reciter[] }) {
  const [settings, update] = useSettings()
  const hydrated = useHydrated()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim()
    return q ? reciters.filter((r) => r.name.includes(q)) : reciters
  }, [query, reciters])

  const selectedId = hydrated ? (settings.reciterId ?? 123) : null

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <label htmlFor="reciter-search" className="sr-only">
          {'ابحث عن قارئ'}
        </label>
        <input
          id="reciter-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`ابحث بين ${toArabicNumber(reciters.length)} قارئ`}
          className="w-full rounded-2xl border bg-card py-3 pl-4 pr-11 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <ul className="flex flex-col gap-2">
        {filtered.map((r) => {
          const selected = selectedId === r.id
          const expanded = open === r.id
          return (
            <li key={r.id} className={cn('rounded-2xl bg-card shadow-sm ring-1 ring-border', selected && 'ring-2 ring-primary')}>
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : r.id)}
                aria-expanded={expanded}
                className="flex w-full items-center gap-3 p-4 text-right"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-primary">
                  {r.name.replace(/^(الشيخ|شيخ)\s*/, '').charAt(0)}
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    {r.name}
                    {r.featured && <Star className="size-3.5 fill-gold text-gold" aria-label="من أشهر القراء" />}
                  </span>
                  <span className="text-xs text-muted-foreground">{`${toArabicNumber(r.moshaf.length)} تلاوة`}</span>
                </span>
                {selected && <Check className="size-5 text-primary" aria-label="القارئ المختار" />}
              </button>
              {expanded && (
                <ul className="flex flex-col gap-1.5 border-t p-3">
                  {r.moshaf.map((m) => {
                    const active = selected && settings.reciterServer === m.server
                    return (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => update({ reciterId: r.id, reciterServer: m.server })}
                          className={cn(
                            'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-right text-sm',
                            active ? 'bg-primary text-primary-foreground' : 'bg-muted/60 hover:bg-muted',
                          )}
                        >
                          <span>{m.name}</span>
                          <span className="text-xs opacity-75">{`${toArabicNumber(m.surahs.length)} سورة`}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
