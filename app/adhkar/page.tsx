import Link from 'next/link'
import type { Metadata } from 'next'
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

export const metadata: Metadata = { title: 'الأذكار والأدعية | إسلامي' }

export default function AdhkarPage() {
  const hisn = ADHKAR.filter((c) => c.group === 'hisn')
  const hisnItems = hisn.reduce((sum, c) => sum + c.items.length, 0)
  const ruqyah = ADHKAR.find((c) => c.id === 'ruqyah')
  
  const groups = ADHKAR_GROUPS.filter(
    (g) => (g.id !== 'ruqyah' || !ruqyah) && ADHKAR.some((c) => c.group === g.id),
  )

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f3ea] pb-24">
      {/* ✅ التعديل هنا: إضافة pt-[max(1rem,env(safe-area-inset-top))] لترك مسافة لشريط إشعارات الهاتف */}
      <div className="container mx-auto px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 max-w-4xl space-y-6">
        
        <PageHeader 
          title="الأذكار والأدعية" 
          subtitle="حصنك اليومي من القرآن والسنة" 
          action={
            <Suspense fallback={<div className="size-10" />}>
              <SearchButton />
            </Suspense>
          } 
        />

        {/* ============ المسبحة الإلكترونية ============ */}
        <Link
          href="/tasbih"
          className="relative overflow-hidden flex items-center gap-4 rounded-3xl bg-gradient-to-l from-[#0a1f1a] to-[#1a3a32] p-5 text-white shadow-lg transition-transform active:scale-[0.98]"
        >
          <div className="absolute -left-4 -top-4 size-24 rounded-full bg-[#d4af37]/10 blur-2xl"></div>
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#d4af37] text-[#0a1f1a] shadow-inner">
            <CircleDashed className="size-8" strokeWidth={2.5} />
          </div>
          <div className="flex-1 z-10">
            <h2 className="text-lg font-bold text-white mb-1">المسبحة الإلكترونية</h2>
            <p className="text-sm text-white/70">سبّح واحفظ أذكارك مع الانتقال التلقائي</p>
          </div>
          <ChevronLeft className="size-6 text-[#d4af37] opacity-80 z-10" />
        </Link>

        {/* ============ آية متغيرة في كل مرة ============ */}
        <AyahCard />

        {/* ============ الأقسام الرئيسية ============ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/adhkar/hisn"
            className="group relative overflow-hidden flex flex-col items-center text-center gap-3 rounded-3xl bg-white p-6 shadow-sm border border-[#e8dccb] transition-all hover:shadow-md hover:border-[#d4af37]/50"
          >
            <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
              <BookOpen className="size-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0a1f1a]">حصن المسلم كاملاً</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {toArabicNumber(hisn.length)} باباً • {toArabicNumber(hisnItems)} ذكراً
              </p>
            </div>
          </Link>

          {ruqyah && (
            <Link
              href={`/adhkar/${ruqyah.id}`}
              className="group relative overflow-hidden flex flex-col items-center text-center gap-3 rounded-3xl bg-white p-6 shadow-sm border border-[#e8dccb] transition-all hover:shadow-md hover:border-[#d4af37]/50"
            >
              <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-110">
                <Shield className="size-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0a1f1a]">الرقية الشرعية</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  من القرآن والسنة • {toArabicNumber(ruqyah.items.length)} ذكراً
                </p>
              </div>
            </Link>
          )}
        </div>

        {/* ============ مجموعات الأذكار ============ */}
        <div className="flex flex-col gap-8 mt-8">
          {groups.map((g) => {
            let GroupIcon = Heart;
            let iconColor = "text-purple-600";
            let bgColor = "bg-purple-50";
            
            if (g.id === 'daily') {
              GroupIcon = Sun;
              iconColor = "text-orange-500";
              bgColor = "bg-orange-50";
            } else if (g.id === 'situations') {
              GroupIcon = Moon;
              iconColor = "text-blue-500";
              bgColor = "bg-blue-50";
            } else if (g.id === 'dua') {
              GroupIcon = Heart;
              iconColor = "text-rose-500";
              bgColor = "bg-rose-50";
            }

            return (
              <section key={g.id} aria-labelledby={`g-${g.id}`}>
                <div className="flex items-center gap-2 mb-4 border-b border-[#e8dccb] pb-2">
                  <span className={`flex size-8 items-center justify-center rounded-lg ${bgColor} ${iconColor}`}>
                    <GroupIcon className="size-4" />
                  </span>
                  <h2 id={`g-${g.id}`} className="text-lg font-bold text-[#0a1f1a]">
                    {g.title}
                  </h2>
                </div>
                
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ADHKAR.filter((c) => c.group === g.id).map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/adhkar/${c.id}`}
                        className="group flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm border border-[#e8dccb] transition-all hover:bg-[#fdfbf7] hover:shadow-md"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f4ece1] text-sm font-bold text-[#5a3e1b] transition-colors group-hover:bg-[#d4af37] group-hover:text-white">
                          {toArabicNumber(c.items.length)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-base font-bold text-[#0a1f1a] leading-snug">{c.title}</span>
                          <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.description}</span>
                        </span>
                        <ChevronLeft className="size-4 text-[#b89965] opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>

        {/* ============ أسماء الله الحسنى ============ */}
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
                <h3 className="text-lg font-bold">أسماء الله الحسنى</h3>
                <p className="text-sm text-white/80">للتفكر والتدبر في معاني أسماء الله</p>
              </div>
            </div>
            <ChevronLeft className="size-6 opacity-80" />
          </Link>
        </div>

        <p className="mt-10 text-center text-[11px] leading-relaxed text-muted-foreground bg-white/50 p-4 rounded-xl">
          الأذكار مأخوذة من القرآن الكريم وكتاب حصن المسلم وكتب السنة، مع الاقتصار على ما صح أو حسن إسناده بحسب تخريج أهل العلم.
        </p>

      </div>
    </div>
  )
}