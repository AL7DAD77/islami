'use client'

import { useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { ASMAUL_HUSNA, type DivineName } from '@/lib/asmaulhusna'

export default function AsmaulHusnaPage() {
  const [selectedName, setSelectedName] = useState<DivineName | null>(null)

  return (
    <div className="min-h-[100dvh] bg-[#f7f3ea] pb-24" dir="rtl">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <PageHeader 
          title="أسماء الله الحسنى" 
          subtitle="للتفكر والتدبر في معاني أسماء الله" 
          backHref="/adhkar"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-6">
          {ASMAUL_HUSNA.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedName(item)}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-[#e8dccb] shadow-sm hover:shadow-md hover:border-[#d4af37] transition-all active:scale-95 group"
            >
              <Sparkles className="size-5 text-[#d4af37] mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
              <span className="font-quran text-xl font-bold text-[#0a1f1a]">{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* النافذة المنبثقة لمعنى الاسم */}
      {selectedName && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedName(null)}
        >
          <div 
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#fdfbf7] p-6 text-center shadow-2xl ring-2 ring-[#d4af37]/50 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedName(null)}
              className="absolute right-4 top-4 rounded-full bg-black/5 p-2 text-muted-foreground hover:bg-black/10 transition-colors"
            >
              <X className="size-5" />
            </button>

            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#d4af37]/10 text-[#b89965]">
              <Sparkles className="size-7" />
            </div>

            <h2 className="font-quran text-4xl font-bold text-[#0a1f1a] mb-2">{selectedName.name}</h2>
            <div className="w-16 h-1 bg-[#d4af37] mx-auto rounded-full mb-4"></div>
            
            <p className="text-lg leading-loose text-[#0a1f1a]/80">
              {selectedName.meaning}
            </p>
            
            <p className="mt-6 text-xs text-muted-foreground">اضغط في أي مكان للإغلاق</p>
          </div>
        </div>
      )}
    </div>
  )
}