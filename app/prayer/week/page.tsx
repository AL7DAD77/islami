import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { WeekPrayerTimes } from '@/components/prayer/week-prayer-times'

export const metadata: Metadata = { title: 'مواقيت الأسبوع | إسلامي' }

export default function WeekPrayerPage() {
  return (
    <>
      <PageHeader
        title="مواقيت الأسبوع"
        subtitle="مواقيت الصلاة للأيام السبعة القادمة حسب موقعك"
        backHref="/prayer"
      />
      <WeekPrayerTimes />
    </>
  )
}