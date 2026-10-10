'use client'

import { useEffect, useState } from 'react'
import { Bookmark, Minus, Plus } from 'lucide-react'
import type { Ayah } from '@/lib/quran'
import { stripBasmala, toArabicNumber } from '@/lib/quran'
import { useHydrated, useSettings } from '@/lib/settings'

export function SurahReader({ 
  surah, 
  surahName, 
  ayahs,
  currentAyah,
  initialAyah // خاصية جديدة نستقبلها من الرابط (مثلاً ?ayah=5)
}: { 
  surah: number; 
  surahName: string; 
  ayahs: Ayah[];
  currentAyah?: number | null; 
  initialAyah?: number | null;
}) {
  const [settings, update] = useSettings()
  const hydrated = useHydrated()
  const fontSize = hydrated ? settings.quranFontSize : 30
  
  // حالة الآية المحددة يدوياً بواسطة المستخدم
  const [selectedAyah, setSelectedAyah] = useState<number | null>(initialAyah || null)
  
  // حالة لإظهار رسالة "تم الحفظ"
  const [savedMessage, setSavedMessage] = useState(false)

  // ============ التمرير التلقائي ============
  useEffect(() => {
    // إذا فتحنا الصفحة من رابط به علامة مرجعية، نمرر إليها
    if (initialAyah) {
      setTimeout(() => {
        const element = document.getElementById(`ayah-${initialAyah}`)
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)
    }
  }, [initialAyah])

  // التمرير للآية التي يتم تشغيلها حالياً
  useEffect(() => {
    if (currentAyah && !selectedAyah) {
      const element = document.getElementById(`ayah-${currentAyah}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [currentAyah, selectedAyah])

  useEffect(() => {
    update({ lastRead: { surah, name: surahName } })
  }, [surah, surahName, update])

  // دالة حفظ العلامة المرجعية
  const saveBookmark = () => {
    if (selectedAyah) {
      localStorage.setItem('quran-bookmark', JSON.stringify({ surah, ayah: selectedAyah }))
      setSavedMessage(true)
      setTimeout(() => setSavedMessage(false), 2000)
    }
  }

  return (
    <article className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border sm:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* زر حفظ العلامة المرجعية */}
          {selectedAyah && (
            <button
              onClick={saveBookmark}
              className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              <Bookmark className="size-3" />
              {savedMessage ? 'تم الحفظ!' : `حفظ الآية ${selectedAyah}`}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{'حجم الخط'}</span>
          <button
            type="button"
            onClick={() => update((s) => ({ quranFontSize: Math.max(20, s.quranFontSize - 2) }))}
            className="flex size-8 items-center justify-center rounded-full bg-muted"
            aria-label="تصغير الخط"
          >
            <Minus className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => update((s) => ({ quranFontSize: Math.min(48, s.quranFontSize + 2) }))}
            className="flex size-8 items-center justify-center rounded-full bg-muted"
            aria-label="تكبير الخط"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      {surah !== 1 && surah !== 9 && (
        <p className="mb-6 text-center font-quran text-3xl text-primary">{'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'}</p>
      )}
      
      <p
        className="text-justify font-quran leading-[2.3]"
        style={{ fontSize, touchAction: 'pinch-zoom' }}
      >
        {ayahs.map((a) => {
          const isPlaying = currentAyah === a.numberInSurah
          const isSelected = selectedAyah === a.numberInSurah
          
          return (
            <span 
              key={a.number} 
              id={`ayah-${a.numberInSurah}`} 
              onClick={() => setSelectedAyah(a.numberInSurah)}
              className={`cursor-pointer transition-colors duration-300 ${
                isPlaying 
                  ? 'bg-primary/20 text-primary-foreground rounded-md px-1' 
                  : isSelected
                    ? 'bg-gold/30 text-foreground rounded-md px-1 ring-1 ring-gold'
                    : 'hover:bg-muted/50'
              }`}
            >
              {stripBasmala(a.text.replace('\ufeff', ''), surah, a.numberInSurah)}
              <span className="ayah-marker mx-1 whitespace-nowrap" aria-label={`آية ${a.numberInSurah}`}>
                {`﴿${toArabicNumber(a.numberInSurah)}﴾`}
              </span>{' '}
            </span>
          )
        })}
      </p>
    </article>
  )
}