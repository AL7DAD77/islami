'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

const AYAHS = [
  { text: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', source: 'سورة الرعد - الآية ٢٨' },
  { text: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ', source: 'سورة البقرة - الآية ١٥٢' },
  { text: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ', source: 'سورة البقرة - الآية ١٨٦' },
  { text: 'إِنَّ اللَّهَ مَعَ الَّذِينَ اتَّقَوا وَّالَّذِينَ هُم مُّحْسِنُونَ', source: 'سورة النحل - الآية ١٢٨' },
  { text: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا', source: 'سورة الطلاق - الآية ٢' },
  { text: 'وَاصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ', source: 'سورة هود - الآية ١١٥' },
  { text: 'أَلَمْ يَعْلَم بِأَنَّ اللَّهَ يَرَىٰ', source: 'سورة العلق - الآية ١٤' },
  { text: 'وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ', source: 'سورة غافر - الآية ٦٠' },
  { text: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', source: 'سورة الشرح - الآية ٦' },
  { text: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ الْوَهَّابُ', source: 'سورة آل عمران - الآية ٨' },
  { text: 'وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ', source: 'سورة البقرة - الآية ٢١٦' },
  { text: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', source: 'سورة البقرة - الآية ١٥٣' }
]

export function AyahCard() {
  const [ayah, setAyah] = useState(AYAHS[0])
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // اختيار آية عشوائية عند تحميل الصفحة
    const randomIndex = Math.floor(Math.random() * AYAHS.length)
    setAyah(AYAHS[randomIndex])
    
    // تأثير ظهور ناعم
    setIsAnimating(true)
    const timer = setTimeout(() => setIsAnimating(false), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#fdfbf7] p-6 text-center shadow-sm ring-1 ring-[#b89965]/30">
      <div className="absolute right-0 top-0 -mr-4 -mt-4 size-32 rounded-full bg-[#d4af37]/5 blur-xl"></div>
      <div className="absolute left-0 bottom-0 -ml-4 -mb-4 size-32 rounded-full bg-[#0a1f1a]/5 blur-xl"></div>
      
      <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-[#d4af37]/10 text-[#b89965]">
        <Sparkles className="size-5" />
      </div>
      
      <div className={`transition-all duration-700 ease-in-out ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
        <p className="font-quran text-xl leading-loose text-[#0a1f1a] font-bold">
          {ayah.text}
        </p>
        <p className="mt-3 text-xs font-medium text-[#b89965]">
          {ayah.source}
        </p>
      </div>
    </div>
  )
}