'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  CalendarDays,
  Check,
  Compass,
  Copy,
  HandHeart,
  Info,
  Landmark,
  LifeBuoy,
  LogOut,
  QrCode,
  Scale,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import QRCode from 'react-qr-code'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { PageHeader } from '@/components/page-header'
import { SectionTitle } from '@/components/ui-kit'
import { ThemeToggle } from '@/components/theme-toggle'
import { DailyMessageToggle } from '@/components/daily-message-toggle'
import { exitNativeApp, isNativePlatform } from '@/lib/native'
import { useLanguage } from '@/lib/language-context'

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.alhaddad.islami'

interface LiveCardProps {
  title: string
  subtitle?: string
  href?: string
  onClick?: () => void
  icon: ReactNode
}

function LiveVisualCard({
  title,
  subtitle,
  href,
  onClick,
  icon,
}: LiveCardProps) {
  const router = useRouter()

  const handlePress = () => {
    if (onClick) {
      onClick()
      return
    }
    if (href) {
      try {
        router.push(href)
      } catch {
        window.location.assign(href)
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handlePress}
      className="block w-full text-right"
    >
      <div className="group flex min-h-[118px] w-full flex-col items-center justify-center gap-2.5 rounded-2xl border border-border bg-card p-4 text-center text-card-foreground shadow-xs transition-all duration-200 hover:bg-muted/60 active:scale-[0.98]">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-background text-foreground shadow-2xs transition-transform duration-200 group-hover:scale-105 dark:bg-zinc-900 dark:text-zinc-100">
          {icon}
        </div>

        <span className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
          {title}
        </span>

        {subtitle ? (
          <span className="line-clamp-1 text-[11px] text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </div>
    </button>
  )
}

export default function MorePage() {
  const { dict, locale } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [isApp, setIsApp] = useState(false)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => setIsApp(isNativePlatform()), [])

  const handleRate = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(PLAY_STORE_URL)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {}
    setShowQR(true)
  }

  const handleShare = async () => {
    const text = dict.morePage.subtitle

    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({
          title: 'Islami',
          text,
          url: PLAY_STORE_URL,
          dialogTitle: dict.morePage.share,
        })
      } catch {}
    } else {
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'Islami',
            text,
            url: PLAY_STORE_URL,
          })
        } else {
          await navigator.clipboard.writeText(`${text}\n${PLAY_STORE_URL}`)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }
      } catch {}
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(PLAY_STORE_URL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const LEARN = [
    {
      href: '/seerah',
      title: dict.morePage.seerah,
      icon: <Landmark className="size-6" strokeWidth={1.85} />,
    },
    {
      href: '/prophets',
      title: dict.morePage.prophets,
      icon: <BookOpen className="size-6" strokeWidth={1.85} />,
    },
    {
      href: '/sunan',
      title: dict.morePage.sunan,
      icon: <Sparkles className="size-6" strokeWidth={1.85} />,
    },
    {
      href: '/guide',
      title: dict.morePage.guide,
      icon: <Compass className="size-6" strokeWidth={1.85} />,
    },
    {
      href: '/calendar',
      title: dict.morePage.calendar,
      icon: <CalendarDays className="size-6" strokeWidth={1.85} />,
    },
    {
      href: '/kids',
      title: locale === 'ar' ? 'ركن الأطفال' : 'Kids Corner',
      icon: <Star className="size-6" strokeWidth={1.85} />,
    },
  ]

  const INFO_LINKS = [
    {
      href: '/more/about',
      title: dict.morePage.aboutApp,
      icon: <Info className="size-6" strokeWidth={1.85} />,
    },
    {
      href: '/more/privacy',
      title: dict.morePage.privacy,
      icon: <ShieldCheck className="size-6" strokeWidth={1.85} />,
    },
    {
      href: '/more/disclaimer',
      title: dict.morePage.disclaimer,
      icon: <Scale className="size-6" strokeWidth={1.85} />,
    },
  ]

  return (
    <>
      <PageHeader
        title={dict.morePage.title}
        subtitle={dict.morePage.subtitle}
      />

      <div className="flex flex-col gap-6 pb-24">
        {/* 1. أدوات */}
        <section aria-labelledby="tools">
          <SectionTitle>
            <span id="tools">{dict.morePage.tools}</span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <LiveVisualCard
              href="/ibadati"
              title={dict.morePage.ibadati}
              icon={<BookOpen className="size-6" strokeWidth={1.85} />}
            />
            <LiveVisualCard
              href="/search"
              title={dict.morePage.search}
              icon={<Search className="size-6" strokeWidth={1.85} />}
            />
            <LiveVisualCard
              href="/more/reminders"
              title={dict.morePage.reminders}
              icon={<HandHeart className="size-6" strokeWidth={1.85} />}
            />
            <LiveVisualCard
              href="/prayer/settings"
              title={dict.morePage.prayerSettings}
              icon={<Settings className="size-6" strokeWidth={1.85} />}
            />
          </div>
        </section>

        {/* 2. تعلّم */}
        <section aria-labelledby="learn">
          <SectionTitle>
            <span id="learn">{dict.morePage.learn}</span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {LEARN.map((l) => (
              <LiveVisualCard
                key={l.href}
                href={l.href}
                title={l.title}
                icon={l.icon}
              />
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
            <LiveVisualCard
              title={dict.morePage.rate}
              icon={<Star className="size-6" strokeWidth={1.85} />}
              onClick={handleRate}
            />
            <LiveVisualCard
              title={copied ? 'Copied!' : dict.morePage.share}
              icon={
                copied ? (
                  <Check className="size-6" strokeWidth={1.85} />
                ) : (
                  <Share2 className="size-6" strokeWidth={1.85} />
                )
              }
              onClick={handleShare}
            />
            <LiveVisualCard
              title={dict.morePage.qr}
              icon={<QrCode className="size-6" strokeWidth={1.85} />}
              onClick={() => setShowQR(true)}
            />
            <LiveVisualCard
              title={dict.morePage.exit}
              icon={<LogOut className="size-6" strokeWidth={1.85} />}
              onClick={async () => {
                if (isApp) {
                  await exitNativeApp()
                } else {
                  window.close()
                }
              }}
            />
          </div>
        </section>

        {/* 4. المساعدة والدعم */}
        <section aria-labelledby="support">
          <SectionTitle>
            <span id="support">{dict.morePage.support}</span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <LiveVisualCard
              href="/more/support"
              title={dict.morePage.supportTile}
              icon={<LifeBuoy className="size-6" strokeWidth={1.85} />}
            />
          </div>
        </section>

        {/* 5. حول التطبيق */}
        <section aria-labelledby="about">
          <SectionTitle>
            <span id="about">{dict.morePage.about}</span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {INFO_LINKS.map((l) => (
              <LiveVisualCard
                key={l.href}
                href={l.href}
                title={l.title}
                icon={l.icon}
              />
            ))}
          </div>
        </section>
      </div>

      {/* نافذة الـ QR */}
      {showQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          dir="rtl"
        >
          <div className="relative w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl ring-1 ring-border">
            <button
              type="button"
              onClick={() => setShowQR(false)}
              className="absolute left-4 top-4 rounded-full bg-muted p-2 text-muted-foreground hover:bg-muted/80"
            >
              <X className="size-5" />
            </button>
            <h2 className="mb-1 text-xl font-bold text-foreground">
              {dict.morePage.qr}
            </h2>
            <div className="mx-auto mb-6 mt-4 flex w-full items-center justify-center rounded-2xl border-4 border-border bg-white p-4">
              <QRCode
                value={PLAY_STORE_URL}
                size={200}
                level="H"
                fgColor="#09090b"
              />
            </div>
            <button
              type="button"
              onClick={copyLink}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-sm font-bold text-foreground transition hover:bg-muted/80"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? 'تم النسخ' : 'نسخ الرابط'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
