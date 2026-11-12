'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { App } from '@capacitor/app'
import { Capacitor, registerPlugin } from '@capacitor/core'

const AppExit = Capacitor.isNativePlatform()
  ? registerPlugin<any>('AppExit')
  : null

// جذور التبويبات: من هنا يخرج الرجوع إلى شاشة الهاتف
const TAB_ROOTS = ['/', '/prayer', '/quran', '/adhkar', '/sahihayn', '/qibla', '/more']

function normalizePath(path: string | null): string {
  if (!path) return '/'
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

export function NativeBackHandler() {
  const router = useRouter()
  const pathname = usePathname()

  const pathnameRef = useRef(pathname)

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let isActive = true
    let backListener: { remove: () => Promise<void> } | null = null

    const handleBackButton = () => {
      const currentPath = normalizePath(pathnameRef.current)

      // جذر تبويب: الخروج إلى شاشة الهاتف دون قتل التطبيق
      if (TAB_ROOTS.includes(currentPath)) {
        AppExit?.exit().catch(() => {})
        return
      }

      // صفحة فرعية: ارجع خطوة، وإن لم يوجد سجل انتقل إلى الرئيسية
      if (window.history.length > 1) {
        router.back()
      } else {
        router.replace('/prayer')
      }
    }

    App.addListener('backButton', handleBackButton).then(listener => {
      if (isActive) {
        backListener = listener
      } else {
        listener.remove()
      }
    })

    return () => {
      isActive = false
      backListener?.remove()
    }
  }, [router])

  return null
}