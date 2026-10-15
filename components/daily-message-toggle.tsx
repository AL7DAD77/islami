'use client'

import { Sparkles } from 'lucide-react'
import { useSettings } from '@/lib/settings'
import { cn } from '@/lib/utils'

/** بطاقة إظهار «دعاء اليوم»، بنفس شكل بطاقات الشبكة */
export function DailyMessageToggle() {
  const [settings, update] = useSettings()
  const on = settings.showDailyMessage
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => update({ showDailyMessage: !on })}
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-card p-3 py-4 text-center shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <Sparkles className="size-5" aria-hidden="true" />
      </span>
      <span className="line-clamp-2 block text-sm font-bold leading-snug">{'دعاء اليوم'}</span>
      <span className="line-clamp-1 block text-[11px] text-muted-foreground">{on ? 'يظهر مرة يومياً' : 'متوقف'}</span>
      <span className={cn('relative mt-0.5 inline-flex h-4 w-8 items-center rounded-full transition-colors', on ? 'bg-primary' : 'bg-muted-foreground/30')}>
        <span className={cn('inline-block size-3 rounded-full bg-white shadow transition-transform', on ? '-translate-x-4' : '-translate-x-1')} />
      </span>
    </button>
  )
}
