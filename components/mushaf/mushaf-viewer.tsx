'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerPlugin } from '@capacitor/core';
import { saveReadingPosition, toggleBookmark, isBookmarked, useBookmarkState } from '@/lib/bookmarks';

interface LineItem {
  t: 's' | 'b' | 'a';
  n?: number;
  c?: number;
  w?: string[];
}

interface PageData {
  p: number;
  j: number;
  l: LineItem[];
}

interface MetaData {
  surahNames: string[];
  basmalah: string;
  surahStartPage: number[];
}

type MushafViewerProps = {
  initialSurah: number;
  initialAyah?: number;
  onHomeClick?: () => void;
};

interface QuranPlayerPluginInterface {
  play(options: { url: string; title: string; artist: string; ui?: string; repeat?: boolean }): Promise<any>;
  playQueue(options: { items: Array<{ url: string; title: string; id?: string }>; startIndex?: number; repeat?: boolean; ui?: string }): Promise<any>;
  toggle(options?: {}): Promise<any>;
  stop(options?: {}): Promise<any>;
  getState(options?: {}): Promise<{ playing: boolean; loading: boolean; progress: number; repeat: boolean; title: string; url?: string; index?: number }>;
}

const QuranPlayer = registerPlugin<QuranPlayerPluginInterface>('QuranPlayer');

const RECITERS = [
  { name: 'مشاري العفاسي', server: 'https://server8.mp3quran.net/afs/' },
  { name: 'سعود الشريم', server: 'https://server7.mp3quran.net/shur/' },
  { name: 'عبد الباسط عبد الصمد', server: 'https://server7.mp3quran.net/basit/' },
  { name: 'محمود خليل الحصري', server: 'https://server13.mp3quran.net/husr/' },
  { name: 'ماهر المعيقلي', server: 'https://server12.mp3quran.net/maher/' },
];

