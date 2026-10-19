'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RecitersBrowser({ reciters }: { reciters: any[] }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // تصفية القراء بناءً على اسم القارئ أو الرواية
  const filteredReciters = (reciters || []).filter((reciter) => {
    const name = reciter?.name || reciter?.reciter_name || '';
    const rewaya = reciter?.rewaya || reciter?.rewaya_name || '';
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rewaya.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // دالة اختيار المقرئ وحفظه والتوجيه المباشر
  const handleSelectReciter = (reciter: any) => {
    // استخراج رابط السيرفر بأي صيغة متوفرة في API
    const serverUrl =
      reciter?.Server ||
      reciter?.server ||
      reciter?.moshaf?.[0]?.server ||
      reciter?.server_url ||
      'https://server8.mp3quran.net/afs/';

    const reciterName = reciter?.name || reciter?.reciter_name || 'قارئ مختار';

    // حفظ القارئ المختار في الذاكرة المحلية
    localStorage.setItem('selected_reciter_server', serverUrl);
    localStorage.setItem('selected_reciter_name', reciterName);

    // الرجوع المباشر لصفحة المصحف والتلاوة
    router.back();
  };

  return (
    <div className="w-full flex flex-col gap-4" dir="rtl">
      {/* شريط البحث */}
      <div className="relative w-full">
        <input
          type="text"
          placeholder="ابحث باسم القارئ أو الرواية (مثل: العفاسي، المعيقلي...)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-[#241b16] border border-[#c5a059]/40 rounded-xl text-[#fbf8f0] placeholder-stone-400 focus:outline-none focus:border-[#c5a059] shadow-inner text-sm md:text-base text-right"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c5a059]">🔍</span>
      </div>

      {/* قائمة القراء - بطاقات قابلة للنقر مباشرة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto p-1">
        {filteredReciters.length > 0 ? (
          filteredReciters.map((reciter, index) => {
            const name = reciter?.name || reciter?.reciter_name || 'قارئ';
            const rewaya = reciter?.rewaya || reciter?.moshaf?.[0]?.name || 'حفص عن عاصم';

            return (
              <button
                type="button"
                key={reciter?.id || index}
                onClick={() => handleSelectReciter(reciter)}
                className="w-full bg-[#241b16] border border-[#c5a059]/30 hover:border-[#c5a059] p-4 rounded-xl shadow-md cursor-pointer transition-all duration-200 hover:bg-[#2d221c] active:scale-[0.98] flex items-center justify-between text-right"
              >
                <div className="flex flex-col gap-1 pointer-events-none">
                  <h3 className="text-[#fbf8f0] font-bold text-base hover:text-amber-200 transition-colors">
                    {name}
                  </h3>
                  <span className="text-xs text-[#c5a059] bg-[#1a1410] px-2 py-0.5 rounded-md w-fit border border-[#c5a059]/20">
                    {rewaya}
                  </span>
                </div>

                <div className="flex items-center gap-2 pointer-events-none">
                  <span className="text-xs text-stone-400 bg-black/30 px-2 py-1 rounded">
                    مصحف مرتل
                  </span>
                  <span className="w-10 h-10 rounded-full bg-[#3a5a40] text-[#fbf8f0] flex items-center justify-center text-base shadow-sm">
                    ▶
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 text-stone-400">
            لا توجد نتائج مطابقة لبحثك.
          </div>
        )}
      </div>
    </div>
  );
}