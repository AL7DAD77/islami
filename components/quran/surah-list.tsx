'use client'

import Link from 'next/link'
import type { Surah } from '@/lib/quran'

type SurahListProps = {
  surahs: Surah[]
}

export function SurahList({ surahs }: SurahListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3" dir="rtl">
      {surahs.map((surah) => (
        <Link
          key={surah.number}
          href={`/quran/${surah.number}`}
          className="group flex items-center justify-between p-3.5 bg-card hover:bg-[#2C5E3B]/5 rounded-2xl border border-border/60 hover:border-[#2C5E3B]/30 transition-all shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2C5E3B]/10 text-[#2C5E3B] font-bold flex items-center justify-center text-xs border border-[#2C5E3B]/20 group-hover:bg-[#2C5E3B] group-hover:text-white transition-colors">
              {surah.number}
            </div>
            <div>
              <div className="font-bold text-sm text-foreground group-hover:text-[#2C5E3B] transition-colors">
                سُورَةُ {surah.name}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {surah.revelationType} • {surah.numberOfAyahs} آية
              </div>
            </div>
          </div>

          <div className="font-mushaf text-xl text-[#2C5E3B] font-semibold pl-2">
            {surah.name}
          </div>
        </Link>
      ))}
    </div>
  )
}