'use client'

import { useEffect } from 'react'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { usePathname, useRouter } from 'next/navigation'

export function NativeBackHandler() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // التأكد من أننا نعمل على الهاتف (أندرويد) وليس المتصفح
    if (!Capacitor.isNativePlatform()) return

    let backListener: any = null

    const setupListener = async () => {
      backListener = await App.addListener('backButton', () => {
        // قائمة بالصفحات الرئيسية (إذا كان فيها، يغلق التطبيق)
        const rootPages = ['/', '/prayer', '/quran', '/adhkar', '/more', '/kids', '/qibla', '/tasbih']
        
        // إذا كان في صفحة رئيسية، أغلق التطبيق
        if (rootPages.includes(pathname)) {
          App.exitApp()
        } else {
          // إذا كان في صفحة فرعية، ارجع للخلف
          router.back()
        }
      })
    }

    setupListener()

    // تنظيف المستمع (Listener) عند إغلاق المكون
    return () => {
      if (backListener) {
        backListener.remove()
      }
    }
  }, [pathname, router])

  return null
}