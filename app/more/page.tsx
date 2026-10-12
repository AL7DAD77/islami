'use client'

import { useEffect, useState } from 'react'
import {
  BookOpen,
  CalendarDays,
  Check,
  Info,
  LifeBuoy,
  LogOut,
  Moon,
  Scale,
  Share2,
  ShieldCheck,
  Star,
  Library,
  Landmark,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { SectionTitle, TileLink } from '@/components/ui-kit'
import { ThemeToggle } from '@/components/theme-toggle'
import { exitNativeApp, isNativePlatform } from '@/lib/native'
import { cn } from '@/lib/utils'

// ⚠️ ضع رابط التطبيق الحقيقي على Google Play هنا لاحقاً
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.alhaddad.islami'

const LEARN = [
  { href: '/seerah', title: 'السيرة النبوية', subtitle: 'سيرة النبي ﷺ', icon: <Landmark className="size-5" /> },
  { href: '/prophets', title: 'قصص الأنبياء', subtitle: 'نبذة عن كل نبي', icon: <BookOpen className="size-5" /> },
  { href: '/sunan', title: 'السنن المستحبة', subtitle: 'الرواتب والمهجورة', icon: <Moon className="size-5" /> },
  { href: '/guide', title: 'الدليل', subtitle: 'دليل شامل للمسلم', icon: <Library className="size-5" /> },
]

const ABOUT = [
  { href: '/more/support', title: 'الدعم والتواصل', icon: <LifeBuoy className="size-4" /> },
  { href: '/more/privacy', title: 'سياسة الخصوصية', icon: <ShieldCheck className="size-4" /> },
  { href: '/more/disclaimer', title: 'إخلاء المسؤولية', icon: <Scale className="size-4" /> },
  { href: '/more/about', title: 'عن التطبيق', icon: <Info className="size-4" /> },
]

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

  const actionBtn =
    'flex items-center gap-3 rounded-2xl bg-card p-3 text-right shadow-sm ring-1 ring-border transition-colors hover:bg-secondary'

  return (
    <>
      <PageHeader title="المزيد" subtitle="تعلّم وأدوات ومعلومات التطبيق" />

      <div className="flex flex-col gap-6">
        <section aria-labelledby="learn">
          <SectionTitle>
            <span id="learn">تعلّم وتزوّد</span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-2.5">
            {LEARN.map((l) => (
              <TileLink key={l.href} href={l.href} title={l.title} subtitle={l.subtitle} icon={l.icon} />
            ))}
            <TileLink
              href="/calendar"
              title="التقويم"
              subtitle="الهجري والميلادي"
              icon={<CalendarDays className="size-5" />}
              className="col-span-2"
            />
          </div>
        </section>

        <section aria-labelledby="app">
          <SectionTitle>
            <span id="app">التطبيق</span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-2.5">
            <ThemeToggle />
            <button type="button" onClick={handleRate} className={actionBtn}>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-gold">
                <Star className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">قيّم التطبيق</span>
                <span className="block text-[11px] text-muted-foreground">رأيك يهمّنا</span>
              </span>
            </button>
            <button type="button" onClick={handleShare} className={cn(actionBtn, !isApp && 'col-span-2')}>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                {copied ? <Check className="size-5" aria-hidden="true" /> : <Share2 className="size-5" aria-hidden="true" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{copied ? 'تم نسخ الرابط' : 'شارك التطبيق'}</span>
                <span className="block text-[11px] text-muted-foreground">انشر الخير</span>
              </span>
            </button>
            {isApp && (
              <button type="button" onClick={() => exitNativeApp()} className={actionBtn}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <LogOut className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">خروج</span>
                  <span className="block text-[11px] text-muted-foreground">الأذان يبقى يعمل</span>
                </span>
              </button>
            )}
          </div>
        </section>

        <section aria-labelledby="about">
          <SectionTitle>
            <span id="about">حول التطبيق</span>
          </SectionTitle>
          <ul className="divide-y overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
            {ABOUT.map((l) => (
              <li key={l.href}>
                <TileLink
                  href={l.href}
                  title={l.title}
                  icon={l.icon}
                  chevron
                  className="rounded-none bg-transparent p-3.5 shadow-none ring-0 hover:bg-secondary"
                />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
