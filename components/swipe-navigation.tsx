'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useHorizontalSwipe } from '@/lib/use-swipe'

// ⚠️ نفس ترتيب الأقسام في BottomNav
const MAIN_PAGES = ['/prayer', '/quran', '/adhkar', '/kids', '/qibla', '/more']

/**
 * التنقل بالسحب بين الأقسام الرئيسية فقط.
 * لا يعمل داخل الصفحات الفرعية (مثل المصحف وصفحات الأذكار) حتى لا يتعارض مع التمرير
 * ومع سحب المصحف الخاص بها.
 */
export function SwipeNavigation() {
  const router = useRouter()
  const pathname = usePathname().replace(/\/$/, '') || '/'
  const index = MAIN_PAGES.indexOf(pathname)

  useHorizontalSwipe({
    enabled: index !== -1,
    onSwipe: (dir) => {
      // RTL: السحب لليمين = القسم السابق في الترتيب
      if (dir === 'right' && index > 0) router.push(MAIN_PAGES[index - 1])
      else if (dir === 'left' && index < MAIN_PAGES.length - 1) router.push(MAIN_PAGES[index + 1])
    },
  })

  return null
}
