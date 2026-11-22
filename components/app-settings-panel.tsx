'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import QRCode from 'react-qr-code'
import {
  Bell,
  BookOpen,
  Check,
  ChevronLeft,
  Compass,
  Copy,
  Hash,
  Headphones,
  LogOut,
  Moon,
  QrCode,
  RotateCcw,
  Share2,
  Sliders,
  Sparkles,
  Star,
  Sun,
  Vibrate,
  X,
} from 'lucide-react'

import { useSettings } from '@/lib/settings'
import { useNumberFormat } from '@/lib/numbers'
import { useLanguage } from '@/lib/language-context'
import { ThemeToggle } from '@/components/theme-toggle'
import { DailyMessageToggle } from '@/components/daily-message-toggle'
import { exitNativeApp, isNativePlatform } from '@/lib/native'
import { cn } from '@/lib/utils'

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.alhaddad.islami'

const NIGHT_MODE_KEY = 'mushaf-night-mode'
const WIRD_PAGES_KEY = 'mushaf-daily-wird-pages'
const RECITER_SERVER_KEY = 'selected_reciter_server'
const RECITER_NAME_KEY = 'selected_reciter_name'

const DEFAULT_RECITER_SERVER = 'https://server8.mp3quran.net/afs/'
const DEFAULT_RECITER_NAME = 'مشاري العفاسي'

