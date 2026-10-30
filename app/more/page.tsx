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
  Heart,
  Settings,
  QrCode, // ✅ أيقونة الـ QR
  X,      // ✅ أيقونة الإغلاق
  Copy,   // ✅ أيقونة النسخ
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { TileLink, SectionTitle } from '@/components/ui-kit'
import { ThemeToggle } from '@/components/theme-toggle'
import { DailyMessageToggle } from '@/components/daily-message-toggle'
import { exitNativeApp, isNativePlatform } from '@/lib/native'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import QRCode from 'react-qr-code'

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.alhaddad.islami'

const LEARN: { href: string; title: string; subtitle: string; icon: ReactNode }[] = [
  { href: '/hadith', title: 'الحديث النبوي', subtitle: 'أحاديث مختارة مع شرحها', icon: <BookOpen className="size-5" /> },
  { href: '/seerah', title: 'السيرة النبوية', subtitle: 'سيرة النبي ﷺ', icon: <Landmark className="size-5" /> },
  { href: '/prophets', title: 'قصص الأنبياء', subtitle: 'نبذة عن كل نبي', icon: <BookOpen className="size-5" /> },
  { href: '/sunan', title: 'السنن المستحبة', subtitle: 'الرواتب والمهجورة', icon: <Moon className="size-5" /> },
  { href: '/guide', title: 'الدليل', subtitle: 'دليل شامل للمسلم', icon: <Library className="size-5" /> },
  { href: '/calendar', title: 'التقويم', subtitle: 'الهجري والميلادي', icon: <CalendarDays className="size-5" /> },
]

const INFO_LINKS: { href: string; title: string; subtitle: string; icon: ReactNode }[] = [
  { href: '/more/about', title: 'عن التطبيق', subtitle: 'الإصدار والمزايا', icon: <Info className="size-5" /> },
  { href: '/more/privacy', title: 'سياسة الخصوصية', subtitle: 'كيف نحمي بياناتك', icon: <ShieldCheck className="size-5" /> },
  { href: '/more/disclaimer', title: 'إخلاء المسؤولية', subtitle: 'حدود المحتوى والخدمة', icon: <Scale className="size-5" /> },
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
  const [showQR, setShowQR] = useState(false) // ✅ حالة إظهار نافذة الـ QR
  
  useEffect(() => setIsApp(isNativePlatform()), [])

  const handleRate = () => window.open(PLAY_STORE_URL, '_blank')

  const handleShare = async () => {
    const text = 'تطبيق إسلامي شامل: مواقيت الصلاة، القرآن، الأذكار، القبلة. مجاني وبدون إعلانات!'
    
    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({
          title: 'إسلامي',
          text: text,
          url: PLAY_STORE_URL,
          dialogTitle: 'شارك التطبيق مع أصدقائك',
        })
      } catch (e) {}
    } else {
      try {
        if (navigator.share) {
          await navigator.share({ title: 'إسلامي', text, url: PLAY_STORE_URL })
        } else {
          await navigator.clipboard.writeText(`${text}\n${PLAY_STORE_URL}`)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }
      } catch {}
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(PLAY_STORE_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <PageHeader title="المزيد" subtitle="تعلّم وأدوات ومعلومات التطبيق" />

      <div className="flex flex-col gap-6">
        {/* 1. أدوات */}
        <section aria-labelledby="tools">
          <SectionTitle>
            <span id="tools">أدوات</span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <TileLink layout="stack" href="/ibadati" title="عباداتي" subtitle="متابعة يومية" icon={<ClipboardCheck className="size-5" />} />
            <TileLink layout="stack" href="/search" title="البحث" subtitle="في محتوى التطبيق" icon={<Search className="size-5" />} />
            
            <TileLink 
              layout="stack" 
              href="/more/reminders" 
              title="الصلاة على النبي ﷺ" 
              subtitle="حصن نفسك بالصلاة على الحبيب" 
              icon={<Heart className="size-5" />} 
            />
            
            <TileLink 
              layout="stack" 
              href="/prayer/settings" 
              title="الإعدادات" 
              subtitle="الموقع، الأذان، والإشعارات" 
              icon={<Settings className="size-5" />} 
            />
          </div>
        </section>

        {/* 2. تعلّم */}
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

        {/* 3. إعدادات التطبيق */}
        <section aria-labelledby="app-settings">
          <SectionTitle>
            <span id="app-settings">إعدادات التطبيق</span>
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

            {/* ✅ زر الـ QR الجديد هنا */}
            <ActionTile
              title="رمز الـ QR"
              subtitle="امسح وشارك بسرعة"
              icon={<QrCode className="size-5" aria-hidden="true" />}
              onClick={() => setShowQR(true)}
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

        {/* 4. المساعدة والدعم */}
        <section aria-labelledby="support">
          <SectionTitle>
            <span id="support">المساعدة والدعم</span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <TileLink layout="stack" href="/more/support" title="الدعم والتواصل" subtitle="أرسل ملاحظتك أو بلاغك" icon={<LifeBuoy className="size-5" />} />
          </div>
        </section>

        {/* 5. حول التطبيق */}
        <section aria-labelledby="about">
          <SectionTitle>
            <span id="about">حول التطبيق</span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {INFO_LINKS.map((l) => (
              <TileLink key={l.href} layout="stack" href={l.href} title={l.title} subtitle={l.subtitle} icon={l.icon} />
            ))}
          </div>
        </section>
      </div>

      {/* ✅ نافذة الـ QR المنبثقة (Modal) هنا */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" dir="rtl">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-zinc-900">
            <button
              onClick={() => setShowQR(false)}
              className="absolute left-4 top-4 rounded-full bg-zinc-100 p-2 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
            >
              <X className="size-5" />
            </button>
            
            <h2 className="mb-1 text-xl font-bold text-zinc-800 dark:text-zinc-100">امسح الكود للتحميل</h2>
            <p className="mb-6 text-xs text-muted-foreground">
              اجعل صديقك يمسح هذا الكود بكاميرا هاتفه ليحمل التطبيق فوراً
            </p>

            <div className="mx-auto mb-6 flex w-full items-center justify-center rounded-2xl border-4 border-emerald-500/30 bg-white p-4">
              <QRCode
                value={PLAY_STORE_URL}
                size={200}
                level="H"
                fgColor="#0a1f1a"
              />
            </div>

            <button
              onClick={copyLink}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? 'تم نسخ الرابط' : 'نسخ الرابط يدوياً'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}