import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { SearchView } from '@/components/search/search-view'

export const metadata: Metadata = { title: 'البحث | إسلامي' }

export default function SearchPage() {
  return (
    <>
      <PageHeader title="البحث" subtitle="في الأذكار والأنبياء والأحاديث والغزوات والسنن" backHref="/more" />
      <SearchView />
    </>
  )
}
