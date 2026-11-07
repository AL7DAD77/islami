'use client'

import { PageHeader } from '@/components/page-header'
import { SearchView } from '@/components/search/search-view'
import { useLanguage } from '@/lib/language-context'

export default function SearchPage() {
  const { dict } = useLanguage()

  return (
    <>
      <PageHeader 
        title={dict.searchPage.title} 
        subtitle={dict.searchPage.subtitle} 
        backHref="/more" 
      />
      <SearchView />
    </>
  )
}