'use client';

import { useState, useEffect } from 'react';
import { useQuranPlayer } from '@/lib/quran-player';

interface SurahPlayerProps {
  surahNumber?: number;
  surahName?: string;
  reciterName?: string;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function SurahPlayer(props: SurahPlayerProps) {
  let quranPlayerContext: any = null;
  try {
    quranPlayerContext = useQuranPlayer();
  } catch (e) {
    // لتجنب أي خطأ في حال تم استدعاؤه خارج المزود
  }

  const [currentReciter, setCurrentReciter] = useState<string>('مشاري العفاسي');

  useEffect(() => {
    const savedName = localStorage.getItem('selected_reciter_name');
    if (savedName) {
      setCurrentReciter(savedName);
    }
  }, []);

  // المتغيرات المتوافقة مع الحالات الفعلية للمشغل
  const isPlaying = quranPlayerContext?.playing || quranPlayerContext?.isPlaying || false;
  const currentSurah = quranPlayerContext?.surahName || props.surahName || '';
  const activeReciter = quranPlayerContext?.reciter?.name || props.reciterName || currentReciter;

  if (!isPlaying && !currentSurah) {
    return null; // عدم إظهار الشريط إلا عند تشغيل التلاوة
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 px-4 pb-2" dir="rtl">
      <div className="max-w-md mx-auto bg-[#18302a]/95 backdrop-blur-md border border-[#c5a059]/50 rounded-2xl p-3 shadow-2xl flex items-center justify-between text-[#fbf8f0]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (quranPlayerContext?.toggle) {
                quranPlayerContext.toggle();
              } else if (quranPlayerContext?.togglePlay) {
                quranPlayerContext.togglePlay();
              }
            }}
            className="w-10 h-10 rounded-full bg-[#3a5a40] hover:bg-amber-600 text-white flex items-center justify-center transition-colors shadow-md"
            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          
          <div className="flex flex-col truncate max-w-40">
            <span className="text-xs md:text-sm font-bold text-amber-200 truncate">
              {currentSurah || 'تلاوة القرآن الكريم'}
            </span>
            <span className="text-[10px] text-stone-300 truncate">
              {activeReciter}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {quranPlayerContext?.playNext && (
            <button
              onClick={() => quranPlayerContext.playNext()}
              className="text-xs px-2.5 py-1.5 bg-[#1a1410] border border-[#c5a059]/30 rounded-lg text-stone-300 hover:text-white transition-colors"
              title="السورة التالية"
            >
              التالية ⏭
            </button>
          )}
        </div>
      </div>
    </div>
  );
}