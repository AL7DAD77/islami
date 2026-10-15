'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import {
  IBADATI_ITEMS,
  IBADATI_KEY,
  challengeFor,
  dayKey,
  normalizeState,
  progress,
  toggleItem,
  type IbadatiKey,
  type IbadatiState,
} from '@/lib/ibadati'

const GROUPS: { id: 'prayer' | 'dhikr' | 'quran'; title: string }[] = [
  { id: 'prayer', title: 'الصلوات' },
  { id: 'dhikr', title: 'الأذكار' },
  { id: 'quran', title: 'القرآن' },
]

export function IbadatiView() {
  const [state, setState] = useState<IbadatiState | null>(null)

  useEffect(() => {
    const today = dayKey()
    let raw: unknown = null
    try {
      raw = JSON.parse(localStorage.getItem(IBADATI_KEY) || 'null')
    } catch {}
    setState(normalizeState(raw, today))
  }, [])

  // كل تغيير يُحسب من أحدث حالة (وليس من نسخة قديمة) ويُحفظ بعد كل تحديث
  const tick = (key: IbadatiKey) => {
    setState((prev) => (prev ? toggleItem(prev, key) : prev))
  }

  useEffect(() => {
    if (!state) return
    try {
      localStorage.setItem(IBADATI_KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  if (!state) return <div className="h-64 animate-pulse rounded-2xl bg-card" aria-hidden="true" />

  const p = progress(state)
  const challenge = challengeFor(state.date)

  return (
    <div className="flex flex-col gap-5">
      {/* ============ التقدم اليومي ============ */}
      <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">{'إنجاز اليوم'}</p>
          <p className="text-sm font-bold text-primary">{`${p.count} من ${p.total}`}</p>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={p.total} aria-valuenow={p.count}>
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${p.percent}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">{'تُحفظ على جهازك فقط، وتبدأ القائمة من جديد كل يوم.'}</p>
      </div>

      {/* ============ القوائم ============ */}
      {GROUPS.map((g) => (
        <section key={g.id} aria-labelledby={`ib-${g.id}`}>
          <h2 id={`ib-${g.id}`} className="mb-2 px-1 text-sm font-bold text-muted-foreground">
            {g.title}
          </h2>
          <ul className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
            {IBADATI_ITEMS.filter((i) => i.group === g.id).map((item) => {
              const on = !!state.done[item.key]
              return (
                <li key={item.key} className="border-b border-border last:border-0">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => tick(item.key)}
                    className="flex w-full items-center gap-3 p-3.5 text-right transition hover:bg-secondary"
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-md ring-1 ${
                        on ? 'bg-primary text-primary-foreground ring-primary' : 'bg-background ring-border'
                      }`}
                    >
                      {on && <Check className="size-4" aria-hidden="true" />}
                    </span>
                    <span className={`flex-1 text-sm ${on ? 'text-muted-foreground line-through' : 'font-medium'}`}>{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      {/* ============ تحدي اليوم ============ */}
      <div className="rounded-2xl bg-accent p-4 text-accent-foreground ring-1 ring-border">
        <p className="text-xs font-bold">{'تحدي اليوم'}</p>
        <p className="mt-1 text-sm leading-relaxed">{challenge}</p>
      </div>
    </div>
  )
}
