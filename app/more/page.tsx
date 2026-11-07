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
  QrCode,
  X,
  Copy,
  BookMarked, // ✅ أيقونة جديدة للصحيحين
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { TileLink, SectionTitle } from '@/components/ui-kit'
import { ThemeToggle } from '@/components/theme-toggle'
import { DailyMessageToggle } from '@/components/daily-message-toggle'
import { exitNativeApp, isNativePlatform } from '@/lib/native'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import QRCode from 'react-qr-code'
import { useLanguage } from '@/lib/language-context'

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.alhaddad.islami'

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
  const { dict } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [isApp, setIsApp] = useState(false)
  const [showQR, setShowQR] = useState(false)
  
  useEffect(() => setIsApp(isNativePlatform()), [])

  const handleRate = () => window.open(PLAY_STORE_URL, '_blank')

  const handleShare = async () => {
    const text = dict.morePage.subtitle
    
    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({
          title: 'Islami',
          text: text,
          url: PLAY_STORE_URL,
          dialogTitle: dict.morePage.share,
        })
      } catch (e) {}
    } else {
      try {
        if (navigator.share) {
          await navigator.share({ title: 'Islami', text, url: PLAY_STORE_URL })
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

  const LEARN = [
    { href: '/hadith', title: dict.morePage.hadith, subtitle: '', icon: <BookOpen className="size-5" /> },
    { href: '/sahihayn', title: dict.morePage.sahihayn, subtitle: '', icon: <BookMarked className="size-5" /> }, // ✅ الصحيحان
    { href: '/seerah', title: dict.morePage.seerah, subtitle: '', icon: <Landmark className="size-5" /> },
    { href: '/prophets', title: dict.morePage.prophets, subtitle: '', icon: <BookOpen className="size-5" /> },
    { href: '/sunan', title: dict.morePage.sunan, subtitle: '', icon: <Moon className="size-5" /> },
    { href: '/guide', title: dict.morePage.guide, subtitle: '', icon: <Library className="size-5" /> },
    { href: '/calendar', title: dict.morePage.calendar, subtitle: '', icon: <CalendarDays className="size-5" /> },
  ]

  const INFO_LINKS = [
    { href: '/more/about', title: dict.morePage.aboutApp, subtitle: '', icon: <Info className="size-5" /> },
    { href: '/more/privacy', title: dict.morePage.privacy, subtitle: '', icon: <ShieldCheck className="size-5" /> },
    { href: '/more/disclaimer', title: dict.morePage.disclaimer, subtitle: '', icon: <Scale className="size-5" /> },
  ]

  return (
    <>
      <PageHeader title={dict.morePage.title} subtitle={dict.morePage.subtitle} />

      <div className="flex flex-col gap-6">
        {/* 1. أدوات */}
        <section aria-labelledby="tools">
          <SectionTitle>
            <span id="tools">{dict.morePage.tools}</span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <TileLink layout="stack" href="/ibadati" title={dict.morePage.ibadati} subtitle="" icon={<ClipboardCheck className="size-5" />} />
            <TileLink layout="stack" href="/search" title={dict.morePage.search} subtitle="" icon={<Search className="size-5" />} />
            <TileLink layout="stack" href="/more/reminders" title={dict.morePage.reminders} subtitle="" icon={<Heart className="size-5" />} />
            <TileLink layout="stack" href="/prayer/settings" title={dict.morePage.prayerSettings} subtitle="" icon={<Settings className="size-5" />} />
          </div>
        </section>

        {/* 2. تعلّم */}
        <section aria-labelledby="learn">
          <SectionTitle>
            <span id="learn">{dict.morePage.learn}</span>
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
            <span id="app-settings">{dict.morePage.appSettings}</span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <ThemeToggle />
            <DailyMessageToggle />
            <ActionTile
              title={dict.morePage.rate}
              subtitle=""
              icon={<Star className="size-5" aria-hidden="true" />}
              onClick={handleRate}
            />
            <ActionTile
              title={copied ? 'Copied!' : dict.morePage.share}
              subtitle=""
              icon={copied ? <Check className="size-5" aria-hidden="true" /> : <Share2 className="size-5" aria-hidden="true" />}
              onClick={handleShare}
            />
            <ActionTile
              title={dict.morePage.qr}
              subtitle=""
              icon={<QrCode className="size-5" aria-hidden="true" />}
              onClick={() => setShowQR(true)}
            />
            {isApp && (
              <ActionTile
                title={dict.morePage.exit}
                subtitle=""
                icon={<LogOut className="size-5" aria-hidden="true" />}
                onClick={() => exitNativeApp()}
              />
            )}
          </div>
        </section>

        {/* 4. المساعدة والدعم */}
        <section aria-labelledby="support">
          <SectionTitle>
            <span id="support">{dict.morePage.support}</span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <TileLink layout="stack" href="/more/support" title={dict.morePage.supportTile} subtitle="" icon={<LifeBuoy className="size-5" />} />
          </div>
        </section>

        {/* 5. حول التطبيق */}
        <section aria-labelledby="about">
          <SectionTitle>
            <span id="about">{dict.morePage.about}</span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {INFO_LINKS.map((l) => (
              <TileLink key={l.href} layout="stack" href={l.href} title={l.title} subtitle={l.subtitle} icon={l.icon} />
            ))}
          </div>
        </section>
      </div>

      {/* ✅ نافذة الـ QR */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" dir="rtl">
          <div className="relative w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl ring-1 ring-border">
            <button
              onClick={() => setShowQR(false)}
              className="absolute left-4 top-4 rounded-full bg-muted p-2 text-muted-foreground hover:bg-muted/80"
            >
              <X className="size-5" />
            </button>
            <h2 className="mb-1 text-xl font-bold text-foreground">
              {dict.morePage.qr}
            </h2>
            <div className="mx-auto mb-6 mt-4 flex w-full items-center justify-center rounded-2xl border-4 border-emerald-500/30 bg-white p-4">
              <QRCode value={PLAY_STORE_URL} size={200} level="H" fgColor="#0a1f1a" />
            </div>
            <button
              onClick={copyLink}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-sm font-bold text-foreground transition hover:bg-muted/80"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? 'تم النسخ' : 'نسخ الرابط'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}