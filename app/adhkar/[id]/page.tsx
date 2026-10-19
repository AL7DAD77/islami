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
  return c ? { title: `${c.title} | إسلامي` } : {}
}

export default async function AdhkarCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const category = getCategory(id)
  if (!category) notFound()

  // القسم التالي بحسب ترتيب الأقسام، للانتقال إليه تلقائياً بعد إتمام هذا القسم
  // ولا ينتقل من الأقسام المنتقاة إلى حصن المسلم ولا العكس: لكل منهما تسلسله
  const index = ADHKAR.findIndex((c) => c.id === category.id)
  const candidate = index >= 0 && index < ADHKAR.length - 1 ? ADHKAR[index + 1] : null
  const isHisn = category.group === 'hisn'
  const next = candidate && (candidate.group === 'hisn') === isHisn ? candidate : null

  return (
    <>
      <PageHeader title={category.title} subtitle={category.description} backHref={isHisn ? '/adhkar/hisn' : '/adhkar'} />
      <DhikrList
        key={category.id}
        items={category.items}
        nextHref={next ? `/adhkar/${next.id}` : undefined}
        nextTitle={next?.title}
      />
    </>
  )
}
