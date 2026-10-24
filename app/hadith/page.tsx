'use client'

import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/page-header'
import { HADITHS, type Hadith } from '@/lib/hadiths'
import { Search, X, BookOpen, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

// استخراج التصنيفات من البيانات مع تحديد النوع صراحةً
const CATEGORIES = ['الكل', ...Array.from(new Set(HADITHS.map((h: Hadith) => h.category)))]

export default function HadithPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('الكل')
  const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null)

  // تحديد النوع (h: Hadith) يمنع تحذيرات TypeScript
  const filteredHadiths = useMemo(() => {
    return HADITHS.filter((h: Hadith) => {
      const matchesCategory = activeCategory === 'الكل' || h.category === activeCategory
      const matchesSearch = 
        h.title.includes(searchQuery) || 
        h.text.includes(searchQuery) || 
        h.explanation.includes(searchQuery)
      return matchesCategory && matchesSearch
    })
  }, [searchQuery, activeCategory])

  return (
    <div className="min-h-[100dvh] bg-[#f7f3ea] pb-24" dir="rtl">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        
        <PageHeader 
          title="الحديث النبوي" 
          subtitle="من جوامع كلم النبي صلى الله عليه وسلم" 
          backHref="/more" 
        />

        {/* شريط البحث */}
        <div className="relative w-full mt-4 mb-4">
          <input
            type="text"
            placeholder="ابحث في نص الحديث، أو الشرح..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-[#e8dccb] bg-white px-4 py-3.5 pr-12 text-sm text-[#0a1f1a] shadow-sm focus:outline-none focus:border-[#d4af37]"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-[#b89965]" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* التصنيفات (Tabs) */}
        <div className="flex overflow-x-auto gap-2 pb-2 mb-4 no-scrollbar">
          {CATEGORIES.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                activeCategory === cat 
                  ? "bg-[#0a1f1a] text-white shadow-md" 
                  : "bg-white text-[#0a1f1a] border border-[#e8dccb] hover:bg-[#f4ece1]"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* قائمة الأحاديث */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredHadiths.length > 0 ? (
            filteredHadiths.map((hadith: Hadith) => (
              <button
                key={hadith.id}
                onClick={() => setSelectedHadith(hadith)}
                className="group flex flex-col items-start text-right rounded-2xl bg-white p-5 shadow-sm border border-[#e8dccb] transition-all hover:shadow-md hover:border-[#d4af37]/50 active:scale-[0.98]"
              >
                <div className="flex items-center gap-2 mb-2 w-full justify-between">
                  <span className="text-xs font-bold text-[#b89965] bg-[#f4ece1] px-2 py-1 rounded-md">
                    {hadith.category}
                  </span>
                  <BookOpen className="size-4 text-[#d4af37] opacity-50 group-hover:opacity-100" />
                </div>
                <h3 className="font-bold text-[#0a1f1a] text-base leading-snug mb-1">{hadith.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {hadith.text}
                </p>
              </button>
            ))
          ) : (
            <div className="col-span-full py-10 text-center text-muted-foreground">
              لا توجد أحاديث مطابقة لبحثك.
            </div>
          )}
        </div>
      </div>

      {/* نافذة قراءة الحديث */}
      {selectedHadith && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedHadith(null)}
        >
          <div 
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#fdfbf7] shadow-2xl ring-2 ring-[#d4af37]/50 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#e8dccb] p-4 bg-white/50 shrink-0">
              <span className="text-xs font-bold text-[#b89965] bg-[#f4ece1] px-3 py-1.5 rounded-lg border border-[#e8dccb]">
                {selectedHadith.category}
              </span>
              <button
                onClick={() => setSelectedHadith(null)}
                className="rounded-full bg-black/5 p-2 text-muted-foreground hover:bg-black/10 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar p-6">
              <h2 className="text-xl font-bold text-[#0a1f1a] mb-4 text-center">
                {selectedHadith.title}
              </h2>
              
              <p className="font-quran text-xl leading-loose text-[#0a1f1a] text-center mb-6">
                «{selectedHadith.text}»
              </p>
              
              <div className="bg-[#f4ece1]/50 rounded-xl p-4 mb-4">
                <p className="text-sm text-[#0a1f1a] leading-relaxed">
                  <span className="font-bold text-[#b89965] block mb-1">المصدر:</span> 
                  {selectedHadith.source}
                </p>
              </div>

              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <p className="text-sm text-emerald-900 leading-relaxed flex gap-2">
                  <Lightbulb className="size-5 shrink-0 text-emerald-600 mt-0.5" />
                  <span>
                    <span className="font-bold block mb-1">الشرح والفوائد:</span>
                    {selectedHadith.explanation}
                  </span>
                </p>
              </div>
            </div>

            <div className="p-4 bg-white/50 border-t border-[#e8dccb] text-center shrink-0">
              <p className="text-xs text-muted-foreground">اضغط في أي مكان خارج النافذة للإغلاق</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}