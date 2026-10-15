'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ClipboardCheck } from 'lucide-react'
import { IBADATI_KEY, dayKey, normalizeState, progress } from '@/lib/ibadati'

/** بطاقة مختصرة في صفحة الصلاة تفتح «عباداتي» وتعرض نسبة إنجاز اليوم */
export function IbadatiCard() {
  const [percent, setPercent] = useState<number | null>(null)

  useEffect(() => {
    let raw: unknown = null
    try {
      raw = JSON.parse(localStorage.getItem(IBADATI_KEY) || 'null')
    } catch {}
    setPercent(progress(normalizeState(raw, dayKey())).percent)
  }, [])

  return (
    <Link href="/ibadati" className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-sm ring-1 ring-border hover:bg-secondary">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <ClipboardCheck className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{'عباداتي'}</span>
        <span className="block text-[11px] text-muted-foreground">{percent === null ? 'متابعة يومية' : `إنجاز اليوم ${percent}%`}</span>
      </span>
      <ChevronLeft className="size-4 opacity-60" aria-hidden="true" />
    </Link>
  )
}
