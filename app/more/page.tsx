'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Search,
  Check,
  Info,
  Landmark,
  LifeBuoy,
  Library,
  LogOut,
  Moon,
  Scale,
  Share2,
  ShieldCheck,
  Star,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { TileLink, SectionTitle } from '@/components/ui-kit'
import { ThemeToggle } from '@/components/theme-toggle'
import { DailyMessageToggle } from '@/components/daily-message-toggle'
import { exitNativeApp, isNativePlatform } from '@/lib/native'

// ⚠️ ضع رابط التطبيق الحقيقي على Google Play هنا لاحقاً
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.alhaddad.islami'

// كل الأيقونات من مكتبة lucide المستخدمة في التطبيق، والنصوص من محتوى التطبيق نفسه
const LEARN: { href: string; title: string; subtitle: string; icon: ReactNode }[] = [
  { href: '/hadith', title: 'الحديث النبوي', subtitle: 'أحاديث مختارة مع شرحها', icon: <BookOpen className="size-5" /> },
  { href: '/seerah', title: 'السيرة النبوية', subtitle: 'سيرة النبي ﷺ', icon: <Landmark className="size-5" /> },
  { href: '/prophets', title: 'قصص الأنبياء', subtitle: 'نبذة عن كل نبي', icon: <BookOpen className="size-5" /> },
  { href: '/sunan', title: 'السنن المستحبة', subtitle: 'الرواتب والمهجورة', icon: <Moon className="size-5" /> },
  { href: '/guide', title: 'الدليل', subtitle: 'دليل شامل للمسلم', icon: <Library className="size-5" /> },
  { href: '/calendar', title: 'التقويم', subtitle: 'الهجري والميلادي', icon: <CalendarDays className="size-5" /> },
]

const ABOUT: { href: string; title: string; subtitle: string; icon: ReactNode }[] = [
  { href: '/more/support', title: 'الدعم والتواصل', subtitle: 'أرسل ملاحظتك', icon: <LifeBuoy className="size-5" /> },
  { href: '/more/privacy', title: 'سياسة الخصوصية', subtitle: 'كيف نحمي بياناتك', icon: <ShieldCheck className="size-5" /> },
  { href: '/more/disclaimer', title: 'إخلاء المسؤولية', subtitle: 'حدود المحتوى والخدمة', icon: <Scale className="size-5" /> },
  { href: '/more/about', title: 'عن التطبيق', subtitle: 'الإصدار والمزايا', icon: <Info className="size-5" /> },
]

function ActionTile({ title, subtitle, icon, onClick }: { title: string; subtitle: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-card p-3 py-4 text-center shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">{icon}</span>
      <span className="line-clamp-2 block text-sm font-bold leading-snug">{title}</span>
      <span className="line-clamp-1 block text-[11px] text-muted-foreground">{subtitle}</span>
    </button>
  )
}

export default function MorePage() {
  const [copied, setCopied] = useState(false)
  const [isApp, setIsApp] = useState(false)
  useEffect(() => setIsApp(isNativePlatform()), [])

  const handleRate = () => window.open(PLAY_STORE_URL, '_blank')

  const handleShare = async () => {
    const shareData = {
      title: 'إسلامي',
      text: 'تطبيق إسلامي شامل: مواقيت الصلاة، القرآن، الأذكار، القبلة. مجاني وبدون إعلانات!',
      url: PLAY_STORE_URL,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // المستخدم ألغى المشاركة
    }
  }

  return (
    <>
      <PageHeader title="المزيد" subtitle="تعلّم وأدوات ومعلومات التطبيق" />

      <div className="flex flex-col gap-6">
        <section aria-labelledby="tools">
          <SectionTitle>
            <span id="tools">أدوات</span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <TileLink layout="stack" href="/ibadati" title="عباداتي" subtitle="متابعة يومية" icon={<ClipboardCheck className="size-5" />} />
            <TileLink layout="stack" href="/search" title="البحث" subtitle="في محتوى التطبيق" icon={<Search className="size-5" />} />
          </div>
        </section>

        <section aria-labelledby="learn">
          <SectionTitle>
            <span id="learn">تعلّم</span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {LEARN.map((l) => (
              <TileLink key={l.href} layout="stack" href={l.href} title={l.title} subtitle={l.subtitle} icon={l.icon} />
            ))}
          </div>
        </section>

        <section aria-labelledby="app">
          <SectionTitle>
            <span id="app">التطبيق</span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <ThemeToggle />
            <DailyMessageToggle />
            <ActionTile
              title="قيّم التطبيق"
              subtitle="رأيك يهمّنا"
              icon={<Star className="size-5" aria-hidden="true" />}
              onClick={handleRate}
            />
            <ActionTile
              title={copied ? 'تم نسخ الرابط' : 'شارك التطبيق'}
              subtitle="انشر الخير"
              icon={copied ? <Check className="size-5" aria-hidden="true" /> : <Share2 className="size-5" aria-hidden="true" />}
              onClick={handleShare}
            />
            {isApp && (
              <ActionTile
                title="خروج"
                subtitle="الأذان يبقى يعمل"
                icon={<LogOut className="size-5" aria-hidden="true" />}
                onClick={() => exitNativeApp()}
              />
            )}
          </div>
        </section>

        <section aria-labelledby="about">
          <SectionTitle>
            <span id="about">حول التطبيق</span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {ABOUT.map((l) => (
              <TileLink key={l.href} layout="stack" href={l.href} title={l.title} subtitle={l.subtitle} icon={l.icon} />
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
