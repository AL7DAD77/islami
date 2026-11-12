'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { App } from '@capacitor/app'
import { Capacitor, registerPlugin } from '@capacitor/core'

const AppExit = Capacitor.isNativePlatform()
  ? registerPlugin<any>('AppExit')
  : null

// الشاشة الرئيسية للتطبيق: الخروج منها فقط يخرج إلى شاشة الهاتف
const APP_HOME = '/prayer'
const HOME_PATHS = ['/', '/prayer']

function normalizePath(path: string | null): string {
  if (!path) return '/'
  const trimmed = path.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

function segments(path: string): string[] {
  return path.split('/').filter(Boolean)
}

// جذر القسم: /more/reminders ← /more
function sectionRoot(path: string): string {
  const first = segments(path)[0]
  return first ? `/${first}` : '/'
}

function isSubPage(path: string): boolean {
  return segments(path).length > 1
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
      const current = normalizePath(pathnameRef.current)

      // 1. الرئيسية: الخروج إلى شاشة الهاتف دون إغلاق التطبيق
      if (HOME_PATHS.includes(current)) {
        AppExit?.exit().catch(() => {})
        return
      }

      // 2. صفحة فرعية: العودة إلى جذر قسمها
      if (isSubPage(current)) {
        router.replace(sectionRoot(current))
        return
      }

      // 3. جذر قسم ليس الرئيسية: العودة إلى الرئيسية للتطبيق
      router.replace(APP_HOME)
    }

    App.addListener('backButton', handleBackButton).then((listener) => {
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