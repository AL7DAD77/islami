import { Suspense } from 'react'
import { MushafViewer } from '@/components/mushaf/mushaf-viewer'

// 1. إجبار Next.js على إنشاء مسارات لجميع السور (من 1 إلى 114) للتصدير الثابت
export function generateStaticParams() {
  return Array.from({ length: 114 }, (_, i) => ({
    id: String(i + 1),
  }))
}

// 2. الصفحة (Server Component) - تقرأ الـ id من الرابط وتمرره للعارض
export default async function SurahPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const surah = Number(resolvedParams.id)

  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    return <div className="flex h-screen items-center justify-center text-xl">السورة غير موجودة</div>
  }

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center font-sans text-xl">جاري التحميل...</div>}>
      <MushafViewer initialSurah={surah} />
    </Suspense>
  )
}