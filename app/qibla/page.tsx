import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { QiblaCompass } from '@/components/qibla-compass'

export const metadata: Metadata = { title: 'اتجاه القبلة | إسلامي' }

export default function QiblaPage() {
  return (
    <div className="min-h-[100dvh] bg-[#f7f3ea] pb-24" dir="rtl">
      <div className="container mx-auto px-4 py-4 max-w-4xl space-y-6">
        
        <PageHeader 
          title="اتجاه القبلة" 
          subtitle="بوصلة دقيقة حسب موقعك" 
          backHref="/more" 
        />

        {/* ============ آية القبلة (تصميم فخم) ============ */}
        <div className="relative overflow-hidden rounded-3xl bg-[#fdfbf7] p-5 text-center shadow-sm ring-1 ring-[#b89965]/30">
          <div className="absolute right-0 top-0 -mr-4 -mt-4 size-32 rounded-full bg-[#d4af37]/5 blur-xl"></div>
          <div className="absolute left-0 bottom-0 -ml-4 -mb-4 size-32 rounded-full bg-[#0a1f1a]/5 blur-xl"></div>
          
          <p className="font-quran text-lg md:text-xl leading-loose text-[#0a1f1a] font-bold px-2">
            قَدْ نَرَىٰ تَقَلُّبَ وَجْهِكَ فِي السَّمَاءِ ۖ فَلَنُوَلِّيَنَّكَ قِبْلَةً تَرْضَاهَا ۚ فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ
          </p>
          <p className="mt-3 text-[11px] font-medium text-[#b89965]">
            سورة البقرة - الآية ١٤٤
          </p>
        </div>

        {/* مكون البوصلة */}
        <QiblaCompass />

      </div>
    </div>
  )
}