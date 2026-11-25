'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
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

type CardThemeKey =
  | 'emerald'
  | 'indigo'
  | 'rose'
  | 'amber'
  | 'teal'
  | 'violet'
  | 'sky'
  | 'slate'

interface CardPalette {
  cardBg: string
  glowColor: string
  badgeBg: string
  borderColor: string
}

const CARD_PALETTES: Record<CardThemeKey, CardPalette> = {
  emerald: {
    cardBg: 'linear-gradient(135deg, #064e3b 0%, #0f766e 55%, #022c22 100%)',
    glowColor: 'rgba(110, 231, 183, 0.28)',
    badgeBg: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(167, 243, 208, 0.28)',
  },
  indigo: {
    cardBg: 'linear-gradient(135deg, #1e1b4b 0%, #1d4ed8 55%, #090d16 100%)',
    glowColor: 'rgba(147, 197, 253, 0.28)',
    badgeBg: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(191, 219, 254, 0.28)',
  },
  rose: {
    cardBg: 'linear-gradient(135deg, #4c0519 0%, #9f1239 55%, #1c1917 100%)',
    glowColor: 'rgba(253, 164, 175, 0.28)',
    badgeBg: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(254, 205, 211, 0.28)',
  },
  amber: {
    cardBg: 'linear-gradient(135deg, #451a03 0%, #b45309 55%, #1c1917 100%)',
    glowColor: 'rgba(252, 211, 77, 0.28)',
    badgeBg: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(253, 230, 138, 0.28)',
  },
  teal: {
    cardBg: 'linear-gradient(135deg, #042f2e 0%, #0f766e 55%, #090d16 100%)',
    glowColor: 'rgba(94, 234, 212, 0.28)',
    badgeBg: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(153, 246, 228, 0.28)',
  },
  violet: {
    cardBg: 'linear-gradient(135deg, #2e1065 0%, #6d28d9 55%, #090d16 100%)',
    glowColor: 'rgba(196, 181, 253, 0.28)',
    badgeBg: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(221, 214, 254, 0.28)',
  },
  sky: {
    cardBg: 'linear-gradient(135deg, #082f49 0%, #0369a1 55%, #090d16 100%)',
    glowColor: 'rgba(125, 211, 252, 0.28)',
    badgeBg: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(186, 230, 253, 0.28)',
  },
  slate: {
    cardBg: 'linear-gradient(135deg, #1e293b 0%, #334155 55%, #090d16 100%)',
    glowColor: 'rgba(203, 213, 225, 0.26)',
    badgeBg: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(226, 232, 240, 0.28)',
  },
}

interface LiveCardProps {
  title: string
  subtitle?: string
  href?: string
  onClick?: () => void
  icon: ReactNode
  theme: CardThemeKey
}

function LiveVisualCard({
  title,
  subtitle,
  href,
  onClick,
  icon,
  theme,
}: LiveCardProps) {
  const [pointer, setPointer] = useState({ x: 50, y: 50 })
  const palette = CARD_PALETTES[theme]

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    setPointer({ x, y })
  }

  const cardBody = (
    <div
      onPointerMove={handlePointerMove}
      style={{
        background: palette.cardBg,
        borderColor: palette.borderColor,
      }}
      className="group relative flex min-h-[118px] w-full flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border p-4 text-center shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
    >
      <div
        className="pointer-events-none absolute -inset-6 opacity-75 blur-2xl transition-all duration-500 animate-pulse"
        style={{
          background: `radial-gradient(circle at ${pointer.x}% ${pointer.y}%, ${palette.glowColor}, transparent 65%)`,
        }}
      />

      <div
        style={{
          backgroundColor: palette.badgeBg,
          borderColor: palette.borderColor,
        }}
        className="relative z-10 flex size-12 items-center justify-center rounded-2xl border text-white shadow-inner backdrop-blur-xs transition-transform duration-300 group-hover:scale-110"
      >
        {icon}
      </div>

      <span
        style={{ color: '#ffffff' }}
        className="relative z-10 line-clamp-2 text-sm font-bold leading-snug"
      >
        {title}
      </span>

      {subtitle ? (
        <span
          style={{ color: 'rgba(255, 255, 255, 0.85)' }}
          className="relative z-10 line-clamp-1 text-[11px]"
        >
          {subtitle}
        </span>
      ) : null}
    </div>
  )

  if (href) {
    return (
      <a href={href} className="block w-full">
        {cardBody}
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} className="block w-full text-right">
      {cardBody}
    </button>
  )
}

