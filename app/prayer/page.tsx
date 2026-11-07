'use client'

import Link from 'next/link'
import { CalendarDays, CalendarRange, Volume2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { NextPrayerCard } from '@/components/prayer/next-prayer-card'
import { PrayerTimesList } from '@/components/prayer/prayer-times-list'
import { NotificationPrompt } from '@/components/prayer/notification-prompt'
import { LocationBanner } from '@/components/prayer/location-banner'
import { TileLink } from '@/components/ui-kit'
import { IbadatiCard } from '@/components/prayer/ibadati-card'
import { SearchButton } from '@/components/search-button'
import { useLanguage } from '@/lib/language-context'

export default function PrayerPage() {
  const { dict } = useLanguage()

  return (
    <>
      <PageHeader
        title={dict.prayerPage.title}
        subtitle={dict.prayerPage.subtitle}
        action={
          <>
            <SearchButton />
            <Link
              href="/calendar"
              aria-label={dict.prayerPage.calendarLabel}
              className="flex size-10 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border hover:bg-muted"
            >
              <CalendarDays className="size-5" aria-hidden="true" />
            </Link>
          </>
        }
      />

      <LocationBanner />

      <div className="flex flex-col gap-4">
        <NextPrayerCard />
        <IbadatiCard />
        <PrayerTimesList />

        <nav aria-label={dict.prayerPage.title} className="grid grid-cols-2 gap-3">
          <TileLink layout="stack" href="/prayer/adhan" icon={<Volume2 className="size-5" />} title={dict.prayerPage.adhanSound} />
          <TileLink layout="stack" href="/prayer/week" icon={<CalendarRange className="size-5" />} title={dict.prayerPage.weekTimes} />
        </nav>
      </div>

      <NotificationPrompt />
    </>
  )
}