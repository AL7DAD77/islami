import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { HijriCalendar } from '@/components/prayer/hijri-calendar'

export const metadata: Metadata = { title: 'التقويم الهجري | نور' }

export default function CalendarPage() {
  return (
    <>
      <PageHeader title="التقويم الهجري" subtitle="التاريخ الهجري والميلادي والمناسبات" backHref="/prayer" />
      <HijriCalendar />
    </>
  )
}
