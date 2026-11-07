'use client'

import { PageHeader } from '@/components/page-header'
import { LessonList } from '@/components/learn/lesson-list'
import { MUSLIM_GUIDE } from '@/lib/learn'
import { useLanguage } from '@/lib/language-context'

export default function GuidePage() {
  const { dict } = useLanguage()

  return (
    <>
      <PageHeader 
        title={dict.guidePage.title} 
        subtitle={dict.guidePage.subtitle} 
        backHref="/more" 
      />
      <LessonList lessons={MUSLIM_GUIDE} />
    </>
  )
}