import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Amiri, IBM_Plex_Sans_Arabic } from 'next/font/google'
import { AdhanEngine } from '@/components/adhan-engine'
import { BottomNav } from '@/components/bottom-nav'
import { DailyMessageModal } from '@/components/daily-message'
import { SplashScreen } from '@/components/splash-screen'
import { SwipeNavigation } from '@/components/swipe-navigation'
import { QuranPlayerProvider } from '@/lib/quran-player'
import './globals.css'

const plex = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  variable: '--font-plex',
})
const amiri = Amiri({ subsets: ['arabic'], weight: ['400', '700'], variable: '--font-amiri' })

export const metadata: Metadata = {
  title: 'إسلامي - التطبيق الإسلامي الشامل',
  description:
    'مواقيت الصلاة مع أصوات أذان متعددة، التقويم الهجري، القرآن الكريم بتلاوات أشهر القراء، الأذكار وحصن المسلم والرقية الشرعية، القبلة، وتعليم الأطفال.',
  generator: 'v0.app',
  applicationName: 'إسلامي',
  appleWebApp: { capable: true, title: 'إسلامي', statusBarStyle: 'default' },
  icons: { icon: '/icon-512.png', apple: '/icon-512.png' },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f3ea' },
    { media: '(prefers-color-scheme: dark)', color: '#10211c' },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${plex.variable} ${amiri.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <SplashScreen />
        <QuranPlayerProvider>
          <AdhanEngine />
          <DailyMessageModal />
          <SwipeNavigation />
          <main className="mx-auto min-h-dvh max-w-2xl px-4 pb-28">{children}</main>
          <BottomNav />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </QuranPlayerProvider>
      </body>
    </html>
  )
}