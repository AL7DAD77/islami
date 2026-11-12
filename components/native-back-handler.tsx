'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { App } from '@capacitor/app'
import { Capacitor, registerPlugin } from '@capacitor/core'

// تسجيل إضافة الخروج (AppExit) التي تنقل التطبيق للخلفية دون قتله
const AppExit = Capacitor.isNativePlatform()
  ? registerPlugin<any>('AppExit')
  : null

export function NativeBackHandler() {
  const router = useRouter()
  const pathname = usePathname()
  
  // استخدام useRef لتخزين pathname الحالي (لقراءته بشكل متزامن)
  const pathnameRef = useRef(pathname)
  
  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let backListener: any = null

    // دالة متزامنة لاعتراض زر الرجوع
    const handleBackButton = () => {
      const currentPath = pathnameRef.current
      
      // إذا كنا في الصفحة الرئيسية، انقل التطبيق للخلفية (لا تقتله)
      if (
        currentPath === '/' || 
        currentPath === '' || 
        currentPath === '/prayer'
      ) {
        if (AppExit) {
          AppExit.exit() // ينقل التطبيق للخلفية دون قتله
        }
        return true // منع السلوك الافتراضي
      }
      
      // إذا كنا في صفحة فرعية، ارجع للخلف
      router.back()
      return true // منع السلوك الافتراضي
    }

    // تسجيل المستمع
    App.addListener('backButton', handleBackButton).then(listener => {
      backListener = listener
    })

    return () => {
      if (backListener) backListener.remove()
    }
  }, [router])

  return null
}