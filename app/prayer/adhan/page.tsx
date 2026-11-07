'use client'

import { PageHeader } from '@/components/page-header'
import { AdhanSettings } from '@/components/prayer/adhan-settings'
import { useLanguage } from '@/lib/language-context'

export default function AdhanSettingsPage() {
  const { dict } = useLanguage()

  return (
    <>
      <PageHeader 
        title={dict.adhanSettingsPage.title} 
        subtitle={dict.adhanSettingsPage.subtitle} 
        backHref="/prayer" 
      />
      <AdhanSettings />
    </>
  )
}