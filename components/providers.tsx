'use client'

import React from 'react'
import { QuranPlayerProvider } from '@/lib/quran-player'
import { SurahPlayer } from '@/components/quran/surah-player'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QuranPlayerProvider>
      {children}
      {/* شريط المشغل الثابت في الأسفل ليبقى ظاهراً ويعزف بسلاسة */}
      <SurahPlayer />
    </QuranPlayerProvider>
  )
}