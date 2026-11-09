'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { App } from '@capacitor/app'
import { Capacitor, registerPlugin } from '@capacitor/core'

// ✅ تسجيل إضافة الخروج (AppExit) التي أضفناها في MainActivity.java
const AppExit = Capacitor.isNativePlatform()
  ? registerPlugin<any>('AppExit')
  : null

export function NativeBackHandler() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let backListener: any = null

    // ✅ دالة موحدة للتعامل مع زر الرجوع
    const handleBackAction = async () => {
      // هل نحن في الصفحة الرئيسية؟
      const isHome =
        pathname === '/prayer' ||
        pathname === '/' ||
        pathname === ''

      if (isHome) {
        // ✅ نقل التطبيق للخلفية (لا يغلق الإشعارات ولا الخدمات)
        if (AppExit) {
          try {
            await AppExit.exit()
          } catch (e) {
            // احتياطي في حال فشل الـ Plugin
            App.exitApp()
          }
        } else {
          App.exitApp()
        }
        return
      }

      // ✅ إذا لم نكن في الرئيسية، ارجع صفحة واحدة
      router.back()
    }

    const setupListener = async () => {
      backListener = await App.addListener('backButton', handleBackAction)
    }

    setupListener()

    // مستمع إضافي للحدث الذي يرسله MainActivity.java
    window.addEventListener('backButton', handleBackAction)

    return () => {
      if (backListener) backListener.remove()
      window.removeEventListener('backButton', handleBackAction)
    }
  }, [pathname, router])

  return null
}