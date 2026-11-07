'use client'

import Link from 'next/link'
import type { Surah } from '@/lib/quran'
import { useLanguage } from '@/lib/language-context'
import { toArabicNumber } from '@/lib/quran'

type SurahListProps = {
  surahs: Surah[]
}

export function SurahList({ surahs }: SurahListProps) {
  const { dict, locale } = useLanguage()

  // دالة مساعدة لترجمة نوع السورة (مكية/مدنية)
  const getRevelationType = (type: string) => {
    // نفترض أنك تخزنها بالإنجليزية "Meccan" أو "Medinan" أو بالعربية
    const isMeccan = type.toLowerCase().includes('meccan') || type.includes('مكية')
    if (isMeccan) return dict.surahList.meccan
    return dict.surahList.medinan
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {surahs.map((surah) => (
        <Link
          key={surah.number}
          href={`/quran/${surah.number}`}
          className="group flex items-center justify-between p-3.5 bg-card hover:bg-[#2C5E3B]/5 dark:hover:bg-[#2C5E3B]/20 rounded-2xl border border-border/60 hover:border-[#2C5E3B]/30 transition-all shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2C5E3B]/10 text-[#2C5E3B] dark:bg-[#2C5E3B]/30 dark:text-emerald-400 font-bold flex items-center justify-center text-xs border border-[#2C5E3B]/20 group-hover:bg-[#2C5E3B] group-hover:text-white transition-colors">
              {/* عرض الأرقام العربية أو الإنجليزية حسب اللغة */}
              {locale === 'ar' ? toArabicNumber(surah.number) : surah.number}
            </div>
            <div>
              <div className="font-bold text-sm text-foreground group-hover:text-[#2C5E3B] dark:group-hover:text-emerald-400 transition-colors">
                {/* ترجمة كلمة "سورة" */}
                {locale === 'ar' ? `${dict.surahList.surah} ${surah.name}` : `${dict.surahList.surah} ${surah.englishName || surah.name}`}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {/* ترجمة نوع السورة وعدد الآيات */}
                {getRevelationType(surah.revelationType)} • {locale === 'ar' ? toArabicNumber(surah.numberOfAyahs) : surah.numberOfAyahs} {dict.surahList.ayahs}
              </div>
            </div>
          </div>

          <div className="font-mushaf text-xl text-[#2C5E3B] dark:text-emerald-500 font-semibold pl-2">
            {/* عرض اسم السورة بالخط العثماني دائماً (لأنه كلام الله) */}
            {surah.name}
          </div>
        </Link>
      ))}
    </div>
  )
}