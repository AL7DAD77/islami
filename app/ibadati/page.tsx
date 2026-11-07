'use client'

import { PageHeader } from '@/components/page-header'
import { IbadatiView } from '@/components/ibadati/ibadati-view'
import { useLanguage } from '@/lib/language-context'

export default function IbadatiPage() {
  const { dict } = useLanguage()

  return (
    <>
      <PageHeader 
        title={dict.ibadatiPage.title} 
        subtitle={dict.ibadatiPage.subtitle} 
        backHref="/more" 
      />
      <IbadatiView />
    </>
  )
}