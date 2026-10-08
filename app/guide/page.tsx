import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { LessonList } from '@/components/learn/lesson-list'
import { MUSLIM_GUIDE } from '@/lib/learn'

export const metadata: Metadata = { title: 'دليل المسلم | نور' }

export default function GuidePage() {
  return (
    <>
      <PageHeader title="دليل المسلم" subtitle="الوضوء، الصلاة، الطهارة، الصيام، الزكاة وأحكام أخرى" backHref="/more" />
      <LessonList lessons={MUSLIM_GUIDE} />
    </>
  )
}
