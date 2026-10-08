import Link from 'next/link'
import { CalendarDays, Volume2 } from 'lucide-react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { NextPrayerCard } from '@/components/prayer/next-prayer-card'
import { PrayerTimesList } from '@/components/prayer/prayer-times-list'
import { PrayerSettings } from '@/components/prayer/prayer-settings'
export const metadata: Metadata = { title: 'مواقيت الصلاة | إسلامي' }
import { NotificationPrompt } from '@/components/prayer/notification-prompt'

export default function PrayerPage() {
  return (
    <>
      <PageHeader
        title="مواقيت الصلاة"
        subtitle="حسب موقعك الحالي"
        action={
          <Link
            href="/calendar"
            className="flex items-center gap-1.5 rounded-full bg-card px-3 py-2 text-sm shadow-sm ring-1 ring-border hover:bg-muted"
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            {'التقويم الهجري'}
          </Link>
        }
      />
      <div className="flex flex-col gap-4">
  <NextPrayerCard />
  <PrayerTimesList />
  <PrayerSettings />   {/* ← أضف هذا */}
</div>

      <div className="mt-4 flex flex-col gap-3">
        <Link
          href="/prayer/adhan"
          className="flex items-center justify-between rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-700 p-4 text-white shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Volume2 className="size-5" />
            <div>
              <p className="font-bold">صوت الأذان</p>
              <p className="text-xs opacity-80">اختر الصوت المفضل لديك</p>
            </div>
          </div>
          <span className="text-white/70">←</span>
        </Link>

        <Link
          href="/prayer/week"
          className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border hover:bg-secondary"
        >
          <span className="font-bold">مواقيت الأسبوع</span>
          <span className="text-sm text-muted-foreground">٧ أيام قادمة ←</span>
        </Link>
      </div>
      <NotificationPrompt/>
    </>
  )
}