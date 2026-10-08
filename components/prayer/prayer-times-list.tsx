'use client'

import { Bell, BellOff, Sunrise } from 'lucide-react'
import { useHydrated, useSettings, type PrayerKey } from '@/lib/settings'
import { PRAYER_NAMES, formatTime, getNextPrayer, getPrayerTimes } from '@/lib/prayer'
import { cn } from '@/lib/utils'

const ROWS: (PrayerKey | 'sunrise')[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

export function PrayerTimesList() {
  const [settings, update] = useSettings()
  const hydrated = useHydrated()
  if (!hydrated) return <div className="h-80 animate-pulse rounded-3xl bg-card" aria-hidden="true" />

  const times = getPrayerTimes(settings)
  const next = getNextPrayer(settings)

  return (
    <ul className="divide-y overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-border">
      {ROWS.map((key) => {
        const isNext = key === next.key && next.time.toDateString() === new Date().toDateString()
        const enabled = key !== 'sunrise' && settings.adhanEnabled[key]
        return (
          <li
            key={key}
            className={cn('flex items-center gap-3 px-5 py-4', isNext && 'bg-secondary')}
          >
            <span className={cn('flex-1 text-lg', isNext ? 'font-bold text-primary' : 'font-medium')}>
              {PRAYER_NAMES[key]}
            </span>
            <span className={cn('text-lg tabular-nums', isNext && 'font-bold text-primary')}>
              {formatTime(times[key])}
            </span>
            {key === 'sunrise' ? (
              <span className="flex size-10 items-center justify-center text-muted-foreground">
                <Sunrise className="size-5" aria-hidden="true" />
              </span>
            ) : (
              <button
                type="button"
                onClick={() =>
                  update((s) => ({ adhanEnabled: { ...s.adhanEnabled, [key]: !s.adhanEnabled[key] } }))
                }
                aria-pressed={enabled}
                aria-label={`${enabled ? 'إيقاف' : 'تفعيل'} أذان ${PRAYER_NAMES[key]}`}
                className={cn(
                  'flex size-10 items-center justify-center rounded-full transition-colors',
                  enabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                {enabled ? <Bell className="size-4.5" /> : <BellOff className="size-4.5" />}
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
