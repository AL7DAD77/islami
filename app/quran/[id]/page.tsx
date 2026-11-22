import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { MushafViewer } from '@/components/mushaf/mushaf-viewer'

export const dynamicParams = false

export function generateStaticParams() {
  return Array.from({ length: 114 }, (_, i) => ({
    id: String(i + 1),
  }))
}

export default async function SurahPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const surah = Number(resolvedParams.id)

  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    notFound()
  }

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center font-sans text-xl">جاري التحميل...</div>}>
      <MushafViewer initialSurah={surah} />
    </Suspense>
  )
}
