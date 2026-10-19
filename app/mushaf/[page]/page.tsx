'use client';

import { useEffect, useState } from 'react';

export default function MushafPage() {
  const [pageHtml, setPageHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [pageNumber, setPageNumber] = useState(1); // ابدأ بالصفحة 1

  useEffect(() => {
    async function loadPage() {
      setLoading(true);
      try {
        // جلب ملف قاعدة البيانات من مجلد public
        const response = await fetch('/qpc-v2-15-lines.db');
        const buffer = await response.arrayBuffer();
        
        // تحويل الملف إلى نص (بما أنه ملف SQLite، سنستخدم طريقة بسيطة لقراءته كنص)
        // ملاحظة: هذا الكود يفترض أن ملف الـ db يحتوي على نص الصفحة كاملاً.
        // في التطبيقات الاحترافية، يتم استخدام مكتبة sql.js، ولكن لتبسيط الأمر الآن:
        
        // --- بديل مؤقت لضمان العرض (سنستخدم بيانات وهمية للتأكد من عمل الخط) ---
        // بمجرد أن تعمل الصفحة، سنستبدل هذا الجزء بالكود الذي يقرأ من ملفك الفعلي.
        setPageHtml(`
          <div class="text-center mb-6">
            <h2 class="text-2xl font-bold mb-2">سُورَةُ الفَاتِحَةِ</h2>
            <p class="text-sm text-gray-500">الجزء ١</p>
          </div>
          <div class="text-3xl leading-[4rem]">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ١
            <br/>
            الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ٢
            <br/>
            الرَّحْمَٰنِ الرَّحِيمِ ٣
            <br/>
            مَالِكِ يَوْمِ الدِّينِ ٤
            <br/>
            إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ٥
            <br/>
            اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ٦
            <br/>
            صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ ٧
          </div>
        `);
        
      } catch (error) {
        console.error("خطأ في تحميل المصحف:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [pageNumber]);

  if (loading) return <div className="p-10 text-center">جاري تحميل المصحف...</div>;

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 flex justify-center items-start">
      <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg border-2 border-amber-200">
        <div 
          className="font-mushaf text-3xl"
          dangerouslySetInnerHTML={{ __html: pageHtml }}
        />
      </div>
    </div>
  );
}