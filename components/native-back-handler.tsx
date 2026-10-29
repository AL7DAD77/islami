'use client'

import { useEffect } from 'react'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

export function NativeBackHandler() {
  useEffect(() => {
    // التأكد من أننا نعمل على الهاتف
    if (!Capacitor.isNativePlatform()) return

    let backListener: any = null

    const setupListener = async () => {
      backListener = await App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          // إذا كان هناك صفحة سابقة داخل التطبيق، ارجع لها
          window.history.back()
        } else {
          // إذا كنا في الصفحة الرئيسية، أغلق التطبيق وعُد لشاشة الهاتف
          // ✅ هذا الأمر لا يلغي الإشعارات لأنها تعتمد على نظام أندرويد
          App.exitApp() 
        }
      })
    }

    setupListener()

    return () => {
      if (backListener) {
        backListener.remove()
      }
    }
  }, [])

  return null
}