export default function MorePage() {
  const { dict, locale } = useLanguage()
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
    await navigator.clipboard.writeText(PLAY_STORE_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const LEARN = [
    {
      href: '/seerah',
      title: dict.morePage.seerah,
      theme: 'emerald' as const,
      icon: <Landmark className="size-6 text-white" strokeWidth={1.85} />,
    },
    {
      href: '/prophets',
      title: dict.morePage.prophets,
      theme: 'amber' as const,
      icon: <BookOpen className="size-6 text-white" strokeWidth={1.85} />,
    },
    {
      href: '/sunan',
      title: dict.morePage.sunan,
      theme: 'teal' as const,
      icon: <Sparkles className="size-6 text-white" strokeWidth={1.85} />,
    },
    {
      href: '/guide',
      title: dict.morePage.guide,
      theme: 'sky' as const,
      icon: <Compass className="size-6 text-white" strokeWidth={1.85} />,
    },
    {
      href: '/calendar',
      title: dict.morePage.calendar,
      theme: 'violet' as const,
      icon: <CalendarDays className="size-6 text-white" strokeWidth={1.85} />,
    },
    {
      href: '/kids',
      title: locale === 'ar' ? 'ركن الأطفال' : 'Kids Corner',
      theme: 'rose' as const,
      icon: <Star className="size-6 text-white" strokeWidth={1.85} />,
    },
  ]

  const INFO_LINKS = [
    {
      href: '/more/about',
      title: dict.morePage.aboutApp,
      theme: 'sky' as const,
      icon: <Info className="size-6 text-white" strokeWidth={1.85} />,
    },
    {
      href: '/more/privacy',
      title: dict.morePage.privacy,
      theme: 'emerald' as const,
      icon: <ShieldCheck className="size-6 text-white" strokeWidth={1.85} />,
    },
    {
      href: '/more/disclaimer',
      title: dict.morePage.disclaimer,
      theme: 'slate' as const,
      icon: <Scale className="size-6 text-white" strokeWidth={1.85} />,
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
              theme="emerald"
              icon={<BookOpen className="size-6 text-white" strokeWidth={1.85} />}
            />
            <LiveVisualCard
              href="/search"
              title={dict.morePage.search}
              theme="indigo"
              icon={<Search className="size-6 text-white" strokeWidth={1.85} />}
            />
            <LiveVisualCard
              href="/more/reminders"
              title={dict.morePage.reminders}
              theme="rose"
              icon={<HandHeart className="size-6 text-white" strokeWidth={1.85} />}
            />
            <LiveVisualCard
              href="/prayer/settings"
              title={dict.morePage.prayerSettings}
              theme="slate"
              icon={<Settings className="size-6 text-white" strokeWidth={1.85} />}
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
                theme={l.theme}
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
              theme="amber"
              icon={<Star className="size-6 text-white" strokeWidth={1.85} />}
              onClick={handleRate}
            />
            <LiveVisualCard
              title={copied ? 'Copied!' : dict.morePage.share}
              theme="teal"
              icon={
                copied ? (
                  <Check className="size-6 text-white" strokeWidth={1.85} />
                ) : (
                  <Share2 className="size-6 text-white" strokeWidth={1.85} />
                )
              }
              onClick={handleShare}
            />
            <LiveVisualCard
              title={dict.morePage.qr}
              theme="indigo"
              icon={<QrCode className="size-6 text-white" strokeWidth={1.85} />}
              onClick={() => setShowQR(true)}
            />
            <LiveVisualCard
              title={dict.morePage.exit}
              theme="rose"
              icon={<LogOut className="size-6 text-white" strokeWidth={1.85} />}
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
              theme="sky"
              icon={<LifeBuoy className="size-6 text-white" strokeWidth={1.85} />}
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
                theme={l.theme}
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
              onClick={() => setShowQR(false)}
              className="absolute left-4 top-4 rounded-full bg-muted p-2 text-muted-foreground hover:bg-muted/80"
            >
              <X className="size-5" />
            </button>
            <h2 className="mb-1 text-xl font-bold text-foreground">
              {dict.morePage.qr}
            </h2>
            <div className="mx-auto mb-6 mt-4 flex w-full items-center justify-center rounded-2xl border-4 border-emerald-500/30 bg-white p-4">
              <QRCode
                value={PLAY_STORE_URL}
                size={200}
                level="H"
                fgColor="#0a1f1a"
              />
            </div>
            <button
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
