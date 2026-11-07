import type { Metadata, Viewport } from 'next'
import { Amiri, IBM_Plex_Sans_Arabic } from 'next/font/google'
import './globals.css'

import { AdhanEngine } from '@/components/adhan-engine'
import { DailyMessageModal } from '@/components/daily-message'
import { NativeBackHandler } from '@/components/native-back-handler'
import { QuranPlayerProvider } from '@/lib/quran-player'
import { BottomNav } from '@/components/bottom-nav'
import { FirstRun } from '@/components/setup/first-run'
import { SplashScreen } from '@/components/splash-screen'
import { LanguageProvider } from '@/lib/language-context' // ✅ استيراد مزود اللغة

const plex = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  variable: '--font-plex',
})

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-amiri',
})

export const metadata: Metadata = {
  title: 'إسلامي | Islami',
  description: 'تطبيق إسلامي شامل: مواقيت الصلاة، القرآن الكريم، الأذكار، والقبلة.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-512.png',
    apple: '/icon-512.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a1f1a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={`${plex.variable} ${amiri.variable}`}>
      <body className="min-h-dvh bg-background text-foreground font-sans antialiased">
        {/* ✅ تغليف التطبيق بالكامل بمزود اللغة */}
        <LanguageProvider>
          <QuranPlayerProvider>
            <SplashScreen />
            <FirstRun />

            <AdhanEngine />
            <NativeBackHandler />
            <DailyMessageModal />

            <main className="min-h-dvh pb-16 [&:has(.mushaf-root)]:pb-0">
              {children}
            </main>

            <BottomNav />
          </QuranPlayerProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}