'use client'

import { PageHeader } from '@/components/page-header'
import { QiblaCompass } from '@/components/qibla-compass'
import { useLanguage } from '@/lib/language-context'

export default function QiblaPage() {
  const { dict, locale } = useLanguage()

  return (
    <div className="min-h-[100dvh] bg-background pb-24" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-4 max-w-4xl space-y-6">
        
        <PageHeader 
          title={dict.qiblaPage.title} 
          subtitle={dict.qiblaPage.subtitle} 
          backHref="/more" 
        />

        <div className="relative overflow-hidden rounded-3xl bg-card p-5 text-center shadow-sm ring-1 ring-border dark:ring-border/50">
          <div className="absolute right-0 top-0 -mr-4 -mt-4 size-32 rounded-full bg-[#d4af37]/5 blur-xl dark:bg-[#d4af37]/10"></div>
          <div className="absolute left-0 bottom-0 -ml-4 -mb-4 size-32 rounded-full bg-[#0a1f1a]/5 blur-xl dark:bg-emerald-900/20"></div>
          
          <p className="font-quran text-lg md:text-xl leading-loose text-foreground font-bold px-2">
            {dict.qiblaPage.verse}
          </p>
          
          <p className="mt-3 text-[11px] font-medium text-[#b89965] dark:text-[#d4af37]">
            {dict.qiblaPage.verseSource}
          </p>
        </div>

        <QiblaCompass />

      </div>
    </div>
  )
}