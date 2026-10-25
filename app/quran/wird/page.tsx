'use client'

import { useState, Suspense } from 'react'
import { MushafViewer } from '@/components/mushaf/mushaf-viewer'

export default function DailyWirdPage() {
  const [startPage] = useState<number>(5)
  const [endPage] = useState<number>(8)

  return (
    <div className="min-h-screen bg-[#1c1510] flex flex-col items-center">
      {/* شريط معلومات الورد اليومي العلوي */}
      <div className="w-full max-w-3xl p-4 bg-[#241b16] text-[#fbf8f0] border-b border-[#8c6b2b]/40 flex justify-between items-center font-sans">
        <div>
          <h1 className="text-lg font-bold text-[#d4af37]">الورد اليومي</h1>
          <p className="text-xs text-[#c5a059]">الصفحات {startPage} - {endPage}</p>
        </div>
        <div className="text-xs bg-[#4a361e] px-3 py-1 rounded-full text-[#fbf8f0]">
          اليوم 1 | 4 صفحات
        </div>
      </div>

      {/* عرض الورد باستخدام عارض المصحف مع تغليفه بـ Suspense */}
      <div className="w-full grow flex items-center justify-center">
        <Suspense fallback={<div className="text-white p-10 font-sans">جاري تحميل المصحف...</div>}>
          <MushafViewer initialSurah={2} />
        </Suspense>
      </div>
    </div>
  )
}