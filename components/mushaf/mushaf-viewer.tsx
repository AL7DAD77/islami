'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { registerPlugin } from '@capacitor/core';
import { Menu, X, ArrowRight, ArrowLeft, Bookmark, Play, Pause, ZoomIn, ZoomOut, Volume2 } from 'lucide-react';
import { saveReadingPosition, toggleBookmark, isBookmarked, useBookmarkState } from '@/lib/bookmarks';

interface LineItem { t: 's' | 'b' | 'a'; n?: number; c?: number; w?: string[]; }
interface PageData { p: number; j: number; l: LineItem[]; }
interface MetaData { surahNames: string[]; basmalah: string; surahStartPage: number[]; }

type MushafViewerProps = {
  initialSurah: number;
  initialAyah?: number;
  onHomeClick?: () => void;
};

interface QuranPlayerPluginInterface {
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

export function MushafViewer({ initialSurah = 1, initialAyah, onHomeClick }: MushafViewerProps) {
  const router = useRouter();
  const bookmarkState = useBookmarkState();
  
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [metaData, setMetaData] = useState<MetaData | null>(null);
  const [isIndexOpen, setIsIndexOpen] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(24);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioServer, setAudioServer] = useState<string>('https://server8.mp3quran.net/afs/');
  const [reciterName, setReciterName] = useState<string>('مشاري العفاسي');
  const [showReciterModal, setShowReciterModal] = useState<boolean>(false);
  
  const webAudioRef = useRef<HTMLAudioElement | null>(null); 

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const savedFontSize = localStorage.getItem('mushaf_font_size');
    if (savedFontSize) setFontSize(Number(savedFontSize));

