import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { DailyWird } from '@/components/quran/daily-wird'

export const metadata: Metadata = { title: 'الورد اليومي | نور' }

export default function WirdPage() {
  return (
    <>
      <PageHeader title="الورد اليومي" subtitle="اقرأ وردك من المصحف وتابع ختمتك" backHref="/quran" />
      <DailyWird />
    </>
  )
}