const SURAH_DETAILS: { [key: number]: { count: number; type: 'مكية' | 'مدنية' } } = {
  1: { count: 7, type: 'مكية' }, 2: { count: 286, type: 'مدنية' }, 3: { count: 200, type: 'مدنية' },
  4: { count: 176, type: 'مدنية' }, 5: { count: 120, type: 'مدنية' }, 6: { count: 165, type: 'مكية' },
  7: { count: 206, type: 'مكية' }, 8: { count: 75, type: 'مدنية' }, 9: { count: 129, type: 'مدنية' },
  10: { count: 109, type: 'مكية' }, 11: { count: 123, type: 'مكية' }, 12: { count: 111, type: 'مكية' },
  13: { count: 43, type: 'مدنية' }, 14: { count: 52, type: 'مكية' }, 15: { count: 99, type: 'مكية' },
  16: { count: 128, type: 'مكية' }, 17: { count: 111, type: 'مكية' }, 18: { count: 110, type: 'مكية' },
  19: { count: 98, type: 'مكية' }, 20: { count: 135, type: 'مكية' }, 21: { count: 112, type: 'مكية' },
  22: { count: 78, type: 'مدنية' }, 23: { count: 118, type: 'مكية' }, 24: { count: 64, type: 'مدنية' },
  25: { count: 77, type: 'مكية' }, 26: { count: 227, type: 'مكية' }, 27: { count: 93, type: 'مكية' },
  28: { count: 88, type: 'مكية' }, 29: { count: 69, type: 'مكية' }, 30: { count: 60, type: 'مكية' },
  31: { count: 34, type: 'مكية' }, 32: { count: 30, type: 'مكية' }, 33: { count: 73, type: 'مدنية' },
  34: { count: 54, type: 'مكية' }, 35: { count: 45, type: 'مكية' }, 36: { count: 83, type: 'مكية' },
  37: { count: 182, type: 'مكية' }, 38: { count: 88, type: 'مكية' }, 39: { count: 75, type: 'مكية' },
  40: { count: 85, type: 'مكية' }, 41: { count: 54, type: 'مكية' }, 42: { count: 53, type: 'مكية' },
  43: { count: 89, type: 'مكية' }, 44: { count: 59, type: 'مكية' }, 45: { count: 37, type: 'مكية' },
  46: { count: 35, type: 'مكية' }, 47: { count: 38, type: 'مدنية' }, 48: { count: 29, type: 'مدنية' },
  49: { count: 18, type: 'مدنية' }, 50: { count: 45, type: 'مكية' }, 51: { count: 60, type: 'مكية' },
  52: { count: 49, type: 'مكية' }, 53: { count: 62, type: 'مكية' }, 54: { count: 55, type: 'مكية' },
  55: { count: 78, type: 'مدنية' }, 56: { count: 96, type: 'مكية' }, 57: { count: 29, type: 'مدنية' },
  58: { count: 22, type: 'مدنية' }, 59: { count: 24, type: 'مدنية' }, 60: { count: 13, type: 'مدنية' },
  61: { count: 14, type: 'مدنية' }, 62: { count: 11, type: 'مدنية' }, 63: { count: 11, type: 'مدنية' },
  64: { count: 18, type: 'مدنية' }, 65: { count: 12, type: 'مدنية' }, 66: { count: 12, type: 'مدنية' },
  67: { count: 30, type: 'مكية' }, 68: { count: 52, type: 'مكية' }, 69: { count: 52, type: 'مكية' },
  70: { count: 44, type: 'مكية' }, 71: { count: 28, type: 'مكية' }, 72: { count: 28, type: 'مكية' },
  73: { count: 20, type: 'مكية' }, 74: { count: 56, type: 'مكية' }, 75: { count: 40, type: 'مكية' },
  76: { count: 31, type: 'مدنية' }, 77: { count: 50, type: 'مكية' }, 78: { count: 40, type: 'مكية' },
  79: { count: 46, type: 'مكية' }, 80: { count: 42, type: 'مكية' }, 81: { count: 29, type: 'مكية' },
  82: { count: 19, type: 'مكية' }, 83: { count: 36, type: 'مكية' }, 84: { count: 25, type: 'مكية' },
  85: { count: 22, type: 'مكية' }, 86: { count: 17, type: 'مكية' }, 87: { count: 19, type: 'مكية' },
  88: { count: 26, type: 'مكية' }, 89: { count: 30, type: 'مكية' }, 90: { count: 20, type: 'مكية' },
  91: { count: 15, type: 'مكية' }, 92: { count: 21, type: 'مكية' }, 93: { count: 11, type: 'مكية' },
  94: { count: 8, type: 'مكية' }, 95: { count: 8, type: 'مكية' }, 96: { count: 19, type: 'مكية' },
  97: { count: 5, type: 'مكية' }, 98: { count: 8, type: 'مدنية' }, 99: { count: 8, type: 'مدنية' },
  100: { count: 11, type: 'مكية' }, 101: { count: 11, type: 'مكية' }, 102: { count: 8, type: 'مكية' },
  103: { count: 3, type: 'مكية' }, 104: { count: 9, type: 'مكية' }, 105: { count: 5, type: 'مكية' },
  106: { count: 4, type: 'مكية' }, 107: { count: 7, type: 'مكية' }, 108: { count: 3, type: 'مكية' },
  109: { count: 6, type: 'مكية' }, 110: { count: 3, type: 'مدنية' }, 111: { count: 5, type: 'مكية' },
  112: { count: 4, type: 'مكية' }, 113: { count: 5, type: 'مكية' }, 114: { count: 6, type: 'مكية' }
};

function SurahHeaderDecoration({ surahNum, surahName, details }: { surahNum: number; surahName: string; details: { count: number | string; type: string } }) {
  return (
    <div className="w-full relative flex items-center justify-center my-1.5 shrink-0 select-none" dir="rtl">
      <div className="w-full border border-[#C5A059] bg-[#F7F2E8] py-1.5 px-3 rounded-lg shadow-sm flex items-center justify-between relative">
        <div className="text-right font-sans text-[11px] font-bold text-[#2C5E3B]">
          <div>{details.type}</div>
          <div className="text-[9px] text-[#8C6B2B]">ترتيبها: {surahNum}</div>
        </div>
        <div className="text-center font-mushaf text-lg md:text-xl font-bold text-[#1A120B]">
          سُورَةُ {surahName}
        </div>
        <div className="text-left font-sans text-[11px] font-bold text-[#2C5E3B]">
          <div>آيَاتُهَا</div>
          <div className="text-[9px] text-[#8C6B2B]">{details.count} آية</div>
        </div>
      </div>
    </div>
  );
}

