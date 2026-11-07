'use client'

import { PageHeader } from '@/components/page-header'
import { PrayerSettings } from '@/components/prayer/prayer-settings'
import { useLanguage } from '@/lib/language-context'

export default function PrayerSettingsPage() {
  const { dict } = useLanguage()

  return (
    <>
      <PageHeader
        title={dict.settings.prayer.title}
        subtitle={dict.settings.prayer.subtitle}
        backHref="/prayer"
      />
      <PrayerSettings />
    </>
  )
}