'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

export function NativeBackHandler() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    // ✅ نستمع لحدث "backButton" من Capacitor
    let backListener: any = null

    const setupListener = async () => {
      backListener = await App.addListener('backButton', ({ canGoBack }) => {
        // هل نحن في الصفحة الرئيسية؟
        const isHome =
          pathname === '/prayer' ||
          pathname === '/' ||
          pathname === ''

        if (isHome) {
          // ✅ اخرج من التطبيق
          App.exitApp()
          return
        }

        // ✅ إذا لم نكن في الرئيسية، ارجع صفحة واحدة باستخدام Next.js Router
        router.back()
      })
    }

    setupListener()

    // ✅ أيضاً نستمع لحدث "backButton" الذي يرسله MainActivity.java
    const handleNativeBack = () => {
      const isHome =
        pathname === '/prayer' ||
        pathname === '/' ||
        pathname === ''

      if (isHome) {
        App.exitApp()
      } else {
        router.back()
      }
    }

    window.addEventListener('backButton', handleNativeBack)

    return () => {
      if (backListener) {
        backListener.remove()
      }
      window.removeEventListener('backButton', handleNativeBack)
    }
  }, [pathname, router])

  return null
}