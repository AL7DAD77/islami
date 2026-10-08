import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { DhikrList } from '@/components/adhkar/dhikr-list'
import { ADHKAR, getCategory } from '@/lib/adhkar'

export function generateStaticParams() {
  return ADHKAR.map((c) => ({ id: c.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const c = getCategory(id)
  return c ? { title: `${c.title} | نور` } : {}
}

export default async function AdhkarCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const category = getCategory(id)
  if (!category) notFound()
  return (
    <>
      <PageHeader title={category.title} subtitle={category.description} backHref="/adhkar" />
      <DhikrList items={category.items} />
    </>
  )
}
