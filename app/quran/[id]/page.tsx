'use client'

import { notFound, useParams, useSearchParams } from 'next/navigation'
import { MushafViewer } from '@/components/mushaf/mushaf-viewer'

/**
 * صفحة السورة: تفتح المصحف بصفحاته على أول صفحة في السورة (أو على آية محددة عبر ?ayah=).
 * كل روابط /quran/N في التطبيق (قائمة السور، آخر تلاوة، العلامات المرجعية، قسم الأطفال) تصل هنا.
 */
export default function SurahPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()

  const surah = Number(params.id)
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) notFound()

  const ayah = Number(searchParams.get('ayah')) || undefined

  return <MushafViewer key={`${surah}:${ayah ?? 0}`} initialSurah={surah} initialAyah={ayah} />
}
