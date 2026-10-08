'use client'

import { useState } from 'react'
import { Check, RotateCcw, Share2 } from 'lucide-react'
import type { Dhikr } from '@/lib/adhkar'
import { toArabicNumber } from '@/lib/quran'
import { cn } from '@/lib/utils'

export function DhikrList({ items }: { items: Dhikr[] }) {
  const [counts, setCounts] = useState<number[]>(() => items.map(() => 0))
  const done = counts.filter((c, i) => c >= items[i].count).length

  const tap = (i: number) => {
    setCounts((prev) => prev.map((c, j) => (j === i ? Math.min(c + 1, items[i].count) : c)))
    if ('vibrate' in navigator) navigator.vibrate(15)
  }

  const share = async (d: Dhikr) => {
    const text = `${d.text}\n\n${d.source}`
    if (navigator.share) await navigator.share({ text }).catch(() => {})
    else await navigator.clipboard.writeText(text)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between bg-background/90 px-4 py-2 backdrop-blur">
        <p className="text-sm text-muted-foreground">{`أنجزت ${toArabicNumber(done)} من ${toArabicNumber(items.length)}`}</p>
        <button
          type="button"
          onClick={() => setCounts(items.map(() => 0))}
          className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          {'إعادة'}
        </button>
      </div>
      {items.map((d, i) => {
        const complete = counts[i] >= d.count
        return (
          <article
            key={i}
            className={cn('overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border transition-opacity', complete && 'opacity-60')}
          >
            <button
              type="button"
              onClick={() => tap(i)}
              disabled={complete}
              className="block w-full p-5 text-right"
              aria-label={`اضغط للعد: ${toArabicNumber(counts[i])} من ${toArabicNumber(d.count)}`}
            >
              <p className="font-quran text-xl leading-loose">{d.text}</p>
              {d.note && <p className="mt-3 rounded-xl bg-accent/60 p-3 text-sm leading-relaxed text-accent-foreground">{d.note}</p>}
            </button>
            <div className="flex items-center gap-3 border-t px-5 py-3">
              <p className="flex-1 text-xs text-muted-foreground">{d.source}</p>
              <button type="button" onClick={() => share(d)} className="flex size-8 items-center justify-center rounded-full bg-muted" aria-label="مشاركة الذكر">
                <Share2 className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => tap(i)}
                disabled={complete}
                className={cn(
                  'flex h-9 min-w-16 items-center justify-center gap-1 rounded-full px-3 text-sm font-bold',
                  complete ? 'bg-secondary text-primary' : 'bg-primary text-primary-foreground',
                )}
              >
                {complete ? <Check className="size-4" aria-label="تم" /> : `${toArabicNumber(counts[i])} / ${toArabicNumber(d.count)}`}
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
