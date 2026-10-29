import Link from 'next/link'
import { CalendarDays, CalendarRange, Volume2 } from 'lucide-react' // تم حذف Settings2
import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { NextPrayerCard } from '@/components/prayer/next-prayer-card'
import { PrayerTimesList } from '@/components/prayer/prayer-times-list'
import { NotificationPrompt } from '@/components/prayer/notification-prompt'
import { LocationBanner } from '@/components/prayer/location-banner'
import { TileLink } from '@/components/ui-kit'
import { IbadatiCard } from '@/components/prayer/ibadati-card'
import { SearchButton } from '@/components/search-button'

export const metadata: Metadata = { title: 'مواقيت الصلاة | إسلامي' }

export default function PrayerPage() {
  return (
    <>
      <PageHeader
        title="مواقيت الصلاة"
        subtitle="حسب موقعك الحالي"
        action={
          <>
            <SearchButton />
            <Link
              href="/calendar"
              aria-label="التقويم الهجري"
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

        {/* ✅ تم حذف زر الإعدادات وتعديل التقسيم لزرين فقط */}
        <nav aria-label="أدوات الصلاة" className="grid grid-cols-2 gap-3">
          <TileLink layout="stack" href="/prayer/adhan" icon={<Volume2 className="size-5" />} title="صوت الأذان" />
          <TileLink layout="stack" href="/prayer/week" icon={<CalendarRange className="size-5" />} title="مواقيت الأسبوع" />
        </nav>
      </div>

      <NotificationPrompt />
    </>
  )
}