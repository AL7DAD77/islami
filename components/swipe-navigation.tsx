'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// ⚠️ نفس ترتيب الأقسام في BottomNav
const MAIN_PAGES = [
  '/prayer',
  '/quran',
  '/adhkar',
  '/adhkar/tasbih',
  '/qibla',
  '/more',
]

export function SwipeNavigation() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let startX = 0
    let startY = 0
    let startTime = 0

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0]
      startX = t.clientX
      startY = t.clientY
      startTime = Date.now()
    }

    const onEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      const deltaX = t.clientX - startX
      const deltaY = t.clientY - startY
      const duration = Date.now() - startTime

      // شروط: سريع + أفقي + كافي
      if (duration > 500) return
      if (Math.abs(deltaX) < 80) return
      if (Math.abs(deltaY) > Math.abs(deltaX) / 2) return

      // ⚠️ تحديد الصفحة الحالية
      let index = -1
      for (let i = 0; i < MAIN_PAGES.length; i++) {
        const page = MAIN_PAGES[i]
        if (page === '/adhkar' && pathname.startsWith('/adhkar') && pathname !== '/adhkar/tasbih') {
          index = i
          break
        }
        if (pathname === page || pathname.startsWith(page + '/')) {
          index = i
          break
        }
      }

      if (index === -1) return

      // ⚠️ RTL: السحب يمين = الصفحة السابقة (في ترتيب RTL)
      if (deltaX > 0 && index > 0) {
        router.push(MAIN_PAGES[index - 1])
      } else if (deltaX < 0 && index < MAIN_PAGES.length - 1) {
        router.push(MAIN_PAGES[index + 1])
      }
    }

    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchend', onEnd)
    }
  }, [pathname, router])

  return null
}