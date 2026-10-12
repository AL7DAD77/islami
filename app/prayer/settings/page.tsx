import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { PrayerSettings } from '@/components/prayer/prayer-settings'

export const metadata: Metadata = { title: 'إعدادات الصلاة | إسلامي' }

export default function PrayerSettingsPage() {
  return (
    <>
      <PageHeader
        title="إعدادات الصلاة"
        subtitle="الموقع والإشعارات وطريقة الحساب"
        backHref="/prayer"
      />
      <PrayerSettings />
    </>
  )
}
