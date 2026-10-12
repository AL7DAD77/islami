'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { exitNativeApp, isNativePlatform } from '@/lib/native'

// الصفحات الرئيسية (التبويبات السفلية): زر الرجوع فيها يخرج من التطبيق إلى واجهة الهاتف
const ROOT_PAGES = ['/', '/prayer', '/quran', '/adhkar', '/kids', '/qibla', '/more']

export function NativeBackHandler() {
  const router = useRouter()
  const pathname = usePathname()
  const pathRef = useRef(pathname)
  pathRef.current = pathname

  useEffect(() => {
    if (!isNativePlatform()) return
    let remove: (() => void) | null = null

    import('@capacitor/app').then(({ App }) => {
      App.addListener('backButton', () => {
        const path = pathRef.current
        if (ROOT_PAGES.includes(path)) {
          // إيقاف أي صوت قرآن يعمل داخل الصفحة ثم الخروج النهائي
          try {
            ;(window as any).__stopQuran?.()
          } catch {}
          exitNativeApp()
          return
        }
        // صفحة داخلية: ارجع خطوة، وإن لم يوجد سجل فاذهب لأقرب تبويب رئيسي
        if (window.history.length > 1) {
          router.back()
        } else {
          router.push('/prayer')
        }
      }).then((h) => {
        remove = () => h.remove()
      })
    })

    return () => {
      if (remove) remove()
    }
  }, [router])

  return null
}