    const savedServer = localStorage.getItem('selected_reciter_server');
    const savedName = localStorage.getItem('selected_reciter_name');
    if (savedServer) setAudioServer(savedServer);
    if (savedName) setReciterName(savedName);
  }, []);

  const handleZoomIn = () => {
    setFontSize(prev => { const n = Math.min(prev + 2, 40); localStorage.setItem('mushaf_font_size', String(n)); return n; });
  };
  const handleZoomOut = () => {
    setFontSize(prev => { const n = Math.max(prev - 2, 16); localStorage.setItem('mushaf_font_size', String(n)); return n; });
  };

  useEffect(() => {
    async function getSurahInfo() {
      try {
        const response = await fetch('/mushaf/meta.json');
        const meta: MetaData = await response.json();
        setMetaData(meta);
        setCurrentPage(meta.surahStartPage[initialSurah - 1] || 1);
      } catch (error) { console.error("خطأ في جلب meta", error); }
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
      } catch (error) { console.error("خطأ في تحميل الصفحة", error); } finally { setLoading(false); }
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
      saveReadingPosition(currentSurahNum, surahName, currentPage);
    }
  }, [currentPage, metaData, pageData]);

  const handleBookmarkToggle = () => {
    if (!metaData) return;
    const currentSurahNum = getCurrentSurahNum();
    const surahName = metaData.surahNames[currentSurahNum - 1] || '';
    toggleBookmark(currentSurahNum, surahName, currentPage);
  };

  const toggleAudio = async () => {
    const currentSurah = getCurrentSurahNum();
    const padded = String(currentSurah).padStart(3, '0');
    const audioUrl = `${audioServer}${padded}.mp3`;

    try {
      const state = await QuranPlayer.getState();
      if (state && (state.playing || state.url)) {
        const res = await QuranPlayer.toggle();
        if (res) setIsPlaying(res.playing);
      } else {
        const queueItems = [];
        for (let i = currentSurah; i <= 114; i++) {
          const p = String(i).padStart(3, '0');
          const url = `${audioServer}${p}.mp3`;
          const name = metaData?.surahNames[i - 1] || '';
          queueItems.push({ url, title: `سورة ${name}`, id: url });
        }
        await QuranPlayer.playQueue({ items: queueItems, startIndex: 0 });
        setIsPlaying(true);
      }
    } catch (err) {
      const playSurahInBrowser = (surahNum: number) => {
        if (surahNum > 114) { setIsPlaying(false); return; }
        const p = String(surahNum).padStart(3, '0');
        const url = `${audioServer}${p}.mp3`;
        
        if (!webAudioRef.current) {
          webAudioRef.current = new Audio(url);
        } else {
          webAudioRef.current.src = url;
        }
        
        webAudioRef.current.play();
        webAudioRef.current.onended = () => {
          playSurahInBrowser(surahNum + 1);
        };
      };

      if (isPlaying) {
        webAudioRef.current?.pause();
        setIsPlaying(false);
      } else {
        playSurahInBrowser(currentSurah);
        setIsPlaying(true);
      }
    }
  };

  const selectReciter = (reciter: { name: string; server: string }) => {
    setReciterName(reciter.name);
    setAudioServer(reciter.server);
    localStorage.setItem('selected_reciter_server', reciter.server);
    localStorage.setItem('selected_reciter_name', reciter.name);
    setShowReciterModal(false);
  };

  const goToSurah = (index: number) => {
    if (metaData) {
      setCurrentPage(metaData.surahStartPage[index]);
      setIsIndexOpen(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    const diff = touchStartX.current - touchEndX.current;
    
    if (diff > 60) {
      setCurrentPage(p => Math.min(604, p + 1));
    } else if (diff < -60) {
      setCurrentPage(p => Math.max(1, p - 1));
    }
  };

  const currentSurahNum = getCurrentSurahNum();
  const isBookmarkedCurrent = isBookmarked(bookmarkState, currentSurahNum, currentPage);

  if (loading) return <div className="h-screen flex items-center justify-center font-mushaf text-xl bg-[#FDFBF7] text-[#1A120B]">جاري تحميل المصحف...</div>;
  if (!pageData || !metaData) return <div className="h-screen flex items-center justify-center text-red-400">حدث خطأ في جلب البيانات.</div>;
  return (
    <div 
      className="h-dvh w-full bg-[#FDFBF7] flex flex-col relative overflow-hidden select-none" 
      dir="rtl"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* الشريط العلوي */}
      <div className="flex justify-between items-center px-4 py-2 bg-[#F7F2E8] border-b border-[#E5DCB8] shrink-0 z-10">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsIndexOpen(true)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50">
            <Menu className="size-5 text-[#2C5E3B]" />
          </button>
          <button onClick={handleBookmarkToggle} className={`p-2 rounded-full shadow-sm ${isBookmarkedCurrent ? 'bg-[#C5A059] text-white' : 'bg-white text-[#2C5E3B] hover:bg-gray-50'}`} title="حفظ العلامة المرجعية">
            <Bookmark className="size-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1 shadow-sm border border-[#E5DCB8]">
          <button onClick={handleZoomOut} className="p-1 text-[#2C5E3B]"><ZoomOut className="size-4" /></button>
          <span className="text-xs font-bold text-gray-500 w-8 text-center">{fontSize}</span>
          <button onClick={handleZoomIn} className="p-1 text-[#2C5E3B]"><ZoomIn className="size-4" /></button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleAudio} className="p-2 bg-[#2C5E3B] text-white rounded-full shadow-sm hover:bg-[#1E4329]">
            {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
          </button>
          <button onClick={() => setShowReciterModal(true)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50" title="تغيير القارئ">
            <Volume2 className="size-5 text-[#2C5E3B]" />
          </button>
          <button onClick={() => onHomeClick ? onHomeClick() : router.push('/quran')} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50">
            <ArrowRight className="size-5 text-[#2C5E3B]" />
          </button>
        </div>
      </div>

      {/* منطقة عرض صفحة المصحف */}
      <div className="flex-1 overflow-y-auto px-2 py-4 flex flex-col items-center no-scrollbar">
        <div className="w-full max-w-3xl flex flex-col justify-start items-center">
          {pageData.l.map((line, idx) => {
            
            // ترويسة السورة (تم إعادة التصميم الاحترافي)
            if (line.t === 's') {
              const surahNum = line.n || 1;
              const surahName = metaData.surahNames[surahNum - 1];
              const details = SURAH_DETAILS[surahNum] || { count: '', type: '' };

              return (
                <div key={idx} className="w-full my-6 shrink-0 select-none">
                  <div className="w-full border border-[#C5A059] bg-[#F7F2E8] py-2 px-3 rounded-xl shadow-sm flex items-center justify-between relative">
                    <div className="text-right font-sans text-xs font-bold text-[#2C5E3B] w-1/3">
                      <div>{details.type}</div>
                      <div className="text-[10px] text-[#8C6B2B]">ترتيبها: {surahNum}</div>
                    </div>
                    <div className="text-center font-mushaf text-xl md:text-2xl font-bold text-[#1A120B] w-1/3">
                      سُورَةُ {surahName}
                    </div>
                    <div className="text-left font-sans text-xs font-bold text-[#2C5E3B] w-1/3">
                      <div>آيَاتُهَا</div>
                      <div className="text-[10px] text-[#8C6B2B]">{details.count} آية</div>
                    </div>
                  </div>
                </div>
              );
            } 
            // البسملة
            else if (line.t === 'b') {
              return (
                <div key={idx} className="w-full text-center my-3">
                  <span className="font-mushaf text-2xl text-[#1A120B]">{metaData.basmalah}</span>
                </div>
              );
            } 
            // نص الآيات
            else if (line.t === 'a' && line.w) {
              const lineText = line.w.join(' ');
              return (
                <div 
                  key={idx} 
                  className="font-mushaf w-full text-center text-[#1A120B]"
                  style={{ fontSize: `${fontSize}px`, wordSpacing: '0.1em', textAlignLast: 'center' }}
                >
                  {lineText}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* الشريط السفلي */}
      <div className="flex justify-center items-center gap-6 px-4 py-2 bg-[#F7F2E8] border-t border-[#E5DCB8] shrink-0">
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 bg-white border border-[#E5DCB8] text-[#2C5E3B] rounded-lg shadow-sm disabled:opacity-30">
          <ArrowRight className="size-4" />
        </button>
        <span className="font-bold text-[#2C5E3B] text-sm select-none">{currentPage} / 604</span>
        <button onClick={() => setCurrentPage(p => Math.min(604, p + 1))} disabled={currentPage === 604} className="p-1.5 bg-white border border-[#E5DCB8] text-[#2C5E3B] rounded-lg shadow-sm disabled:opacity-30">
          <ArrowLeft className="size-4" />
        </button>
      </div>

      {/* فهرس السور */}
      {isIndexOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsIndexOpen(false)} />
          <div className="relative w-[85%] max-w-sm h-full bg-[#FDFBF7] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center p-4 border-b bg-[#F7F2E8]">
              <h3 className="font-bold text-lg text-[#2C5E3B]">فهرس السور</h3>
              <button onClick={() => setIsIndexOpen(false)} className="p-1 rounded-full bg-white shadow-sm">
                <X className="size-5 text-red-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 no-scrollbar">
              {metaData.surahNames.map((name, index) => {
                const surahNum = index + 1;
                const details = SURAH_DETAILS[surahNum];
                const isCurrent = surahNum === currentSurahNum;
                
                return (
                  <button
                    key={index}
                    onClick={() => goToSurah(index)}
                    className={`w-full text-right p-3 mb-2 rounded-xl border transition-all flex justify-between items-center ${
                      isCurrent 
                        ? 'bg-[#2C5E3B] border-[#2C5E3B] text-white shadow-md' 
                        : 'bg-white border-[#E5DCB8] text-[#1A120B] hover:bg-[#F7F2E8]'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`font-bold text-lg font-mushaf mb-1 ${isCurrent ? 'text-white' : 'text-[#1A120B]'}`}>{name}</span>
                      {/* تكبير وتغميق بيانات السورة في الفهرس */}
                      <span className={`text-xs font-sans font-semibold ${isCurrent ? 'text-gray-200' : 'text-[#6B7280]'}`}>
                        {details?.type} • {details?.count} آية
                      </span>
                    </div>
                    <span className={`text-sm px-3 py-1.5 rounded-full font-bold ${isCurrent ? 'bg-white/20 text-white' : 'bg-[#F7F2E8] text-[#2C5E3B]'}`}>
                      {surahNum}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* نافذة اختيار القارئ */}
      {showReciterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#FDFBF7] w-full max-w-sm rounded-2xl p-4 border border-[#C5A059] shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-[#2C5E3B] mb-3 text-center border-b pb-2">اختر القارئ</h3>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto no-scrollbar">
              {RECITERS.map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => selectReciter(r)}
                  className={`p-3 rounded-xl text-sm font-bold text-right transition-all flex justify-between items-center ${
                    reciterName === r.name ? 'bg-[#2C5E3B] text-white' : 'bg-white text-[#1A120B] border border-[#E5DCB8] hover:bg-[#F7F2E8]'
                  }`}
                >
                  <span>{r.name}</span>
                  {reciterName === r.name && <span>✓</span>}
                </button>
              ))}
            </div>
            <button onClick={() => setShowReciterModal(false)} className="mt-4 w-full py-2.5 bg-[#2C5E3B] text-white rounded-xl text-sm font-bold">
              إغلاق
            </button>
          </div>
        </div>
      )}

    </div>
  );
}