export function MushafViewer({ initialSurah = 1, initialAyah, onHomeClick }: MushafViewerProps) {
  const router = useRouter();
  const bookmarkState = useBookmarkState();
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [metaData, setMetaData] = useState<MetaData | null>(null);

  const [fontSize, setFontSize] = useState<number>(24);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioServer, setAudioServer] = useState<string>('https://server8.mp3quran.net/afs/');
  const [reciterName, setReciterName] = useState<string>('مشاري العفاسي');
  const [showReciterModal, setShowReciterModal] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  useEffect(() => {
    const savedFontSize = localStorage.getItem('mushaf_font_size');
    if (savedFontSize) setFontSize(Number(savedFontSize));

    const savedServer = localStorage.getItem('selected_reciter_server');
    const savedName = localStorage.getItem('selected_reciter_name');
    if (savedServer) setAudioServer(savedServer);
    if (savedName) setReciterName(savedName);
  }, []);

  const handleZoomIn = () => {
    setFontSize(prev => {
      const newSize = Math.min(prev + 2, 50);
      localStorage.setItem('mushaf_font_size', String(newSize));
      return newSize;
    });
  };

  const handleZoomOut = () => {
    setFontSize(prev => {
      const newSize = Math.max(prev - 2, 16);
      localStorage.setItem('mushaf_font_size', String(newSize));
      return newSize;
    });
  };

  const selectReciter = (reciter: { name: string; server: string }) => {
    setReciterName(reciter.name);
    setAudioServer(reciter.server);
    localStorage.setItem('selected_reciter_server', reciter.server);
    localStorage.setItem('selected_reciter_name', reciter.name);
    setShowReciterModal(false);
    showToast(`تم اختيار القارئ: ${reciter.name}`);
  };

  useEffect(() => {
    async function getSurahInfo() {
      try {
        const response = await fetch('/mushaf/meta.json');
        const meta: MetaData = await response.json();
        setMetaData(meta);
        const startPage = meta.surahStartPage[initialSurah - 1] || 1;
        setCurrentPage(startPage);
      } catch (error) {
        console.error("خطأ في جلب meta", error);
      }
    }
    getSurahInfo();
  }, [initialSurah]);

  useEffect(() => {
    if (!currentPage) return;
    async function loadPage() {
      setLoading(true);
      try {
        const paddedPageNumber = String(currentPage).padStart(3, '0');
        const response = await fetch(`/mushaf/pages/${paddedPageNumber}.json`);
        if (!response.ok) throw new Error("الصفحة غير موجودة");
        const data: PageData = await response.json();
        setPageData(data);
      } catch (error) {
        console.error("خطأ في تحميل الصفحة", error);
      } finally {
        setLoading(false);
      }
    }
    loadPage();
  }, [currentPage]);

  const getCurrentSurahNum = (): number => {
    if (!pageData || !metaData) return initialSurah || 1;
    const surahLine = pageData.l.find((line) => line.t === 's');
    if (surahLine && surahLine.n) return surahLine.n;
    for (let i = metaData.surahStartPage.length - 1; i >= 0; i--) {
      if (metaData.surahStartPage[i] <= currentPage) return i + 1;
    }
    return initialSurah || 1;
  };

  useEffect(() => {
    if (currentPage && metaData && pageData) {
      const currentSurahNum = getCurrentSurahNum();
      const surahName = metaData.surahNames[currentSurahNum - 1] || '';
      saveReadingPosition(currentSurahNum, surahName, initialAyah || 1);
    }
  }, [currentPage, metaData, pageData, initialAyah]);

  const handleBookmarkToggle = () => {
    if (!metaData) return;
    const currentSurahNum = getCurrentSurahNum();
    const surahName = metaData.surahNames[currentSurahNum - 1] || '';
    const added = toggleBookmark(currentSurahNum, surahName, initialAyah || 1);
    showToast(added ? 'تم حفظ العلامة المرجعية بنجاح 🔖' : 'تم حذف العلامة المرجعية 🗑️');
  };

  const playSurahAudio = async (surahNum: number) => {
    if (!metaData) return;
    const queueItems = [];
    for (let i = surahNum; i <= 114; i++) {
      const padded = String(i).padStart(3, '0');
      const url = `${audioServer}${padded}.mp3`;
      const name = metaData.surahNames[i - 1] || '';
      queueItems.push({ url, title: `سورة ${name}`, id: url });
    }
    try {
      const res = await QuranPlayer.playQueue({ items: queueItems, startIndex: 0 });
      if (res && typeof res.playing !== 'undefined') setIsPlaying(res.playing);
      else setIsPlaying(true);
    } catch (err) {
      try {
        const paddedSurah = String(surahNum).padStart(3, '0');
        const audioUrl = `${audioServer}${paddedSurah}.mp3`;
        const audio = (window as any).__fallbackAudio || new Audio();
        (window as any).__fallbackAudio = audio;
        audio.src = audioUrl;
        audio.onended = () => {
          if (surahNum < 114) playSurahAudio(surahNum + 1);
          else setIsPlaying(false);
        };
        await audio.play();
        setIsPlaying(true);
      } catch (webErr) {
        setIsPlaying(false);
      }
    }
  };

  const toggleAudio = async () => {
    const currentSurah = getCurrentSurahNum();
    try {
      const state = await QuranPlayer.getState();
      if (state && (state.playing || state.url)) {
        const res = await QuranPlayer.toggle();
        if (res) setIsPlaying(res.playing);
      } else {
        await playSurahAudio(currentSurah);
      }
    } catch (err) {
      const audio = (window as any).__fallbackAudio;
      if (audio && !audio.paused) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await playSurahAudio(currentSurah);
      }
    }
  };

  const handlePrev = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const handleNext = () => { if (currentPage < 604) setCurrentPage(currentPage + 1); };

  if (loading) return <div className="h-dvh flex items-center justify-center font-mushaf text-xl bg-[#121A15] text-[#FDFBF7]">جاري تحميل المصحف...</div>;
  if (!pageData || !metaData) return <div className="h-dvh flex items-center justify-center text-red-400">حدث خطأ في جلب البيانات.</div>;

  const currentSurahNum = getCurrentSurahNum();
  const isBookmarkedCurrent = isBookmarked(bookmarkState, currentSurahNum, initialAyah || 1);

  return (
    <div className="h-dvh w-full bg-[#121A15] p-2 flex flex-col items-center justify-between overflow-hidden" dir="rtl">
      
      {toastMessage && (
        <div className="fixed top-10 z-50 bg-[#2C5E3B] text-white px-4 py-2 rounded-xl shadow-2xl text-xs font-bold animate-bounce">
          {toastMessage}
        </div>
      )}

      {showReciterModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#FDFBF7] w-full max-w-sm rounded-2xl p-4 border-2 border-[#C5A059] shadow-2xl">
            <h3 className="text-base font-bold text-[#2C5E3B] mb-3 text-center border-b border-[#C5A059]/30 pb-2">اختر القارئ</h3>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {RECITERS.map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => selectReciter(r)}
                  className={`p-2.5 rounded-xl text-xs font-bold text-right transition-all flex justify-between items-center ${
                    reciterName === r.name ? 'bg-[#2C5E3B] text-white' : 'bg-white text-[#1A120B] border border-[#C5A059]/30 hover:bg-[#F7F2E8]'
                  }`}
                >
                  <span>{r.name}</span>
                  {reciterName === r.name && <span>✓</span>}
                </button>
              ))}
            </div>
            <button onClick={() => setShowReciterModal(false)} className="mt-4 w-full py-2 bg-[#2C5E3B] text-white rounded-xl text-xs font-bold">
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* الشريط العلوي */}
      <div className="w-full max-w-3xl bg-[#F7F2E8] p-2 rounded-xl border border-[#C5A059] flex justify-between items-center shrink-0 mb-1 gap-1 flex-wrap sm:flex-nowrap">
        <button onClick={() => onHomeClick ? onHomeClick() : router.push('/quran')} className="px-2 py-1.5 bg-[#2C5E3B] text-white rounded-lg text-xs font-bold shrink-0">
          ← الرئيسية
        </button>

        <div className="flex items-center gap-1">
          {/* أزرار التكبير والتصغير (Zoom) */}
          <div className="flex items-center bg-[#EFE8D8] border border-[#C5A059]/60 rounded-lg overflow-hidden shrink-0">
            <button onClick={handleZoomOut} className="px-2 py-1.5 text-[#2C5E3B] font-bold hover:bg-[#E5DCB8]" title="تصغير النص">-</button>
            <span className="px-1 text-[10px] font-bold text-[#8C6B2B]">حجم</span>
            <button onClick={handleZoomIn} className="px-2 py-1.5 text-[#2C5E3B] font-bold hover:bg-[#E5DCB8]" title="تكبير النص">+</button>
          </div>

          <button 
            onClick={toggleAudio}
            className={`px-2 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all shrink-0 ${
              isPlaying ? 'bg-emerald-700 text-white animate-pulse' : 'bg-[#2C5E3B] text-white hover:bg-[#1E4329]'
            }`}
          >
            {isPlaying ? '⏸' : '▶ استماع'}
          </button>

          {/* تم إعادة زر القارئ هنا ليكون ظاهراً دائماً */}
          <button
            onClick={() => setShowReciterModal(true)}
            className="px-2 py-1.5 bg-[#EFE8D8] text-[#2C5E3B] border border-[#C5A059]/60 rounded-lg text-xs font-bold shrink-0 hover:bg-[#E5DCB8]"
          >
            🎙️ {reciterName.split(' ')[0]}
          </button>

          <button 
            onClick={handleBookmarkToggle} 
            className={`px-2 py-1.5 rounded-lg text-xs font-bold border border-[#C5A059]/60 transition-all shrink-0 ${
              isBookmarkedCurrent ? 'bg-[#C5A059] text-white' : 'bg-[#EFE8D8] text-[#2C5E3B]'
            }`}
          >
            {isBookmarkedCurrent ? '🔖' : '🔖 حفظ'}
          </button>
        </div>

        <div className="text-[#2C5E3B] font-bold text-xs bg-[#EFE8D8] px-2 py-1.5 rounded-lg shrink-0 border border-[#C5A059]/40">
          ص {currentPage}
        </div>
      </div>

      {/* عارض الصفحة */}
      <div className="w-full max-w-3xl grow bg-[#FDFBF7] px-2 sm:px-4 py-2 sm:py-3 rounded-2xl border-2 border-[#C5A059] shadow-2xl flex flex-col justify-between overflow-hidden" dir="rtl">
        <div className="w-full h-full flex flex-col justify-between items-center overflow-y-auto">
          {pageData.l.map((line, idx) => {
            if (line.t === 's') {
              const surahNum = line.n || 1;
              const surahName = metaData.surahNames[surahNum - 1];
              const details = SURAH_DETAILS[surahNum] || { count: '', type: '' };
              return <SurahHeaderDecoration key={idx} surahNum={surahNum} surahName={surahName} details={details} />;
            } 
            else if (line.t === 'b') {
              return (
                <div key={idx} className="w-full text-center font-mushaf text-[#1A120B] my-0.5">
                  <span className="text-base md:text-xl font-semibold">{metaData.basmalah}</span>
                </div>
              );
            } 
            else if (line.t === 'a' && line.w) {
              const lineText = line.w.join(' ');
              const isCentered = line.c === 1;

              return (
                <div 
                  key={idx} 
                  className="font-mushaf text-[#1A120B] w-full flex justify-center"
                  style={{
                    fontSize: `${fontSize}px`, 
                    textAlign: isCentered ? 'center' : 'justify',
                    textAlignLast: isCentered ? 'center' : 'justify',
                    lineHeight: '1.8',
                    wordSpacing: '0.1em', 
                  }}
                >
                  <span className="w-full">{lineText}</span>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* الشريط السفلي */}
      <div className="w-full max-w-3xl bg-[#F7F2E8] p-2 rounded-xl border border-[#C5A059] flex justify-between items-center shrink-0 mt-1">
        <button onClick={handlePrev} disabled={currentPage === 1} className="px-4 py-1.5 bg-[#2C5E3B] text-white rounded-lg disabled:opacity-40 text-xs font-bold">
          السابق
        </button>
        <div className="text-[#2C5E3B] font-bold text-xs">صفحة {currentPage} من 604</div>
        <button onClick={handleNext} disabled={currentPage === 604} className="px-4 py-1.5 bg-[#2C5E3B] text-white rounded-lg disabled:opacity-40 text-xs font-bold">
          التالي
        </button>
      </div>

    </div>
  );
}