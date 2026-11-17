'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useHorizontalSwipe } from '@/lib/use-swipe'

// ⚠️ نفس ترتيب الأقسام في BottomNav
const MAIN_PAGES = ['/prayer', '/quran', '/adhkar', '/sahihayn', '/qibla', '/more']

/**
 * التنقل بالسحب بين الأقسام الرئيسية فقط.
 * يستخدم replace حتى لا تتراكم الأقسام في سجل الرجوع.
 */
export function SwipeNavigation() {
  const router = useRouter()
  const pathname = usePathname().replace(/\/$/, '') || '/'
  const index = MAIN_PAGES.indexOf(pathname)

  useHorizontalSwipe({
    enabled: index !== -1,
    onSwipe: (dir) => {
      // RTL: السحب لليمين = القسم السابق في الترتيب
      if (dir === 'right' && index > 0) {
        router.replace(MAIN_PAGES[index - 1])
      } else if (dir === 'left' && index < MAIN_PAGES.length - 1) {
        router.replace(MAIN_PAGES[index + 1])
      }
    },
  })

  return null
}