'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { App } from '@capacitor/app'
import { Capacitor, registerPlugin } from '@capacitor/core'

const AppExit = Capacitor.isNativePlatform()
  ? registerPlugin<{ exit: () => Promise<void> }>('AppExit')
  : null

// الشاشة الرئيسية للتطبيق
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
  const lastBackPressRef = useRef<number>(0)
  const lastHandledAtRef = useRef<number>(0)
  const [showExitToast, setShowExitToast] = useState(false)

  useEffect(() => {
    pathnameRef.current = pathname
    setShowExitToast(false)
  }, [pathname])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let isActive = true
    let backListener: { remove: () => Promise<void> } | null = null

    const handleBackButton = () => {
      if (!isActive) return

      // منع معالجة نفس الضغطة مرتين لو أُطلق الحدث من أكثر من قناة
      const now = Date.now()
      if (now - lastHandledAtRef.current < 250) {
        return
      }
      lastHandledAtRef.current = now

      const rawLocationPath =
        typeof window !== 'undefined' && window.location.pathname
          ? window.location.pathname
          : pathnameRef.current

      const current = normalizePath(rawLocationPath)

      // 1. الرئيسية: ضغطتان خلال ثانيتين للخروج إلى شاشة الهاتف
      if (HOME_PATHS.includes(current)) {
        if (now - lastBackPressRef.current < 2000) {
          lastBackPressRef.current = 0
          setShowExitToast(false)
          AppExit?.exit().catch(() => {})
        } else {
          lastBackPressRef.current = now
          setShowExitToast(true)
          window.setTimeout(() => {
            if (isActive) {
              setShowExitToast(false)
            }
          }, 2000)
        }
        return
      }

      setShowExitToast(false)

      // 2. صفحة فرعية متفرعة: العودة التدريجية إلى جذر قسمها أولاً
      if (isSubPage(current)) {
        router.replace(sectionRoot(current))
        return
      }

      // 3. جذر قسم ليس الرئيسية: العودة إلى الرئيسية للتطبيق
      router.replace(APP_HOME)
    }

    const onWindowBackButton = () => {
      handleBackButton()
    }

    window.addEventListener('backButton', onWindowBackButton)

    App.addListener('backButton', handleBackButton).then((listener) => {
      if (isActive) {
        backListener = listener
      } else {
        listener.remove()
      }
    })

    return () => {
      isActive = false
      window.removeEventListener('backButton', onWindowBackButton)
      backListener?.remove()
    }
  }, [router])

  if (!showExitToast) return null

  return (
    <div
      dir="rtl"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[9999] flex justify-center px-4"
    >
      <div className="rounded-full bg-zinc-900/95 px-4 py-2 text-xs font-bold text-white shadow-xl">
        اضغط مرة أخرى للخروج من التطبيق
      </div>
    </div>
  )
}
