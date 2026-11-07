'use client'

import Link from 'next/link'
import { 
  ChevronLeft, 
  BookOpen, 
  Shield, 
  Sun, 
  Moon, 
  Heart, 
  Star, 
  CircleDashed 
} from 'lucide-react'
import { Suspense } from 'react'
import { PageHeader } from '@/components/page-header'
import { SearchButton } from '@/components/search-button'
import { ADHKAR, ADHKAR_GROUPS } from '@/lib/adhkar'
import { toArabicNumber } from '@/lib/quran'
import { AyahCard } from '@/components/adhkar/ayah-card'
import { useLanguage } from '@/lib/language-context'

export function AdhkarMain() {
  const { dict, locale } = useLanguage()
  const hisn = ADHKAR.filter((c) => c.group === 'hisn')
  const hisnItems = hisn.reduce((sum, c) => sum + c.items.length, 0)
  const ruqyah = ADHKAR.find((c) => c.id === 'ruqyah')
  
  const groups = ADHKAR_GROUPS.filter(
    (g) => (g.id !== 'ruqyah' || !ruqyah) && ADHKAR.some((c) => c.group === g.id),
  )

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-background pb-24">
      <div className="container mx-auto px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 max-w-4xl space-y-6">
        
        <PageHeader 
          title={dict.adhkarPage.title} 
          subtitle={dict.adhkarPage.subtitle} 
          action={
            <Suspense fallback={<div className="size-10" />}>
              <SearchButton />
            </Suspense>
          } 
        />

        {/* المسبحة الإلكترونية */}
        <Link
          href="/tasbih"
          className="relative overflow-hidden flex items-center gap-4 rounded-3xl bg-gradient-to-l from-[#0a1f1a] to-[#1a3a32] p-5 text-white shadow-lg transition-transform active:scale-[0.98] dark:border dark:border-border"
        >
          <div className="absolute -left-4 -top-4 size-24 rounded-full bg-[#d4af37]/10 blur-2xl"></div>
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#d4af37] text-[#0a1f1a] shadow-inner">
            <CircleDashed className="size-8" strokeWidth={2.5} />
          </div>
          <div className="flex-1 z-10">
            <h2 className="text-lg font-bold text-white mb-1">{dict.adhkarPage.tasbih}</h2>
            <p className="text-sm text-white/70">{dict.adhkarPage.tasbihDesc}</p>
          </div>
          <ChevronLeft className="size-6 text-[#d4af37] opacity-80 z-10" />
        </Link>

        {/* آية متغيرة */}
        <AyahCard />

        {/* الأقسام الرئيسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/adhkar/hisn"
            className="group relative overflow-hidden flex flex-col items-center text-center gap-3 rounded-3xl bg-card p-6 shadow-sm border border-border transition-all hover:shadow-md hover:border-primary/50"
          >
            <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110 dark:bg-emerald-950/30 dark:text-emerald-400">
              <BookOpen className="size-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{dict.adhkarPage.hisn}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {toArabicNumber(hisn.length)} {dict.adhkarPage.babCount} • {toArabicNumber(hisnItems)} {dict.adhkarPage.dhikrCount}
              </p>
            </div>
          </Link>

          {ruqyah && (
            <Link
              href={`/adhkar/${ruqyah.id}`}
              className="group relative overflow-hidden flex flex-col items-center text-center gap-3 rounded-3xl bg-card p-6 shadow-sm border border-border transition-all hover:shadow-md hover:border-primary/50"
            >
              <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-110 dark:bg-amber-950/30 dark:text-amber-500">
                <Shield className="size-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{dict.adhkarPage.ruqyah}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {toArabicNumber(ruqyah.items.length)} {dict.adhkarPage.dhikrCount}
                </p>
              </div>
            </Link>
          )}
        </div>

        {/* مجموعات الأذكار */}
        <div className="flex flex-col gap-8 mt-8">
          {groups.map((g) => {
            let GroupIcon = Heart;
            let iconColor = "text-purple-600 dark:text-purple-400";
            let bgColor = "bg-purple-50 dark:bg-purple-950/30";
            
            if (g.id === 'daily') {
              GroupIcon = Sun;
              iconColor = "text-orange-500 dark:text-orange-400";
              bgColor = "bg-orange-50 dark:bg-orange-950/30";
            } else if (g.id === 'situations') {
              GroupIcon = Moon;
              iconColor = "text-blue-500 dark:text-blue-400";
              bgColor = "bg-blue-50 dark:bg-blue-950/30";
            } else if (g.id === 'dua') {
              GroupIcon = Heart;
              iconColor = "text-rose-500 dark:text-rose-400";
              bgColor = "bg-rose-50 dark:bg-rose-950/30";
            }

            // ترجمة عنوان المجموعة
            const groupTitle = 
              g.id === 'daily' ? dict.adhkarPage.daily :
              g.id === 'situations' ? dict.adhkarPage.situations :
              g.id === 'dua' ? dict.adhkarPage.dua : g.title;

            return (
              <section key={g.id} aria-labelledby={`g-${g.id}`}>
                <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                  <span className={`flex size-8 items-center justify-center rounded-lg ${bgColor} ${iconColor}`}>
                    <GroupIcon className="size-4" />
                  </span>
                  <h2 id={`g-${g.id}`} className="text-lg font-bold text-foreground">
                    {groupTitle}
                  </h2>
                </div>
                
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ADHKAR.filter((c) => c.group === g.id).map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/adhkar/${c.id}`}
                        className="group flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm border border-border transition-all hover:bg-muted hover:shadow-md"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          {toArabicNumber(c.items.length)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-base font-bold text-foreground leading-snug">{c.title}</span>
                          <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.description}</span>
                        </span>
                        <ChevronLeft className={`size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 ${locale === 'en' ? 'rotate-180' : ''}`} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>

        {/* أسماء الله الحسنى */}
        <div className="mt-8">
          <Link
            href="/adhkar/asmaulhusna"
            className="flex items-center justify-between rounded-3xl bg-gradient-to-l from-[#b89965] to-[#d4af37] p-5 text-white shadow-lg transition-transform active:scale-[0.98] group"
          >
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-white/20 text-white group-hover:bg-white/30 transition-colors">
                <Star className="size-6 fill-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{dict.adhkarPage.asmaulHusna}</h3>
                <p className="text-sm text-white/80">{dict.adhkarPage.asmaulHusnaDesc}</p>
              </div>
            </div>
            <ChevronLeft className={`size-6 opacity-80 ${locale === 'en' ? 'rotate-180' : ''}`} />
          </Link>
        </div>

        <p className="mt-10 text-center text-[11px] leading-relaxed text-muted-foreground bg-card border border-border p-4 rounded-xl">
          {dict.adhkarPage.footer}
        </p>

      </div>
    </div>
  )
}