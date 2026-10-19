import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { RecitersBrowser } from '@/components/quran/reciters-browser'
import { getReciters, type Reciter } from '@/lib/quran'

export const metadata: Metadata = { title: 'القراء والتلاوات | إسلامي' }

export default async function RecitersPage() {
  // تحديد نوع المصفوفة بشكل صريح لمنع خطأ TypeScript
  let reciters: Reciter[] = []
  
  try {
    reciters = await getReciters()
  } catch (error) {
    console.error('فشل جلب قائمة القراء:', error)
  }

  return (
    <div className="min-h-screen bg-[#1c1510] text-[#fbf8f0] p-4 font-sans" dir="rtl">
      <PageHeader
        title="القراء والتلاوات"
        subtitle="اختر القارئ والرواية ثم افتح أي سورة للاستماع"
        backHref="/quran"
      />

      <main className="max-w-4xl mx-auto mt-4 text-slate-900">
        {reciters && reciters.length > 0 ? (
          <RecitersBrowser reciters={reciters} />
        ) : (
          <div className="text-center py-12 bg-[#241b16] rounded-xl border border-[#8c6b2b]/40">
            <p className="text-amber-200 text-lg">جاري تحميل قائمة القراء والتلاوات...</p>
            <p className="text-xs text-stone-400 mt-2">يرجى التأكد من الاتصال بالإنترنت إذا استغرق التحميل وقتاً طويلاً.</p>
          </div>
        )}
      </main>

      <p className="mt-6 text-center text-xs text-stone-400">
        {'مصدر التلاوات: mp3quran.net (مصدر مفتوح للاستخدام)'}
      </p>
    </div>
  )
}