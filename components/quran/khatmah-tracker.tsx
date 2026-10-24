'use client'

import { useBookmarkState } from '@/lib/bookmarks'
import { toArabicNumber } from '@/lib/quran'
import { BookMarked, Sparkles, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export function KhatmahTracker() {
  const { position } = useBookmarkState()
  
  const currentPage = position?.page || 1
  const totalPages = 604
  const pagesLeft = totalPages - currentPage
  const percentage = Math.min(100, Math.round((currentPage / totalPages) * 100))

  const radius = 42
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col gap-4">
      {/* بطاقة التقدم (الخضراء) */}
      <Link 
        href={`/quran/${position?.surah || 1}?page=${currentPage}`}
        className="relative flex items-center justify-between overflow-hidden rounded-3xl bg-gradient-to-l from-[#0a1f1a] to-[#14332a] p-5 text-white shadow-lg transition-transform active:scale-[0.98]"
      >
        <div className="absolute -left-10 -bottom-10 size-40 rounded-full bg-[#d4af37]/10 blur-3xl"></div>
        
        <div className="flex flex-col gap-1 z-10">
          <div className="flex items-center gap-2 mb-1">
            <BookMarked className="size-5 text-[#d4af37]" />
            <h3 className="text-lg font-bold">ختمة القرآن</h3>
          </div>
          <p className="text-sm text-white/70">
            {currentPage === 1 ? 'ابدأ رحلتك مع القرآن اليوم' : `أنت في الصفحة ${toArabicNumber(currentPage)}`}
          </p>
          <p className="text-xs text-[#d4af37] mt-1 font-medium">
            {percentage === 100 ? 'ما شاء الله! أتممت الختمة' : `متبقي ${toArabicNumber(pagesLeft)} صفحة`}
          </p>
        </div>

        <div className="relative flex items-center justify-center size-24 z-10">
          <svg className="size-full -rotate-90">
            <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
            <circle cx="48" cy="48" r={radius} fill="none" stroke="#d4af37" strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-white">{toArabicNumber(percentage)}٪</span>
          </div>
        </div>
      </Link>

      {/* ✅ التصميم الجديد الفخم لزر دعاء الختمة (أصبح واضحاً وكبيراً) */}
      <Link
        href="/quran/khatmah-dua"
        className="group relative flex items-center gap-4 overflow-hidden rounded-3xl bg-white p-4 shadow-sm border border-[#e8dccb] transition-all hover:shadow-md hover:border-[#d4af37]/50"
      >
        <div className="absolute right-0 top-0 -mr-4 -mt-4 size-24 rounded-full bg-[#d4af37]/5 blur-2xl group-hover:bg-[#d4af37]/10 transition-colors"></div>
        
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#f4ece1] text-[#b89965] transition-transform group-hover:scale-110">
          <Sparkles className="size-6" />
        </div>
        
        <div className="flex-1 z-10">
          <h3 className="text-base font-bold text-[#0a1f1a]">دعاء ختم القرآن</h3>
          <p className="text-xs text-muted-foreground mt-0.5">نسأل الله أن يجعله في ميزان حسناتك</p>
        </div>
        
        <ChevronLeft className="size-5 text-[#b89965] opacity-50 group-hover:opacity-100 transition-opacity z-10" />
      </Link>
    </div>
  )
}