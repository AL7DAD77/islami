import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { AdhanSettings } from '@/components/prayer/adhan-settings'

export const metadata: Metadata = { title: 'صوت الأذان | إسلامي' }

export default function AdhanSettingsPage() {
  return (
    <>
      <PageHeader title="صوت الأذان" subtitle="اختر الصوت المفضل لديك" backHref="/prayer" />
      <AdhanSettings />
    </>
  )
}