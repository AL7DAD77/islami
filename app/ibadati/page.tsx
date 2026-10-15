import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { IbadatiView } from '@/components/ibadati/ibadati-view'

export const metadata: Metadata = { title: 'عباداتي | إسلامي' }

export default function IbadatiPage() {
  return (
    <>
      <PageHeader title="عباداتي" subtitle="متابعة يومية لأعمالك، تبدأ من جديد كل يوم" backHref="/more" />
      <IbadatiView />
    </>
  )
}