export function AppSettingsPanel() {
  const router = useRouter()
  const { dict } = useLanguage()
  const [settings, updateSettings] = useSettings()
  const { formatValue } = useNumberFormat()

  const [nightMode, setNightMode] = useState(false)
  const [wirdPages, setWirdPages] = useState<number>(10)
  const [reciterName, setReciterName] = useState<string>(DEFAULT_RECITER_NAME)
  const [savedNotice, setSavedNotice] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [isApp, setIsApp] = useState(false)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    setIsApp(isNativePlatform())
    try {
      const savedNight = localStorage.getItem(NIGHT_MODE_KEY) === 'true'
      setNightMode(savedNight)

      const savedWird = Number(localStorage.getItem(WIRD_PAGES_KEY))
      if (Number.isFinite(savedWird) && savedWird > 0) {
        setWirdPages(savedWird)
      }

      const savedReciter = localStorage.getItem(RECITER_NAME_KEY)
      if (savedReciter) {
        setReciterName(savedReciter)
      }
    } catch {
      // تجاهل أخطاء التخزين المحلي
    }
  }, [])

  const notifySaved = (label: string) => {
    setSavedNotice(label)
    window.setTimeout(() => {
      setSavedNotice((prev) => (prev === label ? '' : prev))
    }, 1800)
  }

  const triggerHapticIfEnabled = (enabled: boolean) => {
    if (!enabled) return
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(12)
      }
    } catch {
      // تجاهل أخطاء الاهتزاز
    }
  }

  const handleToggleNightMode = () => {
    const next = !nightMode
    setNightMode(next)
    try {
      localStorage.setItem(NIGHT_MODE_KEY, String(next))
    } catch {}
    triggerHapticIfEnabled(Boolean(settings.vibrationEnabled))
    notifySaved(next ? 'تم تفعيل الوضع الليلي' : 'تم تفعيل الوضع النهاري')
  }

  const handleToggleVibration = () => {
    const next = !Boolean(settings.vibrationEnabled)
    updateSettings?.({ vibrationEnabled: next } as never)
    if (next) {
      triggerHapticIfEnabled(true)
    }
    notifySaved(next ? 'تم تشغيل الاهتزاز' : 'تم إيقاف الاهتزاز')
  }

  const handleCycleNumeralMode = () => {
    const rawSettings = settings as unknown as Record<string, unknown>
    const currentMode = rawSettings.numeralMode
    const nextMode = currentMode === 'en' || currentMode === 'latin' ? 'ar' : 'en'
    updateSettings?.({ numeralMode: nextMode } as never)
    triggerHapticIfEnabled(Boolean(settings.vibrationEnabled))
    notifySaved(nextMode === 'ar' ? 'الأرقام العربية (١٢٣)' : 'الأرقام الإنجليزية (123)')
  }

  const handleSelectWird = (pages: number) => {
    setWirdPages(pages)
    try {
      localStorage.setItem(WIRD_PAGES_KEY, String(pages))
    } catch {}
    triggerHapticIfEnabled(Boolean(settings.vibrationEnabled))
    notifySaved(`تم ضبط الورد اليومي على ${formatValue(pages)} صفحات`)
  }

  const handleRate = () => {
    window.open(PLAY_STORE_URL, '_blank', 'noopener,noreferrer')
  }

  const handleShare = async () => {
    const text = dict.morePage?.subtitle || 'Islami'
    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({
          title: 'Islami',
          text,
          url: PLAY_STORE_URL,
          dialogTitle: dict.morePage?.share || 'مشاركة التطبيق',
        })
      } catch {}
      return
    }

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Islami', text, url: PLAY_STORE_URL })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text}\n${PLAY_STORE_URL}`)
        setCopied(true)
        notifySaved('تم نسخ رابط المشاركة')
        window.setTimeout(() => setCopied(false), 2000)
      }
    } catch {}
  }

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(PLAY_STORE_URL)
        setCopied(true)
        notifySaved('تم نسخ الرابط')
        window.setTimeout(() => setCopied(false), 2000)
      }
    } catch {}
  }

  const handleExit = async () => {
    if (isApp) {
      await exitNativeApp()
    } else if (typeof window !== 'undefined') {
      window.close()
    }
  }

  const handleResetDefaults = () => {
    setNightMode(false)
    setWirdPages(10)
    setReciterName(DEFAULT_RECITER_NAME)
    try {
      localStorage.setItem(NIGHT_MODE_KEY, 'false')
      localStorage.setItem(WIRD_PAGES_KEY, '10')
      localStorage.setItem(RECITER_SERVER_KEY, DEFAULT_RECITER_SERVER)
      localStorage.setItem(RECITER_NAME_KEY, DEFAULT_RECITER_NAME)
    } catch {}
    updateSettings?.({
      vibrationEnabled: true,
      numeralMode: 'ar',
    } as never)
    notifySaved('تمت استعادة الإعدادات الافتراضية')
  }

  const rawSettings = settings as unknown as Record<string, unknown>
  const numeralMode = String(rawSettings.numeralMode || 'ar')

  const navigationItems = [
    {
      label: 'إعدادات مواقيت الصلاة',
      sublabel: '/prayer/settings',
      href: '/prayer/settings',
      icon: Compass,
    },
    {
      label: 'إعدادات الأذان والصوت',
      sublabel: '/prayer/adhan',
      href: '/prayer/adhan',
      icon: Bell,
    },
    {
      label: 'التذكيرات والتنبيهات',
      sublabel: '/more/reminders',
      href: '/more/reminders',
      icon: Bell,
    },
    {
      label: 'اختيار القارئ وخادم التلاوة',
      sublabel: reciterName,
      href: '/quran/reciters',
      icon: Headphones,
    },
    {
      label: 'إدارة الورد اليومي',
      sublabel: '/quran/wird',
      href: '/quran/wird',
      icon: BookOpen,
    },
    {
      label: 'دعاء ختم القرآن',
      sublabel: '/quran/khatmah-dua',
      href: '/quran/khatmah-dua',
      icon: Sparkles,
    },
  ]

  return (
    <div dir="rtl" className="mx-auto w-full max-w-2xl space-y-4 p-4">
      <div className="flex items-center justify-between rounded-2xl border p-4">
        <div className="flex items-center gap-2.5">
          <Sliders className="size-5 text-amber-600" />
          <div>
            <h1 className="text-base font-bold">إعدادات التطبيق</h1>
            <p className="text-xs opacity-75">
              جميع إعدادات التطبيق والمصحف والصوت والتنبيهات في مكان واحد
            </p>
          </div>
        </div>

        {savedNotice ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <Check className="size-3.5" />
            {savedNotice}
          </span>
        ) : null}
      </div>

      {/* إعدادات المظهر والرسائل والتنبيه */}
      <div className="grid grid-cols-2 gap-2.5">
        <ThemeToggle />
        <DailyMessageToggle />
      </div>

      {/* إعدادات المصحف واللمس والأرقام */}
      <div className="space-y-2 rounded-2xl border p-3">
        <button
          type="button"
          onClick={handleToggleNightMode}
          className="flex w-full items-center justify-between rounded-xl border p-3 text-right transition-colors hover:bg-black/5"
        >
          <span className="flex items-center gap-2.5 text-sm font-bold">
            {nightMode ? (
              <Moon className="size-4 text-amber-500" />
            ) : (
              <Sun className="size-4 text-amber-500" />
            )}
            <span>وضع قراءة المصحف</span>
          </span>
          <span className="rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-bold">
            {nightMode ? 'ليلي' : 'نهاري'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleToggleVibration}
          className="flex w-full items-center justify-between rounded-xl border p-3 text-right transition-colors hover:bg-black/5"
        >
          <span className="flex items-center gap-2.5 text-sm font-bold">
            <Vibrate className="size-4 text-amber-500" />
            <span>الاهتزاز اللمسي</span>
          </span>
          <span
            className={cn(
              'rounded-lg px-2.5 py-1 text-xs font-bold',
              settings.vibrationEnabled
                ? 'bg-emerald-600/15 text-emerald-700'
                : 'bg-black/10',
            )}
          >
            {settings.vibrationEnabled ? 'مفعّل' : 'متوقف'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleCycleNumeralMode}
          className="flex w-full items-center justify-between rounded-xl border p-3 text-right transition-colors hover:bg-black/5"
        >
          <span className="flex items-center gap-2.5 text-sm font-bold">
            <Hash className="size-4 text-amber-500" />
            <span>نمط الأرقام</span>
          </span>
          <span className="rounded-lg bg-black/5 px-2.5 py-1 text-xs font-bold">
            {numeralMode === 'en' || numeralMode === 'latin'
              ? '123 (إنجليزي)'
              : '١٢٣ (عربي)'}
          </span>
        </button>
      </div>

      {/* مقدار الورد اليومي السريع */}
      <div className="space-y-2.5 rounded-2xl border p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-bold">
            <BookOpen className="size-4 text-amber-500" />
            <span>مقدار الورد اليومي</span>
          </span>
          <span className="text-xs font-bold opacity-75">
            {formatValue(wirdPages)} صفحات
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[5, 10, 20].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => handleSelectWird(count)}
              className={cn(
                'rounded-xl border py-2 text-xs font-bold transition-colors',
                wirdPages === count && 'border-amber-600 bg-amber-600 text-white',
              )}
            >
              {formatValue(count)} صفحات
            </button>
          ))}
        </div>
      </div>

      {/* صفحات الإعدادات المتخصصة الفعلية */}
      <div className="space-y-2 rounded-2xl border p-3">
        {navigationItems.map((item) => {
          const IconComponent = item.icon
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href)}
              className="flex w-full items-center justify-between rounded-xl border p-3 text-right transition-colors hover:bg-black/5"
            >
              <span className="flex items-center gap-2.5 text-sm font-bold">
                <IconComponent className="size-4 text-amber-500" />
                <span>{item.label}</span>
              </span>
              <span className="flex items-center gap-1 text-xs font-bold opacity-80">
                <span>{item.sublabel}</span>
                <ChevronLeft className="size-4" />
              </span>
            </button>
          )
        })}
      </div>

      {/* إجراءات التطبيق (التقييم، المشاركة، QR، الخروج) */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleRate}
          className="flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-colors hover:bg-black/5"
        >
          <Star className="size-4 text-amber-500" />
          <span>{dict.morePage?.rate || 'تقييم التطبيق'}</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-colors hover:bg-black/5"
        >
          {copied ? (
            <Check className="size-4 text-emerald-600" />
          ) : (
            <Share2 className="size-4 text-amber-500" />
          )}
          <span>{copied ? 'تم النسخ' : dict.morePage?.share || 'مشاركة التطبيق'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowQR(true)}
          className="flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-colors hover:bg-black/5"
        >
          <QrCode className="size-4 text-amber-500" />
          <span>{dict.morePage?.qr || 'رمز QR'}</span>
        </button>

        <button
          type="button"
          onClick={handleExit}
          className="flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-colors hover:bg-black/5"
        >
          <LogOut className="size-4 text-amber-500" />
          <span>{dict.morePage?.exit || 'خروج'}</span>
        </button>
      </div>

      {/* استعادة الافتراضي */}
      <button
        type="button"
        onClick={handleResetDefaults}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 py-3 text-xs font-bold text-red-700 transition-colors hover:bg-red-500/15 dark:text-red-300"
      >
        <RotateCcw className="size-4" />
        <span>استعادة الإعدادات الافتراضية</span>
      </button>

      {/* نافذة رمز QR */}
      {showQR && (
        <div
          onClick={() => setShowQR(false)}
          className="fixed inset-0 z-80 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          dir="rtl"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl border bg-background p-6 text-center shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setShowQR(false)}
              aria-label="إغلاق رمز QR"
              className="absolute left-4 top-4 rounded-full border p-2 hover:bg-black/5"
            >
              <X className="size-4" />
            </button>

            <h2 className="mb-4 text-base font-bold">
              {dict.morePage?.qr || 'رمز QR للتطبيق'}
            </h2>

            <div className="mx-auto mb-5 flex w-full items-center justify-center rounded-2xl border bg-white p-4">
              <QRCode value={PLAY_STORE_URL} size={190} level="H" fgColor="#0a1f1a" />
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-colors hover:bg-black/5"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              <span>{copied ? 'تم نسخ الرابط' : 'نسخ رابط التطبيق'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
